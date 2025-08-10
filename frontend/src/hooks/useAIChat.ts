import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
}

interface StreamResponse {
  type: 'start' | 'chunk' | 'complete' | 'error';
  content?: string;
  fullResponse?: string;
  error?: string;
  targetChatId?: string | null;
  timestamp?: string;
}

export const useAIChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    prompt: string,
    conversationHistory: ChatMessage[] = [],
    targetChatId?: string | null,
    onStreamUpdate?: (response: string) => void,
    onComplete?: (response: string) => void,
    onError?: (error: string) => void
  ) => {
    if (!prompt.trim() || isLoading) return;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    setStreamingResponse('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          conversationHistory,
          targetChatId: targetChatId || null
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamResponse = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk') {
                const currentResponse = data.fullResponse || '';
                setStreamingResponse(currentResponse);
                fullResponse = currentResponse;
                
                if (onStreamUpdate) {
                  onStreamUpdate(currentResponse);
                }
              } else if (data.type === 'complete') {
                fullResponse = data.content || fullResponse;
                setStreamingResponse('');
                
                if (onComplete) {
                  onComplete(fullResponse);
                }
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Unknown error occurred');
              }
            } catch (parseError) {
              // Ignore parsing errors for incomplete JSON
              console.debug('Parse error (expected during streaming):', parseError);
            }
          }
        }
      }

      return fullResponse;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't set error state
        return '';
      }
      
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      console.error('AI Chat Error:', error);
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      return '';
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isLoading]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setStreamingResponse('');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendMessage,
    cancelRequest,
    clearError,
    isLoading,
    error,
    streamingResponse
  };
};
