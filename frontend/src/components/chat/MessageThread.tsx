"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  GraphicEq as GraphicEqIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { MessageComposer } from './MessageComposer';
import { LocationPicker } from './LocationPicker';
import { AudioPlayer } from './AudioPlayer';
import { MediaThumbnail } from './MediaThumbnail';
import { MediaPlayerDialog } from './MediaPlayer';
import { backendAPI, BackendMessage } from '../../lib/backend-api';
import { useMessages, useRealtimeStore, Message } from '../../stores/realtime-store';
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
  const allMessages = useMessages();
  const { addMessage, updateMessage, addOrUpdateMessages, removeMessage } = useRealtimeStore();
  
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [mediaPlayerOpen, setMediaPlayerOpen] = useState(false);
  const [selectedMediaMessage, setSelectedMediaMessage] = useState<BackendMessage | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => {
    if (!chatId) return [];
    const chatMessages = allMessages
      .filter(msg => msg.to === chatId || msg.from === chatId);
    
    // Sort by timestamp to ensure correct order
    chatMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return chatMessages;
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
      } else {
        // Create deterministic ID from object properties to avoid duplicates
        const keyParts = [
          idObj.fromMe ? 'true' : 'false',
          idObj.user || 'unknown',
          idObj.server || 'c.us',
          String(backendMsg.timestamp || Date.now())
        ];
        messageId = keyParts.join('_');
      }
    } else {
      // Create a deterministic fallback ID to avoid random duplicates
      const keyParts = [
        chatId || 'unknown',
        String(backendMsg.timestamp || Date.now()),
        String(index || 0),
        backendMsg.fromMe ? 'me' : 'other'
      ];
      messageId = `msg_${keyParts.join('_')}`;
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

    // Handle different message types - be more defensive about getting text
    let messageText = safeString(backendMsg.body || backendMsg.text || backendMsg.caption);
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
      const callData: any = backendMsg._data || backendMsg;
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

    // Extract from and to fields from the backend message structure
    const from = (backendMsg._data?.from || (typeof backendMsg.id === 'object' && (backendMsg.id as any).remote) || (backendMsg.fromMe ? 'me' : '')) as string;
    const to = (backendMsg._data?.to || chatId) as string | undefined;

    // Determine message status based on backend data
    let messageStatus: Message['status'] = 'read'; // Default fallback
    
    if (backendMsg.fromMe) {
      // For outgoing messages, check delivery/read status
      if (backendMsg.ack !== undefined) {
        switch (backendMsg.ack) {
          case 0: messageStatus = 'sending'; break;
          case 1: messageStatus = 'sent'; break;
          case 2: messageStatus = 'delivered'; break;
          case 3: messageStatus = 'read'; break;
          default: messageStatus = 'sent'; break;
        }
      } else {
        // Fallback for outgoing messages without ack info
        messageStatus = 'sent';
      }
    } else {
      // For incoming messages, they're typically already "delivered" to us
      messageStatus = 'read';
    }
    
    // Safe timestamp parsing with validation
    const safeTimestamp = (timestamp: any): string => {
      if (!timestamp) {
        return new Date().toISOString();
      }
      
      try {
        // Handle different timestamp formats
        let dateValue: Date;
        
        if (typeof timestamp === 'string') {
          dateValue = new Date(timestamp);
        } else if (typeof timestamp === 'number') {
          // Handle both milliseconds and seconds
          dateValue = timestamp > 1e10 ? new Date(timestamp) : new Date(timestamp * 1000);
        } else {
          dateValue = new Date(timestamp);
        }
        
        // Validate the date
        if (isNaN(dateValue.getTime())) {
          console.warn('Invalid timestamp received:', timestamp, 'using current time');
          return new Date().toISOString();
        }
        
        return dateValue.toISOString();
      } catch (error) {
        console.error('Error parsing timestamp:', timestamp, error);
        return new Date().toISOString();
      }
    };
    
    return {
      id: messageId,
      rawId: backendMsg.id, // Store the original ID
      text: messageText,
      timestamp: safeTimestamp(backendMsg.timestamp),
      from: from || '',
      to: to || chatId || '', // Ensure string
      sender: backendMsg.fromMe ? 'me' : 'other',
      status: messageStatus,
      type: messageType,
      replyTo: backendMsg.quotedMsg ? {
        id: quotedMsgId || `quoted-${Date.now()}`,
        text: safeString((backendMsg as any).quotedMsg?.body || (backendMsg as any).quotedMsg?.text, 'Quoted message'),
        sender: backendMsg.quotedMsg.fromMe ? 'You' : safeString(backendMsg.quotedMsg.author, chatData?.name || 'Contact')
      } : undefined,
      mentions: mentions.length > 0 ? mentions : undefined,
      attachmentUrl: attachmentUrl,
      duration: duration,
      location: backendMsg.location,
      deviceId: deviceId || ''
    };
  };

  // Load messages from backend API
  const loadMessages = useCallback(async (reset: boolean = false) => {
    if (!chatId || !deviceId || loading) return;

    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      
      const response = await backendAPI.getMessages(deviceId, chatId, {
        limit: 50,
        // Add pagination support later if needed
      });

      const newMessages = response.data.map(msg => convertBackendMessage(msg));
      addOrUpdateMessages(newMessages);
      
      if (reset) {
        setPage(2);
      } else {
        setPage(currentPage + 1);
      }
      
      setHasMore(response.pagination.hasMore);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [chatId, deviceId, loading, page, addOrUpdateMessages]);

  // Load messages when chat changes
  useEffect(() => {
    if (chatId && deviceId) {
      console.log('Chat changed to:', chatId);
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


  // Import WebSocket connection status from context
  const { isConnected: isSocketConnected } = useRealtimeStore();
  
  // Fallback polling - only when WebSocket is disconnected
  const pollingRef = useRef(false);
  const lastPollTimeRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const poll = useCallback(async () => {
    // Only poll if WebSocket is disconnected
    if (isSocketConnected || !deviceId || !chatId || loading || pollingRef.current) return;
    
    // Throttle polling to avoid excessive requests
    const now = Date.now();
    if (now - lastPollTimeRef.current < 5000) return; // 5 second throttle for fallback
    
    pollingRef.current = true;
    lastPollTimeRef.current = now;

    try {
      // WebSocket disconnected, falling back to polling for new messages
      
      // Get the latest messages since the last one we have
      const latestTimestamp = messages.length > 0 
        ? Math.max(...messages.map(m => new Date(m.timestamp).getTime()))
        : 0;
        
      const newMessages = await backendAPI.getChatMessages(deviceId, chatId, {
        limit: 10, // Reduced for fallback polling
        since: latestTimestamp
      });

      if (newMessages.length > 0) {
        const convertedMessages = newMessages.map((msg, idx) => convertBackendMessage(msg, idx));
        // Filter out any messages we already have to prevent duplicates
        const existingIds = new Set(messages.map(m => m.id));
        const trulyNewMessages = convertedMessages.filter(m => !existingIds.has(m.id));
        
        if (trulyNewMessages.length > 0) {
          addOrUpdateMessages(trulyNewMessages);
        }
      }
    } catch (error) {
      console.error('Failed to poll messages:', error);
    } finally {
      pollingRef.current = false;
    }
  }, [isSocketConnected, deviceId, chatId, loading, messages.length, addOrUpdateMessages]);

  // Start/stop polling based on WebSocket connection status
  useEffect(() => {
    if (deviceId && chatId) {
      if (!isSocketConnected) {
        // WebSocket is down, start fallback polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        
        // Start polling with longer intervals since this is fallback
        pollIntervalRef.current = setInterval(poll, 15000); // 15 seconds for fallback
      } else {
        // WebSocket is connected, stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          pollingRef.current = false;
        }
      }
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      pollingRef.current = false;
    };
  }, [deviceId, chatId, isSocketConnected, poll]);

  // Determine message status from backend response
  const determineMessageStatus = (messageData: any): Message['status'] => {
    const status = messageData?.status || messageData?._data?.status;
    switch (status) {
      case 'queued':
      case 'processing':
      case 'sending':
      case 'sent':
      case 'delivered':
      case 'read':
      case 'failed':
        return status;
      default:
        return messageData?.fromMe ? 'sent' : 'read';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'queued':
      case 'processing':
      case 'sending':
        return <CheckIcon fontSize="small" className="text-gray-400" />;
      case 'sent':
        return <CheckIcon fontSize="small" className="text-gray-500" />;
      case 'delivered':
        return <DoneAllIcon fontSize="small" className="text-gray-500" />;
      case 'read':
        return <DoneAllIcon fontSize="small" className="text-blue-500" />;
      case 'failed':
        return <i className="material-icons text-red-500 text-sm">error</i>;
      default:
        return null;
    }
  };

  const handleMessageContextMenu = (event: React.MouseEvent, message: Message) => {
    event.preventDefault();
    setSelectedMessage(message);
    if (event.type === 'contextmenu') {
      setContextMenuPosition({ top: (event as any).clientY, left: (event as any).clientX });
      setMenuAnchorEl(null);
    } else {
      setMenuAnchorEl(event.currentTarget as HTMLElement);
      setContextMenuPosition(null);
    }
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMessage(null);
    setContextMenuPosition(null);
  };

  const handleReply = () => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
    }
    handleMenuClose();
  };

  const handleForward = () => {
    console.log('Forward not implemented yet');
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!deviceId || !chatId || !selectedMessage) return;
    try {
      await backendAPI.deleteChatMessage(deviceId, chatId, { messageId: selectedMessage.id, forEveryone: true });
      removeMessage(selectedMessage.id);
    } catch (e) {
      console.error('Delete failed, fallback to deleteMessage:', e);
      try {
        await backendAPI.deleteMessage(deviceId, { messageId: selectedMessage.id, forEveryone: true, fromChatId: chatId });
        removeMessage(selectedMessage.id);
      } catch (err) {
        console.error('Delete message error:', err);
      }
    } finally {
      handleMenuClose();
    }
  };

  const handleCopy = () => {
    if (selectedMessage?.text) {
      navigator.clipboard?.writeText(selectedMessage.text).catch(() => {});
    }
    handleMenuClose();
  };

  const handleStar = async () => {
    if (!deviceId || !selectedMessage) return;
    try {
      await backendAPI.starMessage(deviceId, selectedMessage.id, true);
    } catch (e) {
      console.warn('Star not supported:', e);
    }
    handleMenuClose();
  };

  const handleReact = async (emoji: string) => {
    if (!deviceId || !selectedMessage) return;
    try {
      await backendAPI.reactToMessage(deviceId, selectedMessage.id, emoji);
    } catch (e) {
      console.warn('React not supported:', e);
    }
    handleMenuClose();
  };

  const handleMessageInfo = () => {
    if (selectedMessage) {
      console.log('Message info:', selectedMessage);
    }
    handleMenuClose();
  };

  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!deviceId || !chatId || messageIds.length === 0) return;
    try {
      await backendAPI.markMessagesAsRead(deviceId, chatId, messageIds);
      messageIds.forEach(id => updateMessage(id, { status: 'read' }));
    } catch (e) {
      // Ignore if not supported
    }
  }, [deviceId, chatId, updateMessage]);

  const unreadMessages = useMemo(() => {
    return messages.filter(m => m.sender === 'other' && m.status !== 'read');
  }, [messages]);

  // Mark visible incoming messages as read
  useEffect(() => {
    if (!deviceId || !chatId) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

    const unreadIds = messages
      .filter(m => m.sender === 'other' && m.status !== 'read')
      .map(m => m.id);

    if (unreadIds.length === 0) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        await backendAPI.markChatAsRead(deviceId, chatId, { sendSeen: true });
        if (cancelled) return;
        // Optimistically update local statuses
        unreadIds.forEach(id => updateMessage(id, { status: 'read' }));
      } catch (err) {
        console.warn('markChatAsRead failed:', err);
      }
    }, 300); // debounce a bit to avoid spamming backend

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [deviceId, chatId, messages]);

  const renderMessage = (message: Message) => {
    const isMe = message.sender === 'me';
    const hasContent = Boolean(
      (message.text && message.text.trim().length > 0) ||
      message.attachmentUrl ||
      message.location ||
      message.type === 'audio'
    );
    if (!hasContent) return null;
    return (
      <Box key={message.id} className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`} onContextMenu={(e) => handleMessageContextMenu(e, message)}>
        <Paper className={`max-w-[75%] px-3 py-2 ${isMe ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-700'}`} elevation={1}>
          {message.replyTo && (
            <Box className={`text-xs mb-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>↪ {message.replyTo.text}</Box>
          )}
          {message.attachmentUrl && message.type === 'image' && (
            <img src={message.attachmentUrl} alt="image" className="rounded mb-2 max-h-64" />
          )}
          {message.type === 'audio' && (
            <AudioPlayer audioUrl={message.attachmentUrl || ''} duration={message.duration} isMe={isMe} />
          )}
          {message.location && (
            <Box className="text-xs mb-1">📍 {message.location.latitude.toFixed(4)}, {message.location.longitude.toFixed(4)}</Box>
          )}
          <Typography variant="body2" className="whitespace-pre-wrap break-words">{message.text}</Typography>
          <Box className="flex items-center justify-end space-x-1 mt-1">
            <Typography variant="caption" className={`${isMe ? 'text-blue-100' : 'text-gray-500'}`}>{formatTimestamp(message.timestamp)}</Typography>
            {isMe && getStatusIcon(message.status)}
          </Box>
        </Paper>
      </Box>
    );
  };

  // Send text message
  const handleSendMessage = async ({ text }: { text: string }) => {
    if (!deviceId || !chatId || !text.trim()) return;
    // Create optimistic message
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimistic: Message = {
      id: tempId,
      text,
      timestamp: new Date().toISOString(),
      from: 'me',
      to: chatId,
      sender: 'me',
      status: 'sending',
      type: 'text',
      deviceId: deviceId,
      replyTo: replyingTo ? { id: replyingTo.id, text: replyingTo.text, sender: replyingTo.sender } : undefined,
    };
    addMessage(optimistic);
    try {
      const sent = await backendAPI.sendMessage(deviceId, chatId, {
        body: text,
        ...(replyingTo?.rawId ? { quotedMessageId: (replyingTo.rawId as any)._serialized || String(replyingTo.rawId) } : {}),
      });
      const confirmed = convertBackendMessage(sent);
      
      // More careful replacement: only remove temp if we have a valid confirmed message
      if (confirmed && confirmed.id && confirmed.id !== tempId) {
        console.log('✅ Replacing optimistic message', tempId, 'with confirmed', confirmed.id);
        removeMessage(tempId);
        // Use addOrUpdate to handle any potential WebSocket duplicates
        addOrUpdateMessages([confirmed]);
      } else {
        // If something went wrong with the confirmed message, just update status
        console.warn('⚠️ Issue with confirmed message, updating status only');
        updateMessage(tempId, { status: 'sent' });
      }
    } catch (e) {
      console.error('❌ Send message failed:', e);
      // Keep as queued to avoid showing hard error; poll may confirm
      updateMessage(tempId, { status: 'queued' });
    } finally {
      setReplyingTo(null);
    }
  };

  // Upload/send file
  const handleFileUpload = async (file: File) => {
    if (!deviceId || !chatId) return;
    const tempId = `temp-file-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      text: file.name,
      timestamp: new Date().toISOString(),
      from: 'me',
      to: chatId,
      sender: 'me',
      status: 'sending',
      type: file.type.startsWith('image') ? 'image' : 'file',
      deviceId: deviceId,
    };
    addMessage(optimistic);
    try {
      const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
      const data = await toBase64(file);
      const sent = await backendAPI.sendUnifiedMessage(deviceId, {
        to: chatId,
        media: { data, mimetype: file.type, filename: file.name },
      });
      const confirmed = convertBackendMessage(sent);
      removeMessage(tempId);
      addOrUpdateMessages([confirmed]);
    } catch (e) {
      console.error('File upload failed:', e);
      updateMessage(tempId, { status: 'queued' });
    }
  };

  // Share location from picker
  const handleLocationShare = async (location: { latitude: number; longitude: number; address?: string }) => {
    if (!deviceId || !chatId) return;
    const tempId = `temp-loc-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      text: location.address || 'Location',
      timestamp: new Date().toISOString(),
      from: 'me',
      to: chatId,
      sender: 'me',
      status: 'sending',
      type: 'location',
      deviceId: deviceId,
      location: { latitude: location.latitude, longitude: location.longitude, address: location.address },
    };
    addMessage(optimistic);
    try {
      const sent = await backendAPI.sendLocation(deviceId, { to: chatId, latitude: location.latitude, longitude: location.longitude, description: location.address });
      const confirmed = convertBackendMessage(sent);
      removeMessage(tempId);
      addOrUpdateMessages([confirmed]);
    } catch (e) {
      updateMessage(tempId, { status: 'queued' });
    } finally {
      setShowLocationPicker(false);
    }
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
            <Box className="flex items-center space-x-1">
              <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                {isTyping ? 'typing...' : (chatData?.isOnline ? 'online' : 'last seen recently')}
              </Typography>
              {/* Connection status indicator */}
              {isSocketConnected ? (
                <WifiIcon className="text-green-500" style={{ fontSize: '12px' }} />
              ) : (
                <WifiOffIcon className="text-orange-500" style={{ fontSize: '12px' }} />
              )}
            </Box>
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
