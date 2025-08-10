"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Chip,
  Badge,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Circle as CircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';

import { useSocketContext } from '../../contexts/SocketContext';
import { useRealtimeStore, useMessages, useDevices, useConnectionStatus, useIsConnected } from '../../stores/realtime-store';
import { ChatsList } from './ChatsList';
import { MessageThread } from './MessageThread';
import { ChatDetailsPane } from './ChatDetailsPane';
import { DeviceSelector } from './DeviceSelector';
import { backendAPI, BackendDevice } from '../../lib/backend-api';

interface SelectedChat {
  chatId: string;
  deviceId: string;
  chatName: string;
}

interface RealtimeChatProps {
  initialDevices?: BackendDevice[];
  autoConnect?: boolean;
  onStatusChange?: (status: 'connected' | 'disconnected' | 'error' | 'connecting') => void;
}

export function RealtimeChatInterface({ 
  initialDevices = [], 
  autoConnect = true,
  onStatusChange 
}: RealtimeChatProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Real-time state - use individual selectors to prevent infinite loops
  const isConnected = useIsConnected();
  const connectionStatus = useConnectionStatus();
  const messages = useMessages();
  const devices = useDevices();
  
  // Socket integration - use shared context
  const { connect, disconnect, emit } = useSocketContext();
  
  // Handle connection status changes
  useEffect(() => {
    if (isConnected) {
      onStatusChange?.('connected');
      setNotificationsEnabled(true);
    } else {
      onStatusChange?.(connectionStatus);
      setNotificationsEnabled(false);
    }
  }, [isConnected, connectionStatus]); // Remove onStatusChange to prevent loop

  // Device subscription helpers (using emit since we no longer have direct useSocket)
  const subscribeToDevice = useCallback((deviceId: string) => {
    if (isConnected) {
      emit('device:subscribe', deviceId);
    }
  }, [isConnected, emit]);

  const unsubscribeFromDevice = useCallback((deviceId: string) => {
    if (isConnected) {
      emit('device:unsubscribe', deviceId);
    }
  }, [isConnected, emit]);

  // Local state
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [availableDevices, setAvailableDevices] = useState<BackendDevice[]>(initialDevices);
  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load devices and subscribe to real-time updates  
  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedDevices = await backendAPI.getDevices();
      const connectedDevices = fetchedDevices.filter(device => device.status === 'ready');
      
      setAvailableDevices(connectedDevices);
      
      // Auto-select first device if none selected - use functional update to avoid dependency issues
      if (connectedDevices.length > 0) {
        setSelectedDevices(prevSelected => {
          if (prevSelected.length === 0) {
            const firstDeviceId = connectedDevices[0].deviceId;
            // Also subscribe if connected
            if (isConnected) {
              subscribeToDevice(firstDeviceId);
            }
            return [firstDeviceId];
          }
          return prevSelected;
        });
      }
    } catch (err) {
      console.error('Failed to load devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [isConnected, subscribeToDevice]); // Only include stable dependencies

  // Handle device selection changes
  const handleDeviceSelectionChange = useCallback((newSelectedDevices: string[]) => {
    setSelectedDevices(prevSelected => {
      // Unsubscribe from previously selected devices
      prevSelected.forEach(deviceId => {
        if (!newSelectedDevices.includes(deviceId)) {
          unsubscribeFromDevice(deviceId);
        }
      });

      // Subscribe to newly selected devices
      newSelectedDevices.forEach(deviceId => {
        if (!prevSelected.includes(deviceId) && isConnected) {
          subscribeToDevice(deviceId);
        }
      });

      return newSelectedDevices;
    });
  }, [isConnected, subscribeToDevice, unsubscribeFromDevice]);

  // Handle chat selection
  const handleChatSelect = (chatId: string, deviceId: string, chatName: string) => {
    const newSelectedChat = { chatId, deviceId, chatName };
    setSelectedChat(newSelectedChat);
    
    // Mark chat as active for real-time message updates
    if (isConnected) {
      emit('chat:join', { chatId, deviceId });
    }
  };

  // Handle connection management
  const handleReconnect = () => {
    setError(null);
    connect();
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
        }
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
      }
    } else {
      setNotificationsEnabled(!notificationsEnabled);
    }
  };

  // Subscribe to selected devices when connection status changes
  useEffect(() => {
    if (isConnected && selectedDevices.length > 0) {
      selectedDevices.forEach(deviceId => {
        subscribeToDevice(deviceId);
      });
    }
  }, [isConnected, selectedDevices.length]); // Use length to avoid array reference issues

  // Auto-subscribe to first device when devices are loaded and connected - handled in loadDevices now
  // useEffect removed to prevent duplicate subscription logic

  // Update unread count from real-time messages
  useEffect(() => {
    if (messages.length === 0 || selectedDevices.length === 0) {
      setUnreadCount(0);
      return;
    }
    
    const newMessages = messages.filter(msg => 
      msg.status !== 'read' && 
      msg.from !== 'me' &&
      selectedDevices.includes(msg.deviceId)
    );
    setUnreadCount(newMessages.length);
  }, [messages.length, selectedDevices.join(',')]); // Use primitive values to avoid reference issues

  // Load devices on component mount
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Handle mobile back to chats
  const handleBackToChats = () => {
    setSelectedChat(null);
  };

  // Connection status indicator
  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <WifiIcon className="text-green-500" />;
      case 'connecting':
        return <CircularProgress size={20} className="text-blue-500" />;
      case 'error':
        return <WarningIcon className="text-red-500" />;
      default:
        return <WifiOffIcon className="text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected - Real-time updates active';
      case 'connecting':
        return 'Connecting to real-time updates...';
      case 'error':
        return 'Connection error - Some features may not work';
      default:
        return 'Disconnected - Real-time updates unavailable';
    }
  };

  return (
    <Box className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Real-time Status Bar */}
      <Paper className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" elevation={0} square>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center space-x-3">
            <Tooltip title={getConnectionStatusText()}>
              <IconButton size="small" onClick={connectionStatus === 'error' ? handleReconnect : undefined}>
                {getConnectionStatusIcon()}
              </IconButton>
            </Tooltip>
            
            <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
              {isConnected ? (
                <span className="flex items-center">
                  <CircleIcon className="w-2 h-2 text-green-500 mr-1" />
                  Live
                </span>
              ) : (
                <span className="flex items-center">
                  <CircleIcon className="w-2 h-2 text-gray-400 mr-1" />
                  Offline
                </span>
              )}
            </Typography>

            {selectedDevices.length > 0 && (
              <Chip
                label={`${selectedDevices.length} device${selectedDevices.length > 1 ? 's' : ''}`}
                size="small"
                variant="outlined"
                className="bg-blue-50 border-blue-200 text-blue-700"
              />
            )}
          </Box>

          <Box className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} max={99} color="error">
                <NotificationsIcon className="text-gray-600" />
              </Badge>
            )}
            
            <Tooltip title={notificationsEnabled ? "Notifications enabled" : "Notifications disabled"}>
              <IconButton size="small" onClick={handleToggleNotifications}>
                {notificationsEnabled ? (
                  <NotificationsIcon className="text-green-500" />
                ) : (
                  <NotificationsOffIcon className="text-gray-400" />
                )}
              </IconButton>
            </Tooltip>

            {connectionStatus === 'error' && (
              <Tooltip title="Reconnect">
                <IconButton size="small" onClick={handleReconnect}>
                  <RefreshIcon className="text-blue-500" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          className="mx-4 my-2"
        >
          {error}
        </Alert>
      )}

      {/* Main Chat Interface */}
      <Box className="flex-1 flex overflow-hidden">
        {/* Left Panel - Device Selector & Chats List */}
        <Paper
          className={`
            ${isMobile ? (selectedChat ? 'hidden' : 'flex') : 'flex'} 
            flex-col w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-700
          `}
          elevation={0}
          square
        >
          <DeviceSelector
            devices={availableDevices}
            selectedDevices={selectedDevices}
            onSelectionChange={handleDeviceSelectionChange}
            loading={loading}
            error={error}
            onRefresh={loadDevices}
          />
          
          <ChatsList
            selectedDevices={selectedDevices}
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
            disabled={selectedDevices.length === 0}
          />
        </Paper>

        {/* Center Panel - Message Thread */}
        <Box 
          className={`
            ${isMobile ? (selectedChat ? 'flex' : 'hidden') : 'flex'} 
            flex-1 flex-col
          `}
        >
          <MessageThread
            selectedChat={selectedChat}
            onShowDetails={() => setShowDetails(true)}
            onBackToChats={handleBackToChats}
            isMobile={isMobile}
          />
        </Box>

        {/* Right Panel - Chat Details */}
        <Paper 
          className={`
            ${isMobile 
              ? (showDetails ? 'fixed inset-0 z-50 flex' : 'hidden') 
              : (selectedChat && showDetails ? 'flex' : 'hidden')
            } 
            flex-col w-full md:w-80 lg:w-96 border-l border-gray-200 dark:border-gray-700
          `}
          elevation={0}
          square
        >
          <ChatDetailsPane
            selectedChat={selectedChat}
            onClose={() => setShowDetails(false)}
            isMobile={isMobile}
          />
        </Paper>
      </Box>
    </Box>
  );
}

export default RealtimeChatInterface;
