"use client";

import { useState, useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { Navigation } from '../../components/Navigation';
import { RealtimeChatInterface } from '../../components/chat/RealtimeChatInterface';
import { useAuth } from '../../hooks/use-auth';
import { backendAPI, BackendDevice } from '../../lib/backend-api';

interface SelectedChat {
  chatId: string;
  deviceId: string;
  chatName: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | 'connecting'>('disconnected');
  const [initialDevices, setInitialDevices] = useState<BackendDevice[]>([]);

  // Load initial devices for the real-time interface
  useEffect(() => {
    const loadInitialDevices = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        const devices = await backendAPI.getDevices();
        const connectedDevices = devices.filter(device => device.status === 'ready');
        setInitialDevices(connectedDevices);
      } catch (err) {
        console.error('Failed to load initial devices:', err);
        setError(err instanceof Error ? err.message : 'Failed to load devices');
      } finally {
        setLoading(false);
      }
    };

    loadInitialDevices();
  }, [user]);

  const handleConnectionStatusChange = (status: 'connected' | 'disconnected' | 'error' | 'connecting') => {
    setConnectionStatus(prev => {
      if (prev !== status) {
        console.log('🔗 Connection status changed from', prev, 'to:', status);
        return status;
      }
      return prev;
    });
  };

  if (!user) {
    return (
      <>
        <Navigation />
        <Box className="min-h-screen flex items-center justify-center">
          <Typography variant="h6" className="text-gray-600 dark:text-gray-400">
            Please log in to access the chat interface.
          </Typography>
        </Box>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <Box className="min-h-screen flex items-center justify-center">
          <Box className="text-center">
            <CircularProgress size={40} className="mb-4" />
            <Typography variant="h6" className="text-gray-600 dark:text-gray-400">
              Loading WhatsApp interface...
            </Typography>
          </Box>
        </Box>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
        <Box className="min-h-screen flex items-center justify-center p-4">
          <Alert severity="error" className="max-w-lg">
            <Typography variant="h6" className="mb-2">
              Failed to load chat interface
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        </Box>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <Box className="h-[calc(100vh-4rem)]">
        <RealtimeChatInterface
          initialDevices={initialDevices}
          autoConnect={true}
          onStatusChange={handleConnectionStatusChange}
        />
      </Box>
    </>
  );
}
