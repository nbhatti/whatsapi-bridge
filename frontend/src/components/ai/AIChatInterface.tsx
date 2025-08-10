'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel
} from '@mui/material';
import { Send as SendIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useAIChat, ChatMessage, ChatSession } from '../../hooks/useAIChat';

interface AIChatInterfaceProps {
  currentSession: ChatSession | null;
  onSessionUpdate: (session: ChatSession) => void;
  onNewSession: () => ChatSession;
  selectedChatForReply: string;
  onChatForReplyChange: (chatId: string) => void;
  availableChats: Array<{ id: string; name: string; lastMessage: string }>;
  onSendToChat: (message: string, chatId: string) => Promise<boolean>;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  currentSession,
  onSessionUpdate,
  onNewSession,
  selectedChatForReply,
  onChatForReplyChange,
  availableChats,
  onSendToChat
}) => {
  const [prompt, setPrompt] = useState('');
  const { sendMessage, isLoading, error, streamingResponse, clearError } = useAIChat();
  const responseRef = useRef<HTMLDivElement>(null);
  const [sendingToChat, setSendingToChat] = useState(false);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [streamingResponse, currentSession?.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    let session = currentSession;
    if (!session) {
      session = onNewSession();
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };

    session.messages.push(userMessage);
    onSessionUpdate(session);

    const currentPrompt = prompt;
    setPrompt('');

    await sendMessage(
      currentPrompt,
      session.messages,
      selectedChatForReply || null,
      undefined,
      (response) => {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };
        session.messages.push(assistantMessage);
        onSessionUpdate(session);
      }
    );
  };

  const handleSendAIReplyToChat = async () => {
    if (!currentSession?.messages.length || !selectedChatForReply) return;

    const lastAIMessage = currentSession.messages
      .filter(m => m.role === 'assistant')
      .pop();

    if (!lastAIMessage) return;

    setSendingToChat(true);
    try {
      await onSendToChat(lastAIMessage.content, selectedChatForReply);
    } finally {
      setSendingToChat(false);
    }
  };

  const clearCurrentSession = () => {
    onSessionUpdate({ ...onNewSession(), messages: [] });
  };

  return (
    <Box className="flex-1 flex flex-col">
      <Box className="flex-1 p-4 overflow-y-auto" ref={responseRef}>
        {currentSession?.messages.map((message, index) => (
          <Box
            key={index}
            className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <Paper
              className={`inline-block max-w-[80%] p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
              elevation={1}
            >
              <Typography variant="body2" className="whitespace-pre-wrap">
                {message.content}
              </Typography>
              <Typography variant="caption" className="opacity-70 block mt-1">
                {message.timestamp.toLocaleTimeString()}
              </Typography>
            </Paper>
          </Box>
        ))}

        {streamingResponse && (
          <Box className="mb-4 text-left">
            <Paper className="inline-block max-w-[80%] p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" elevation={1}>
              <Typography variant="body2" className="whitespace-pre-wrap">
                {streamingResponse}
              </Typography>
              <Box className="flex items-center mt-2">
                <CircularProgress size={12} className="mr-2" />
                <Typography variant="caption" className="opacity-70">
                  AI is typing...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}

        {error && (
          <Alert severity="error" className="mb-4" onClose={clearError}>
            {error}
          </Alert>
        )}
      </Box>

      <Paper className="p-4 border-t border-gray-200 dark:border-gray-700" elevation={0} square>
        {currentSession?.messages.some(m => m.role === 'assistant') && (
          <Box className="mb-3 flex items-center gap-2">
            <FormControl size="small" className="min-w-48">
              <InputLabel>Send reply to chat</InputLabel>
              <Select
                value={selectedChatForReply}
                onChange={(e) => onChatForReplyChange(e.target.value)}
                label="Send reply to chat"
              >
                <MenuItem value="">
                  <em>Select a chat</em>
                </MenuItem>
                {availableChats.map((chat) => (
                  <MenuItem key={chat.id} value={chat.id}>
                    {chat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleSendAIReplyToChat}
              disabled={!selectedChatForReply || sendingToChat}
              size="small"
            >
              {sendingToChat ? 'Sending...' : 'Send to Chat'}
            </Button>
          </Box>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI anything about your conversations, or request help with replies..."
            disabled={isLoading}
            variant="outlined"
            className="flex-1"
          />
          <Box className="flex flex-col gap-2">
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !prompt.trim()}
              className="h-fit"
              startIcon={isLoading ? <CircularProgress size={16} /> : <SendIcon />}
            >
              {isLoading ? 'Sending' : 'Send'}
            </Button>
            <Button
              variant="outlined"
              onClick={clearCurrentSession}
              size="small"
              startIcon={<ClearIcon />}
              disabled={isLoading}
            >
              New Chat
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};
