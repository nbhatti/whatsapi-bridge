"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Paper,
  TextField,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
  Chip,
  Dialog
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Call as CallIcon,
  VideoCall as VideoCallIcon,
  Info as InfoIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon,
  LocationOn as LocationIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Reply as ReplyIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  GraphicEq as GraphicEqIcon
} from '@mui/icons-material';
import { MessageComposer } from './MessageComposer';
import { LocationPicker } from './LocationPicker';
import { AudioPlayer } from './AudioPlayer';
import { MediaThumbnail } from './MediaThumbnail';
import { MediaPlayerDialog } from './MediaPlayer';
import { backendAPI, BackendMessage } from '../../lib/backend-api';
import { useMessages, useRealtimeStore } from '../../stores/realtime-store'; // Import the useMessages hook
import { DisplayMessage, MessageStatus } from '../../types/media';
import {
  MessageAction,
  ReplyAction,
  ForwardAction,
  DeleteAction,
  StarAction,
  ReactAction,
  MessageContextMenuItem,
  MessageSelection,
  NewMessageData
} from '../../types/message-actions';

interface Message {
  id: string;
  rawId?: string | object; // To store the original ID for replies
  text: string;
  timestamp: string;
  sender: 'me' | 'other';
  status: 'composing' | 'queued' | 'processing' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'image' | 'file' | 'location' | 'audio';
  queueInfo?: {
    position?: number;
    estimatedTime?: number;
    priority?: 'high' | 'normal' | 'low';
  };
  replyTo?: {
    id: string;
    text: string;
    sender: string;
  };
  mentions?: string[];
  attachmentUrl?: string;
  attachmentName?: string;
  duration?: number; // For audio messages
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

interface SelectedChat {
  chatId: string;
  deviceId: string;
  chatName: string;
}

interface MessageThreadProps {
  selectedChat: SelectedChat | null;
  onShowDetails: () => void;
  onBackToChats: () => void;
  isMobile: boolean;
}

export function MessageThread({ selectedChat, onShowDetails, onBackToChats, isMobile }: MessageThreadProps) {
  const chatId = selectedChat?.chatId;
  const deviceId = selectedChat?.deviceId;
  const chatName = selectedChat?.chatName;
  const allMessages = useMessages(); // Get all messages from the store
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [mediaPlayerOpen, setMediaPlayerOpen] = useState(false);
  const [selectedMediaMessage, setSelectedMediaMessage] = useState<BackendMessage | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { addMessage, updateMessage } = useRealtimeStore(); // Get store actions

  // Filter messages for the selected chat
  useEffect(() => {
    if (chatId) {
      const chatMessages = allMessages.filter(msg => msg.to === chatId || msg.from === chatId);
      const converted = chatMessages.map(convertBackendMessage);
      setMessages(converted);
    }
  }, [allMessages, chatId]);

  // Chat data based on selected chat
  const chatData = selectedChat ? {
    id: chatId,
    name: chatName || `Contact ${chatId?.split('-')[1]}`,
    avatar: undefined,
    isOnline: true,
    lastSeen: new Date().toISOString()
  } : null;

  // Convert backend message to frontend format
  const convertBackendMessage = (backendMsg: BackendMessage, index?: number): Message => {
    const safeString = (value: any, fallback = ''): string => {
      if (typeof value === 'string') return value;
      if (value === null || typeof value === 'undefined') return fallback;
      if (typeof value === 'object') {
        if (value.server && value.user && value._serialized) {
          return `[Message Reference: ${value._serialized}]`;
        }
        return '[Unsupported Content]';
      }
      return String(value);
    };

    // Extract proper message ID - handle both string and object formats
    let messageId: string;
    if (typeof backendMsg.id === 'string') {
      messageId = backendMsg.id;
    } else if (backendMsg.id && typeof backendMsg.id === 'object') {
      // Handle complex ID objects from WhatsApp.js
      const idObj = backendMsg.id as any;
      if (idObj._serialized) {
        messageId = String(idObj._serialized);
      } else if (idObj.id) {
        messageId = String(idObj.id);
      } else if (idObj.server && idObj.user) {
        // Create ID from server and user components
        messageId = `${idObj.fromMe ? 'true' : 'false'}_${idObj.user}@${idObj.server}_${idObj._serialized || Date.now()}`;
      } else {
        // Fallback: stringify the object
        messageId = JSON.stringify(idObj).replace(/[^a-zA-Z0-9]/g, '_');
      }
    } else {
      // Create a unique fallback ID using timestamp, chat ID, and index
      messageId = `msg-${chatId}-${backendMsg.timestamp}-${index || 0}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Extract quoted message ID if available
    let quotedMsgId: string | undefined;
    if (backendMsg.quotedMsg?.id) {
      if (typeof backendMsg.quotedMsg.id === 'string') {
        quotedMsgId = backendMsg.quotedMsg.id;
      } else if (backendMsg.quotedMsg.id && typeof backendMsg.quotedMsg.id === 'object' && '_serialized' in backendMsg.quotedMsg.id) {
        quotedMsgId = (backendMsg.quotedMsg.id as any)._serialized;
      }
    }

    // Handle different message types
    let messageText = safeString(backendMsg.body);
    let messageType: 'text' | 'image' | 'file' | 'location' | 'audio' = 'text';
    let attachmentUrl: string | undefined;
    let duration: number | undefined;
    
    // Process mentions from various sources in the backend message
    let mentions: string[] = [];
    
    // Extract mentions from different possible locations in the message
    if (backendMsg.mentionedIds && backendMsg.mentionedIds.length > 0) {
      mentions = backendMsg.mentionedIds;
    } else if (backendMsg._data?.mentionedIds && backendMsg._data.mentionedIds.length > 0) {
      mentions = backendMsg._data.mentionedIds;
    } else if (backendMsg.mentions && backendMsg.mentions.length > 0) {
      // If we have structured mention data, extract the IDs
      mentions = backendMsg.mentions.map(m => m.id || m.number || m.name || '').filter(Boolean);
    }
    
    // Also try to extract mentions from message body using regex
    // WhatsApp mentions typically appear as phone numbers in the message
    if (mentions.length === 0 && messageText) {
      const mentionRegex = /@(\d{10,15})/g; // Match @phonenumber pattern
      const bodyMentions = [];
      let match;
      while ((match = mentionRegex.exec(messageText)) !== null) {
        bodyMentions.push(`@${match[1]}`);
      }
      if (bodyMentions.length > 0) {
        mentions = bodyMentions;
      }
    }
    
    // Handle call log messages
    if (backendMsg.type === 'call_log') {
      const callData = backendMsg._data || backendMsg;
      const callOutcome = callData.callOutcome;
      const isVideoCall = callData.isVideoCall;
      const callDuration = callData.callDuration;
      
      const callIcon = isVideoCall ? '📹' : '📞';
      if (backendMsg.fromMe) {
        messageText = `${callIcon} Outgoing ${isVideoCall ? 'video ' : ''}call`;
      } else {
        switch (callOutcome) {
          case 'AcceptedElsewhere':
            messageText = `${callIcon} Call answered on another device`;
            break;
          case 'Missed':
            messageText = `${callIcon} Missed ${isVideoCall ? 'video ' : ''}call`;
            break;
          case 'Rejected':
            messageText = `${callIcon} Call declined`;
            break;
          case 'Accepted':
            if (callDuration) {
              const duration = Math.floor(callDuration / 60);
              messageText = `${callIcon} Call duration: ${duration}m`;
            } else {
              messageText = `${callIcon} ${isVideoCall ? 'Video' : 'Voice'} call`;
            }
            break;
          default:
            messageText = `${callIcon} ${isVideoCall ? 'Video' : 'Voice'} call`;
        }
      }
    }
    // Handle PTT (Push To Talk) audio messages
    else if (backendMsg.type === 'ptt' && backendMsg.hasMedia) {
      messageType = 'audio';
      // Use backend API to get proper media URL instead of deprecated URLs
      const extractedMessageId = typeof backendMsg.id === 'string' 
        ? backendMsg.id 
        : (backendMsg.id as any)?._serialized || (backendMsg.id as any)?.id || messageId;
      attachmentUrl = backendAPI.getMediaUrl(deviceId!, extractedMessageId, 'audio');
      duration = backendMsg.duration;
      if (!messageText) {
        const durationText = duration ? ` (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})` : '';
        messageText = `🎤 Voice message${durationText}`;
      }
    }
    // Handle image messages
    else if (backendMsg.type === 'image' && backendMsg.hasMedia) {
      messageType = 'image';
      // Use the media URL from the backend - could be deprecatedMms3Url or directPath
      attachmentUrl = backendMsg.deprecatedMms3Url || backendMsg.directPath;
      if (!messageText) {
        messageText = '📷 Image';
      }
    }
    // Handle other media messages
    else if (backendMsg.hasMedia) {
      messageType = 'file';
      attachmentUrl = backendMsg.deprecatedMms3Url || backendMsg.directPath;
      if (!messageText) {
        messageText = `📎 ${backendMsg.mimetype || 'File'}`;
      }
    }
    // Handle URL messages with previews
    else if (backendMsg.type === 'chat' && backendMsg.title && backendMsg.links?.length) {
      // This is a URL message with preview
      if (!messageText) {
        messageText = backendMsg.links[0].link;
      }
    }
    // Handle e2e_notification messages (usually security notifications)
    else if (backendMsg.type === 'e2e_notification') {
      messageText = '🔐 Security notification';
    }
    // Handle regular chat messages
    else if (backendMsg.type === 'chat') {
      // messageText is already set from backendMsg.body
    }
    // Handle unknown message types
    else if (!messageText) {
      messageText = `📄 ${backendMsg.type || 'Message'}`;
    }

    return {
      id: messageId,
      rawId: backendMsg.id, // Store the original ID
      text: messageText,
      timestamp: new Date(backendMsg.timestamp).toISOString(), // Backend already provides milliseconds
      sender: backendMsg.fromMe ? 'me' : 'other',
      status: 'read',
      type: messageType,
      replyTo: backendMsg.quotedMsg ? {
        id: quotedMsgId || `quoted-${Date.now()}`,
        text: safeString(backendMsg.quotedMsg.body, 'Quoted message'),
        sender: backendMsg.quotedMsg.fromMe ? 'You' : safeString(backendMsg.quotedMsg.author, chatData?.name || 'Contact')
      } : undefined,
      mentions: mentions.length > 0 ? mentions : undefined,
      attachmentUrl: attachmentUrl,
      duration: duration,
      location: backendMsg.location
    };
  };

  // Load messages from backend API
  const loadMessages = useCallback(async (reset: boolean = false) => {
    if (!chatId || !deviceId || loading) return;

    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      
      console.log(`Loading messages for chat ${chatId}, page ${currentPage}`);
      
      const response = await backendAPI.getMessages(deviceId, chatId, {
        limit: 50,
        // Add pagination support later if needed
      });

      const newMessages = response.data.map(convertBackendMessage);
      
      if (reset) {
        setMessages(newMessages);
        setPage(2);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
        setPage(currentPage + 1);
      }
      
      setHasMore(response.pagination.hasMore);
      console.log(`Loaded ${newMessages.length} messages for chat ${chatId}`);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [chatId, deviceId, loading, page]);

  // Load messages when chat changes
  useEffect(() => {
    if (chatId && deviceId) {
      console.log('Chat changed to:', chatId);
      setMessages([]); // Clear messages immediately
      setPage(1);
      setHasMore(true);
      setLoading(false); // Reset loading state
      loadMessages(true); // Load fresh messages
    }
  }, [chatId, deviceId]); // Removed loadMessages from dependency to prevent infinite loops

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Infinite scroll for loading older messages
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || loading || !hasMore) return;

    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop === 0) {
      loadMessages(false); // Load older messages
    }
  }, [loading, hasMore, loadMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Handle message sending with enhanced status tracking
  const handleSendMessage = async (data: NewMessageData) => {
    if (!chatId || !deviceId) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      body: data.text,
      timestamp: new Date().toISOString(),
      from: 'me',
      to: chatId,
      status: 'composing',
      type: 'text',
      deviceId: deviceId,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        sender: replyingTo.sender === 'me' ? 'You' : chatData?.name || 'Contact'
      } : undefined
    };

    addMessage(newMessage as any);
    setReplyingTo(null);

    try {
      updateMessage(tempId, { status: 'queued' });

      const messageData = {
        to: chatId,
        text: data.text,
        quotedMessageId: replyingTo?.rawId ? (typeof replyingTo.rawId === 'string' ? replyingTo.rawId : (replyingTo.rawId as any)?._serialized) : undefined,
        useQueue: true,
      };
      
      console.log('Sending message with data:', messageData); // DEBUG
      
      updateMessage(tempId, { status: 'processing' });
      const sentMessage = await backendAPI.sendUnifiedMessage(deviceId, messageData);
      
      // Update the message with the real ID and set status to 'sent'
      updateMessage(tempId, { id: sentMessage.id, status: 'sent' });
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      updateMessage(tempId, { status: 'failed' });
    }
  };

  // Poll for message status updates
  const pollMessageStatus = async (messageId: string, deviceId: string) => {
    let pollCount = 0;
    const maxPolls = 10;
    
    const poll = async () => {
      if (pollCount >= maxPolls) return;
      
      try {
        const status = await backendAPI.getMessageStatus(deviceId, messageId);
        
        if (status.message) {
          // Update message status based on backend response
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { 
              ...msg, 
              status: determineMessageStatus(status.message) 
            } : msg
          ));
        }
        
        pollCount++;
        
        // Continue polling if message is still being processed
        if (pollCount < maxPolls) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.warn('Failed to poll message status:', error);
        
        // Fallback progression for development
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, status: 'sent' } : msg
          ));
        }, 1000);
        
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, status: 'delivered' } : msg
          ));
        }, 3000);
      }
    };
    
    // Start polling after a short delay
    setTimeout(poll, 1000);
  };

  // Determine message status from backend response
  const determineMessageStatus = (messageData: any): Message['status'] => {
    if (messageData.acked) return 'delivered';
    if (messageData.sent) return 'sent';
    if (messageData.failed) return 'failed';
    return 'sending';
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!chatId) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text: '',
      timestamp: new Date().toISOString(),
      sender: 'me',
      status: 'sending',
      type: file.type.startsWith('image/') ? 'image' : 'file',
      attachmentUrl: URL.createObjectURL(file),
      attachmentName: file.name
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate upload
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
      ));
    }, 2000);
  };

  // Handle location sharing
  const handleLocationShare = (location: { latitude: number; longitude: number; address?: string }) => {
    if (!chatId) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text: location.address || 'Shared location',
      timestamp: new Date().toISOString(),
      sender: 'me',
      status: 'sending',
      type: 'location',
      location
    };

    setMessages(prev => [...prev, newMessage]);
    setShowLocationPicker(false);

    // Simulate sending
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
      ));
    }, 1000);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'composing':
        return <Box className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />;
      case 'queued':
        return <Box className="flex items-center">
          <Box className="w-2 h-2 bg-orange-400 rounded-full mr-1" />
          <Typography variant="caption" className="text-orange-600 text-xs">Q</Typography>
        </Box>;
      case 'processing':
        return <Box className="flex items-center">
          <CircularProgress size={10} className="text-blue-400" />
          <Typography variant="caption" className="text-blue-600 text-xs ml-1">...</Typography>
        </Box>;
      case 'sending':
        return <CircularProgress size={12} className="text-green-400" />;
      case 'sent':
        return <CheckIcon fontSize="small" className="text-gray-400" />;
      case 'delivered':
        return <DoneAllIcon fontSize="small" className="text-gray-400" />;
      case 'read':
        return <DoneAllIcon fontSize="small" className="text-blue-500" />;
      case 'failed':
        return <Box className="flex items-center">
          <Box className="w-3 h-3 bg-red-500 rounded-full" />
          <Typography variant="caption" className="text-red-600 text-xs ml-1">!</Typography>
        </Box>;
      default:
        return null;
    }
  };

  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const handleMessageContextMenu = (event: React.MouseEvent, message: Message) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedMessage(message);
    
    // Set the position for the context menu
    setContextMenuPosition({
      top: event.clientY,
      left: event.clientX
    });
    
    // Create a virtual anchor element at the exact mouse position
    const rect = {
      width: 0,
      height: 0,
      top: event.clientY,
      left: event.clientX,
      bottom: event.clientY,
      right: event.clientX,
      x: event.clientX,
      y: event.clientY,
      toJSON: () => ({})
    };
    
    const virtualAnchor = {
      nodeType: 1,
      clientWidth: 0,
      clientHeight: 0,
      getBoundingClientRect: () => rect,
      offsetTop: event.clientY,
      offsetLeft: event.clientX,
      offsetWidth: 0,
      offsetHeight: 0,
      scrollTop: 0,
      scrollLeft: 0,
      ownerDocument: document
    };
    
    setMenuAnchorEl(virtualAnchor as HTMLElement);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMessage(null);
  };

  // Enhanced message action handlers
  const handleReply = () => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
    }
    handleMenuClose();
  };

  const handleForward = async () => {
    if (!selectedMessage || !deviceId) return;
    
    try {
      // For now, we'll just show a placeholder - in a real app you'd show a chat selector
      const targetChatId = prompt('Enter chat ID to forward to:');
      if (targetChatId) {
        await backendAPI.forwardMessage(deviceId, {
          messageId: selectedMessage.id,
          to: targetChatId,
          fromChatId: chatId
        });
        
        // Show success message
        console.log('Message forwarded successfully');
      }
    } catch (error) {
      console.error('Failed to forward message:', error);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedMessage || !deviceId || !chatId) return;
    
    try {
      const forEveryone = selectedMessage.sender === 'me' && 
        confirm('Delete for everyone? (Cancel for delete for me only)');
      
      await backendAPI.deleteChatMessage(deviceId, chatId, {
        messageId: selectedMessage.id,
        forEveryone
      });
      
      // Remove message from UI
      setMessages(prev => prev.filter(msg => msg.id !== selectedMessage.id));
      
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
    handleMenuClose();
  };

  const handleCopy = () => {
    if (!selectedMessage) return;
    
    let textToCopy = '';
    
    if (selectedMessage.text) {
      textToCopy = selectedMessage.text;
    } else if (selectedMessage.attachmentUrl) {
      textToCopy = selectedMessage.attachmentUrl;
    } else if (selectedMessage.location) {
      textToCopy = `Location: ${selectedMessage.location.latitude}, ${selectedMessage.location.longitude}`;
      if (selectedMessage.location.address) {
        textToCopy += ` (${selectedMessage.location.address})`;
      }
    }
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log('Message copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy message:', err);
      });
    }
    
    handleMenuClose();
  };

  const handleStar = async () => {
    if (!selectedMessage || !deviceId) return;
    
    try {
      await backendAPI.starMessage(deviceId, selectedMessage.id, true);
      
      // Update message in UI (if we were tracking starred status)
      setMessages(prev => prev.map(msg => 
        msg.id === selectedMessage.id 
          ? { ...msg, isStarred: true }
          : msg
      ));
      
    } catch (error) {
      console.error('Failed to star message:', error);
    }
    handleMenuClose();
  };

  const handleReact = async (emoji: string) => {
    if (!selectedMessage || !deviceId) return;
    
    try {
      await backendAPI.reactToMessage(deviceId, selectedMessage.id, emoji);
      console.log(`Reacted to message with ${emoji}`);
    } catch (error) {
      console.error('Failed to react to message:', error);
    }
    handleMenuClose();
  };

  const handleMessageInfo = () => {
    if (!selectedMessage) return;
    
    // Show message info dialog (you'd implement this)
    alert(`Message Info:\nID: ${selectedMessage.id}\nTimestamp: ${selectedMessage.timestamp}\nType: ${selectedMessage.type}\nSender: ${selectedMessage.sender}`);
    handleMenuClose();
  };

  // Mark messages as read when they come into view
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!deviceId || !chatId || messageIds.length === 0) return;
    
    try {
      await backendAPI.markMessagesAsRead(deviceId, chatId, messageIds);
      
      // Update message status in UI
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id) && msg.sender === 'other'
          ? { ...msg, status: 'read' }
          : msg
      ));
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [deviceId, chatId]);

  // Auto-mark messages as read when they're displayed
  useEffect(() => {
    const unreadMessageIds = messages
      .filter(msg => msg.sender === 'other' && msg.status !== 'read')
      .map(msg => msg.id);
    
    if (unreadMessageIds.length > 0) {
      const timer = setTimeout(() => {
        markAsRead(unreadMessageIds);
      }, 1000); // Mark as read after 1 second of being visible
      
      return () => clearTimeout(timer);
    }
  }, [messages, markAsRead]);

  const renderMessage = (message: Message) => {
    const isMe = message.sender === 'me';
    
    // Defensive check to ensure all rendered values are strings
    const safeRender = (value: any, fallback = ''): string => {
      if (typeof value === 'string') return value;
      if (value === null || typeof value === 'undefined') return fallback;
      if (typeof value === 'object') {
        // You can add more specific object checks if needed
        return JSON.stringify(value);
      }
      return String(value);
    };
    
    return (
      <Box
        key={`${chatId}-${message.id}`}
        className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}
        onContextMenu={(e) => handleMessageContextMenu(e, message)}
      >
        <Paper
          className={`max-w-xs lg:max-w-md px-3 py-2 ${
            isMe 
              ? 'bg-green-100 dark:bg-green-900 text-black dark:text-white' 
              : 'bg-white dark:bg-gray-700 text-black dark:text-white'
          }`}
          elevation={1}
        >
          {message.replyTo && (
            <Box className="border-l-4 border-blue-500 pl-2 mb-2 bg-gray-50 dark:bg-gray-600 p-2 rounded">
              <Typography variant="caption" className="font-semibold text-blue-500">
                {safeRender(message.replyTo.sender)}
              </Typography>
              <Typography variant="body2" className="text-gray-600 dark:text-gray-300 truncate">
                {safeRender(message.replyTo.text)}
              </Typography>
            </Box>
          )}
          
          {message.type === 'image' && message.attachmentUrl && (
            <Box className="mb-2">
              <img 
                src={message.attachmentUrl} 
                alt="Shared image" 
                className="max-w-full rounded-lg"
                style={{ maxHeight: '200px' }}
              />
            </Box>
          )}
          
          {message.type === 'file' && message.attachmentName && (
            <Box className="mb-2 p-2 bg-gray-100 dark:bg-gray-600 rounded flex items-center">
              <AttachFileIcon className="mr-2" />
              <Typography variant="body2">{safeRender(message.attachmentName)}</Typography>
            </Box>
          )}
          
          {message.type === 'location' && message.location && (
            <Box className="mb-2 p-2 bg-gray-100 dark:bg-gray-600 rounded flex items-center">
              <LocationIcon className="mr-2 text-red-500" />
              <Box>
                <Typography variant="body2" className="font-semibold">Location</Typography>
                {message.location.address && (
                  <Typography variant="caption" className="text-gray-600 dark:text-gray-300">
                    {safeRender(message.location.address)}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          
          {message.type === 'audio' && message.attachmentUrl && (
            <AudioPlayer 
              audioUrl={message.attachmentUrl} 
              duration={message.duration} 
              isMe={isMe}
            />
          )}
          
          {message.text && (
            <div className="mb-1">
              <Typography variant="body2" component="span" className="inline">
                {safeRender(message.text)}
              </Typography>
              {message.mentions && message.mentions.map(mention => (
                <Chip
                  key={mention}
                  label={safeRender(mention)}
                  size="small"
                  className="ml-1 h-5"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </div>
          )}
          
          <Box className={`flex items-center ${isMe ? 'justify-end' : 'justify-start'} mt-1`}>
            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 mr-1">
              {safeRender(formatTimestamp(message.timestamp))}
            </Typography>
            {message.queueInfo && message.status === 'queued' && (
              <Typography variant="caption" className="text-orange-600 text-xs mr-1">
                Queue #{safeRender(message.queueInfo.position)}
              </Typography>
            )}
            {isMe && getStatusIcon(message.status)}
          </Box>
        </Paper>
      </Box>
    );
  };

  if (!chatId) {
    return (
      <Box className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <Typography variant="h6" className="text-gray-500 dark:text-gray-400">
          Select a chat to start messaging
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <Paper
        className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
        elevation={0}
        square
      >
        <Box className="flex items-center flex-1">
          {isMobile && (
            <IconButton onClick={onBackToChats} className="mr-2">
              <ArrowBackIcon />
            </IconButton>
          )}
          
          <Avatar className="mr-3 bg-blue-500">
            {chatData?.name?.[0]}
          </Avatar>
          
          <Box>
            <Typography variant="subtitle1" className="font-semibold">
              {chatData?.name}
            </Typography>
            <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
              {isTyping ? 'typing...' : (chatData?.isOnline ? 'online' : 'last seen recently')}
            </Typography>
          </Box>
        </Box>
        
        <Box className="flex items-center space-x-2">
          <IconButton>
            <CallIcon />
          </IconButton>
          <IconButton>
            <VideoCallIcon />
          </IconButton>
          <IconButton onClick={onShowDetails}>
            <InfoIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        {loading && hasMore && (
          <Box className="flex justify-center py-4">
            <CircularProgress size={24} />
          </Box>
        )}
        
        {messages.map(renderMessage)}
        
        {/* Typing indicator */}
        {isTyping && (
          <Box className="flex justify-start mb-2">
            <Paper className="bg-white dark:bg-gray-700 px-4 py-2 rounded-full" elevation={1}>
              <Box className="flex space-x-1">
                <Box className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <Box className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <Box className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </Box>
            </Paper>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Reply Preview */}
      {replyingTo && (
        <Box className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex items-center">
          <ReplyIcon className="mr-2 text-blue-500" />
          <Box className="flex-1">
            <Typography variant="caption" className="font-semibold text-blue-500">
              Replying to {replyingTo.sender === 'me' ? 'yourself' : chatData?.name}
            </Typography>
            <Typography variant="body2" className="truncate">
              {replyingTo.text}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setReplyingTo(null)}>
            ✕
          </IconButton>
        </Box>
      )}

      {/* Message Composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        onLocationShare={() => setShowLocationPicker(true)}
      />

      {/* Enhanced Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        anchorReference={contextMenuPosition ? "anchorPosition" : "anchorEl"}
        anchorPosition={contextMenuPosition ? contextMenuPosition : undefined}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleReply}>
          <ReplyIcon className="mr-2" />
          Reply
        </MenuItem>
        
        <MenuItem onClick={handleCopy}>
          <i className="material-icons mr-2">content_copy</i>
          Copy
        </MenuItem>
        
        <MenuItem onClick={handleForward}>
          <i className="material-icons mr-2">forward</i>
          Forward
        </MenuItem>
        
        <MenuItem onClick={handleStar}>
          <i className="material-icons mr-2">star</i>
          Star
        </MenuItem>
        
        {/* Reaction submenu */}
        <MenuItem onClick={() => handleReact('👍')}>
          👍 React
        </MenuItem>
        
        <MenuItem onClick={handleMessageInfo}>
          <InfoIcon className="mr-2" />
          Message Info
        </MenuItem>
        
        {selectedMessage?.sender === 'me' && [
          <MenuItem key="divider" divider />,
          <MenuItem key="delete" onClick={handleDelete} style={{ color: 'red' }}>
            <i className="material-icons mr-2">delete</i>
            Delete
          </MenuItem>
        ]}
      </Menu>

      {/* Location Picker Dialog */}
      <Dialog
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        maxWidth="md"
        fullWidth
      >
        <LocationPicker
          onLocationSelect={handleLocationShare}
          onClose={() => setShowLocationPicker(false)}
        />
      </Dialog>
    </Box>
  );
}
