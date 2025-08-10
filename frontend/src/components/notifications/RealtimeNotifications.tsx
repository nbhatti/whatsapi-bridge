"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Snackbar,
  Alert,
  Avatar,
  Box,
  Typography,
  IconButton,
  Slide,
  Paper,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  Message as MessageIcon,
  Phone as PhoneIcon,
  PhoneAndroid as DeviceIcon,
  Notifications as NotificationIcon,
  VolumeOff as MuteIcon
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';

import { useRealtimeStore, useMessages, useDevices } from '../../stores/realtime-store';
import { useSocketContext } from '../../contexts/SocketContext';

interface Notification {
  id: string;
  type: 'message' | 'device_status' | 'call' | 'system';
  title: string;
  message: string;
  avatar?: string;
  timestamp: Date;
  deviceId?: string;
  chatId?: string;
  priority: 'low' | 'normal' | 'high';
  persistent?: boolean;
}

interface RealtimeNotificationsProps {
  enabled?: boolean;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  maxNotifications?: number;
  autoHideDuration?: number;
  enableSound?: boolean;
  enablePushNotifications?: boolean;
}

function SlideTransition(props: TransitionProps & { children: React.ReactElement }) {
  return <Slide {...props} direction="down" />;
}

export function RealtimeNotifications({
  enabled = true,
  position = { vertical: 'top', horizontal: 'right' },
  maxNotifications = 5,
  autoHideDuration = 5000,
  enableSound = true,
  enablePushNotifications = true
}: RealtimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [muted, setMuted] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const messages = useMessages();
  const devices = useDevices();
  const { isConnected } = useSocketContext();

  // Check notification permission status
  useEffect(() => {
    if (enablePushNotifications && 'Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, [enablePushNotifications]);

  // Request notification permission on user interaction
  const requestNotificationPermission = useCallback(async () => {
    if (!enablePushNotifications || !('Notification' in window)) return;
    
    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        setPermissionGranted(permission === 'granted');
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
      }
    }
  }, [enablePushNotifications]);

  // Add notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    if (!enabled || muted) return;

    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Play notification sound
    if (enableSound && !muted) {
      playNotificationSound(notification.type);
    }

    // Show browser notification
    if (enablePushNotifications && permissionGranted && document.hidden) {
      showBrowserNotification(newNotification);
    }

    // Auto-hide non-persistent notifications
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, autoHideDuration);
    }
  }, [enabled, muted, maxNotifications, enableSound, enablePushNotifications, permissionGranted, autoHideDuration]);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Enable audio after user interaction
  const enableAudio = useCallback(() => {
    if (audioEnabled) return;
    
    // Try to play a silent audio to enable audio context
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAA=');
      audio.volume = 0;
      audio.play().then(() => {
        setAudioEnabled(true);
        console.log('✅ Audio enabled for notifications');
      }).catch(() => {
        console.log('❌ Failed to enable audio');
      });
    } catch (err) {
      console.log('❌ Audio not supported');
    }
  }, [audioEnabled]);

  // Play notification sound
  const playNotificationSound = (type: Notification['type']) => {
    // Don't play sound if audio is not enabled yet
    if (!audioEnabled) {
      console.log('🔇 Audio not enabled yet - click anywhere to enable notification sounds');
      return;
    }

    try {
      const audio = new Audio();
      switch (type) {
        case 'message':
          // WhatsApp-like message sound (you'd replace with actual sound file)
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0EJnfJ7N2QQAoUXrTp66hVFApGn+DyvmEcCS2J0fPReS0E=';
          break;
        case 'call':
          // Phone ring tone
          audio.src = 'data:audio/wav;base64,UklGRn4CAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVoCAAA=';
          break;
        case 'device_status':
          // System notification sound
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAA=';
          break;
        default:
          return;
      }
      audio.volume = 0.3;
      audio.play().catch(err => console.log('🔇 Audio playback failed:', err.message));
    } catch (err) {
      console.log('🔇 Audio not supported:', err);
    }
  };

  // Show browser notification
  const showBrowserNotification = (notification: Notification) => {
    if (!('Notification' in window) || !permissionGranted) return;

    const options: NotificationOptions = {
      body: notification.message,
      icon: notification.avatar || '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.chatId || notification.deviceId || notification.type,
      requireInteraction: notification.priority === 'high',
      silent: muted
    };

    const browserNotification = new Notification(notification.title, options);

    browserNotification.onclick = () => {
      window.focus();
      if (notification.chatId) {
        // Navigate to chat (you'd implement this based on your routing)
        console.log('Navigate to chat:', notification.chatId);
      }
      browserNotification.close();
    };

    // Auto-close after delay
    setTimeout(() => {
      browserNotification.close();
    }, autoHideDuration);
  };

  // Track the last processed message to avoid duplicates
  const lastProcessedMessageId = useRef<string>('');

  // Listen for new messages
  useEffect(() => {
    if (!isConnected || messages.length === 0) return;

    // Get the latest message
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage) return;

    // Skip if we already processed this message
    if (latestMessage.id === lastProcessedMessageId.current) return;

    // Only show notification for messages from others
    if (latestMessage.from === 'me') return;

    // Check if this is a new message (within last 5 seconds)
    const messageTime = new Date(latestMessage.timestamp);
    const now = new Date();
    if (now.getTime() - messageTime.getTime() > 5000) return;

    const chatName = latestMessage.from.split('@')[0]; // Extract name from WhatsApp ID

    addNotification({
      type: 'message',
      title: `New message from ${chatName}`,
      message: latestMessage.body || 'Media message',
      deviceId: latestMessage.deviceId,
      chatId: latestMessage.to,
      priority: 'normal'
    });

    // Mark this message as processed
    lastProcessedMessageId.current = latestMessage.id;
  }, [messages.length, isConnected]); // Remove addNotification from deps to prevent infinite loop

  // Listen for device status changes
  useEffect(() => {
    const latestDevice = devices[devices.length - 1];
    if (!latestDevice) return;

    // Check if this is a recent status change (within last 10 seconds)
    const deviceTime = new Date(latestDevice.updatedAt);
    const now = new Date();
    if (now.getTime() - deviceTime.getTime() > 10000) return;

    let title = '';
    let message = '';
    let priority: 'low' | 'normal' | 'high' = 'normal';

    switch (latestDevice.status) {
      case 'connected':
        title = 'Device Connected';
        message = `${latestDevice.name || 'WhatsApp Device'} is now online`;
        priority = 'low';
        break;
      case 'disconnected':
        title = 'Device Disconnected';
        message = `${latestDevice.name || 'WhatsApp Device'} went offline`;
        priority = 'normal';
        break;
      case 'error':
        title = 'Device Error';
        message = `${latestDevice.name || 'WhatsApp Device'} encountered an error`;
        priority = 'high';
        break;
      default:
        return;
    }

    addNotification({
      type: 'device_status',
      title,
      message,
      deviceId: latestDevice.id,
      priority
    });
  }, [devices.length]); // Remove addNotification from deps to prevent infinite loop

  // Toggle mute
  const toggleMute = () => {
    enableAudio(); // Enable audio when user interacts
    setMuted(!muted);
  };

  // Enable audio on any page interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!audioEnabled) {
        enableAudio();
      }
    };

    // Add event listeners for user interactions
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, [enableAudio, audioEnabled]);

  if (!enabled) return null;

  return (
    <Box
      className="fixed z-50 pointer-events-none"
      sx={{
        top: position.vertical === 'top' ? 16 : 'auto',
        bottom: position.vertical === 'bottom' ? 16 : 'auto',
        left: position.horizontal === 'left' ? 16 : 'auto',
        right: position.horizontal === 'right' ? 16 : 'auto',
        transform: position.horizontal === 'center' ? 'translateX(-50%)' : 'none',
        left: position.horizontal === 'center' ? '50%' : position.horizontal === 'left' ? 16 : 'auto',
        width: position.horizontal === 'center' ? 'auto' : 400,
        maxWidth: 'calc(100vw - 32px)'
      }}
    >
      {/* Mute Toggle Button */}
      <Box className="flex justify-end mb-2 pointer-events-auto">
        <IconButton
          size="small"
          onClick={toggleMute}
          className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg"
        >
          <Badge
            badgeContent={notifications.length}
            max={99}
            color="error"
            invisible={notifications.length === 0}
          >
            {muted ? <MuteIcon /> : <NotificationIcon />}
          </Badge>
        </IconButton>
      </Box>

      {/* Notifications Stack */}
      {notifications.map((notification, index) => (
        <Paper
          key={notification.id}
          className="mb-2 pointer-events-auto transform transition-all duration-300 ease-in-out"
          elevation={4}
          sx={{
            opacity: Math.max(0.3, 1 - index * 0.1),
            transform: `scale(${Math.max(0.9, 1 - index * 0.05)})`,
            zIndex: notifications.length - index
          }}
        >
          <Alert
            severity={
              notification.priority === 'high' ? 'error' :
              notification.priority === 'normal' ? 'info' : 'success'
            }
            variant="filled"
            action={
              <IconButton
                size="small"
                onClick={() => removeNotification(notification.id)}
                className="text-white"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            icon={
              notification.type === 'message' ? <MessageIcon /> :
              notification.type === 'call' ? <PhoneIcon /> :
              notification.type === 'device_status' ? <DeviceIcon /> :
              <NotificationIcon />
            }
            className="min-w-0"
          >
            <Box>
              <Typography variant="subtitle2" className="font-semibold text-white">
                {notification.title}
              </Typography>
              <Typography variant="body2" className="text-white/90 break-words">
                {notification.message}
              </Typography>
              <Typography variant="caption" className="text-white/70">
                {notification.timestamp.toLocaleTimeString()}
              </Typography>
            </Box>
          </Alert>
        </Paper>
      ))}

      {/* Clear All Button */}
      {notifications.length > 1 && (
        <Box className="flex justify-center mt-2 pointer-events-auto">
          <IconButton
            size="small"
            onClick={clearAllNotifications}
            className="bg-gray-800/80 text-white hover:bg-gray-700/80"
          >
            Clear All
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

export default RealtimeNotifications;
