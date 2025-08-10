"use client";

import React, { useState } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { Navigation } from '../../components/Navigation';
import { useAuth } from '../../hooks/use-auth';
import { useTemplates, Template } from '../../hooks/useTemplates';
import { AISidebar } from '../../components/ai/AISidebar';
import { AIChatInterface } from '../../components/ai/AIChatInterface';
import { ChatMessage, ChatSession } from '../../hooks/useAIChat';

export default function AIPage() {
  const { user } = useAuth();
  const { templates, toggleFavorite } = useTemplates();
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [selectedChatForReply, setSelectedChatForReply] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Mock chat list for demo - in real app, this would come from your chat API
  const mockChats = [
    { id: '1', name: 'John Doe', lastMessage: 'Thanks for the info!' },
    { id: '2', name: 'Marketing Team', lastMessage: 'When can we schedule the meeting?' },
    { id: '3', name: 'Sarah Wilson', lastMessage: 'I need help with my order' },
    { id: '4', name: 'Project Alpha', lastMessage: 'The deadline has been moved' },
  ];

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    // Trigger prompt setting in the interface
    if (currentSession || createNewSession()) {
      // The template will be used to pre-populate the input
    }
  };

  const createNewSession = (): ChatSession => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `New Chat ${new Date().toLocaleTimeString()}`,
      messages: [],
      createdAt: new Date()
    };
    setCurrentSession(newSession);
    return newSession;
  };

  const updateSession = (session: ChatSession) => {
    setCurrentSession({ ...session });
    setChatHistory(prev => {
      const filtered = prev.filter(s => s.id !== session.id);
      return [session, ...filtered];
    });
  };

  const handleHistorySelect = (session: ChatSession) => {
    setCurrentSession(session);
  };

  const handleHistoryDelete = (sessionId: string) => {
    setChatHistory(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
  };

  const handleTemplateFavorite = (templateId: string) => {
    toggleFavorite(templateId);
  };

  const handleSendToChat = async (message: string, chatId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatId,
          message: message,
          type: 'text'
        }),
      });

      if (response.ok) {
        setSuccessMessage('Message sent successfully!');
        return true;
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      return false;
    }
  };

  if (!user) {
    return <div>Please log in to access AI features.</div>;
  }

  return (
    <>
      <Navigation />
      <Box className="h-[calc(100vh-4rem)] flex bg-gray-100 dark:bg-gray-900">
        {/* Left Sidebar */}
        <AISidebar
          templates={templates}
          chatHistory={chatHistory}
          onTemplateSelect={handleTemplateSelect}
          onHistorySelect={handleHistorySelect}
          onHistoryDelete={handleHistoryDelete}
          onTemplateFavorite={handleTemplateFavorite}
        />

        {/* Main Chat Interface */}
        <AIChatInterface
          currentSession={currentSession}
          onSessionUpdate={updateSession}
          onNewSession={createNewSession}
          selectedChatForReply={selectedChatForReply}
          onChatForReplyChange={setSelectedChatForReply}
          availableChats={mockChats}
          onSendToChat={handleSendToChat}
        />
      </Box>
      
      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
