"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  InputAdornment,
  Badge,
  IconButton,
  CircularProgress,
  Divider,
  Alert,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  PhoneAndroid,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  PushPin as PinIcon,
  VolumeOff as MuteIcon,
  MarkChatUnread as MarkUnreadIcon
} from '@mui/icons-material';
import { backendAPI, BackendChat } from '../../lib/backend-api';
import { useMessages } from '../../stores/realtime-store';

interface Chat extends BackendChat {
  deviceId: string;
  deviceName?: string;
  isOnline: boolean;
  isTyping: boolean;
}

interface SelectedChat {
  chatId: string;
  deviceId: string;
  chatName: string;
}

interface ChatsListProps {
  selectedDevices: string[];
  selectedChat: SelectedChat | null;
  onChatSelect: (chatId: string, deviceId: string, chatName: string) => void;
  disabled?: boolean;
}

export function ChatsList({ selectedDevices, selectedChat, onChatSelect, disabled = false }: ChatsListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    chat: Chat | null;
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load chats from selected devices
  const loadChats = useCallback(async () => {
    if (disabled || selectedDevices.length === 0) {
      setChats([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const allChats: Chat[] = [];
      
      for (const deviceId of selectedDevices) {
        try {
          const deviceChats = await backendAPI.getDeviceChats(deviceId, {
            limit: 50,
            search: searchQuery.trim() || undefined
          });
          
          const formattedChats: Chat[] = deviceChats.map((chat, index) => {
            const convertTimestamp = (ts: number) => ts < 946684800000 ? ts * 1000 : ts;
            const originalTimestamp = chat.timestamp ? convertTimestamp(chat.timestamp) : null;
            const lastMessageTimestamp = chat.lastMessage?.timestamp ? convertTimestamp(chat.lastMessage.timestamp) : null;
            const mockTimestamp = Date.now() - (index * 3600000);
            const chatTimestamp = lastMessageTimestamp || originalTimestamp || mockTimestamp;
            
            return {
              ...chat,
              id: chat.id,
              chatId: chat.id,
              name: chat.name,
              isGroup: chat.isGroup,
              unreadCount: chat.unreadCount,
              deviceId,
              isOnline: false,
              isTyping: false,
              timestamp: chatTimestamp
            } as Chat;
          });
          
          allChats.push(...formattedChats);
        } catch (deviceError) {
          console.warn(`Failed to load chats for device ${deviceId}:`, deviceError);
        }
      }
      
      allChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setChats(allChats);
    } catch (err) {
      console.error('Failed to load chats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [selectedDevices, searchQuery, disabled]);

  // Load chats when devices or search changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadChats();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [loadChats]);

  // Real-time message updates
  const messages = useMessages();
  useEffect(() => {
    if (messages.length === 0) return;

    setChats(currentChats => {
      const updatedChats = [...currentChats];
      let needsSort = false;

      messages.forEach(msg => {
        const chatId = msg.from === 'me' ? msg.to : msg.from;
        const chatIndex = updatedChats.findIndex(c => c.id === chatId);

        if (chatIndex !== -1) {
          const chat = updatedChats[chatIndex];
          const newTimestamp = new Date(msg.timestamp).getTime();
          const existingTimestamp = new Date(chat.lastMessage?.timestamp || 0).getTime();

          if (newTimestamp > existingTimestamp) {
            chat.lastMessage = msg as any;
            chat.timestamp = newTimestamp;
            if (msg.from !== 'me') {
              chat.unreadCount = (chat.unreadCount || 0) + 1;
            }
            needsSort = true;
          }
        }
      });

      if (needsSort) {
        updatedChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }

      return updatedChats;
    });
  }, [messages]);

  const formatTimestamp = (timestamp: string | number | undefined) => {
    if (!timestamp) return '';
    
    // Handle both string and number timestamps
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Handle context menu
  const handleContextMenu = (event: React.MouseEvent, chat: Chat) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            chat,
          }
        : null
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handlePinChat = () => {
    if (contextMenu?.chat) {
      console.log('Pin chat:', contextMenu.chat.name);
      // TODO: Implement pin chat functionality
    }
    handleCloseContextMenu();
  };

  const handleArchiveChat = () => {
    if (contextMenu?.chat) {
      console.log('Archive chat:', contextMenu.chat.name);
      // TODO: Implement archive chat functionality
    }
    handleCloseContextMenu();
  };

  const handleMuteChat = () => {
    if (contextMenu?.chat) {
      console.log('Mute chat:', contextMenu.chat.name);
      // TODO: Implement mute chat functionality
    }
    handleCloseContextMenu();
  };

  const handleMarkAsUnread = () => {
    if (contextMenu?.chat) {
      console.log('Mark as unread:', contextMenu.chat.name);
      // TODO: Implement mark as unread functionality
    }
    handleCloseContextMenu();
  };

  const handleDeleteChat = () => {
    if (contextMenu?.chat) {
      console.log('Delete chat:', contextMenu.chat.name);
      // TODO: Implement delete chat functionality
    }
    handleCloseContextMenu();
  };

  return (
    <Box className="flex flex-col h-full">
      {/* Header */}
      <Box className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <Box className="flex items-center justify-between mb-4">
          <Typography variant="h5" className="font-semibold">
            Chats
          </Typography>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
        
        <TextField
          fullWidth
          placeholder="Search or start new chat"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon className="text-gray-400" />
              </InputAdornment>
            ),
          }}
          className="mb-2"
        />
      </Box>

      {/* Error Display */}
      {error && (
        <Box className="px-4 pb-2">
          <Alert 
            severity={error.includes('not yet available') || error.includes('not yet implemented') ? 'info' : 'error'} 
            size="small"
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* No Devices Selected */}
      {disabled && (
        <Box className="p-8 text-center">
          <PhoneAndroid className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <Typography variant="body2" className="text-gray-600">
            Select devices to view chats
          </Typography>
        </Box>
      )}

      {/* Chats List */}
      {!disabled && (
        <Box
          ref={listRef}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
        >
          {loading ? (
            <Box className="flex justify-center py-8">
              <CircularProgress size={24} />
              <Typography variant="body2" className="ml-2 text-gray-600">
                Loading chats...
              </Typography>
            </Box>
          ) : chats.length === 0 ? (
            <Box className="p-8 text-center">
              <ChatIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <Typography variant="body2" className="text-gray-600">
                No chats found
              </Typography>
              <Typography variant="caption" className="text-gray-500 block mt-1">
                {searchQuery ? 'Try adjusting your search' : 'Start a conversation to see it here'}
              </Typography>
            </Box>
          ) : (
            <List className="p-0">
              {chats.map((chat, index) => {
                // Create a unique key using chatId or fallback to id
                const uniqueKey = `${chat.deviceId}-${chat.chatId || chat.id || index}`;
                
                return (
                  <div key={uniqueKey}>
                    <ListItem className="p-0">
                      <ListItemButton
                        selected={selectedChat?.chatId === chat.chatId && selectedChat?.deviceId === chat.deviceId}
                        onClick={() => {
                          console.log('Chat selected:', { chatId: chat.chatId, deviceId: chat.deviceId, name: chat.name });
                          onChatSelect(chat.chatId, chat.deviceId, chat.name);
                        }}
                        onContextMenu={(e) => handleContextMenu(e, chat)}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ListItemAvatar>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                              <Box
                                className={`w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                                  chat.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                              />
                            }
                          >
                            <Avatar className={`${chat.isGroup ? 'bg-green-500' : 'bg-blue-500'}`}>
                              {chat.isGroup ? (
                                <GroupIcon />
                              ) : (
                                <ChatIcon />
                              )}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        
                        <ListItemText
                          primary={
                            <span className="flex items-center justify-between">
                              <span className="flex items-center gap-2 min-w-0 flex-1">
                                <Typography
                                  variant="subtitle1"
                                  component="span"
                                  className={`font-medium truncate ${
                                    chat.unreadCount > 0 ? 'text-black dark:text-white' : 'text-gray-900 dark:text-gray-100'
                                  }`}
                                >
                                  {chat.name}
                                </Typography>
                                {selectedDevices.length > 1 && (
                                  <Chip
                                    size="small"
                                    label={chat.deviceId.slice(0, 6)}
                                    className="bg-gray-100 text-gray-600 text-xs"
                                  />
                                )}
                              </span>
                              <Typography variant="caption" component="span" className="text-gray-500 dark:text-gray-400">
                                {formatTimestamp(chat.timestamp)}
                              </Typography>
                            </span>
                          }
                          secondary={
                            <span className="flex items-center justify-between mt-1">
                              <Typography
                                variant="body2"
                                component="span"
                                className={`truncate mr-2 ${
                                  chat.unreadCount > 0
                                    ? 'text-gray-900 dark:text-gray-100 font-medium'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {chat.isTyping ? (
                                  <span className="text-blue-500 font-medium">typing...</span>
                                ) : (
                                  chat.lastMessage?.body || 'No messages yet'
                                )}
                              </Typography>
                              {chat.unreadCount > 0 && (
                                <Badge
                                  badgeContent={chat.unreadCount}
                                  max={99}
                                  className="ml-2"
                                  sx={{
                                    '& .MuiBadge-badge': {
                                      backgroundColor: '#25D366',
                                      color: 'white',
                                      fontSize: '0.75rem',
                                      minWidth: '20px',
                                      height: '20px'
                                    }
                                  }}
                                />
                              )}
                            </span>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    {index < chats.length - 1 && <Divider className="ml-16" />}
                  </div>
                );
              })}
            </List>
          )}
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handlePinChat}>
          <PinIcon className="mr-2" fontSize="small" />
          Pin chat
        </MenuItem>
        <MenuItem onClick={handleArchiveChat}>
          <ArchiveIcon className="mr-2" fontSize="small" />
          Archive chat
        </MenuItem>
        <MenuItem onClick={handleMuteChat}>
          <MuteIcon className="mr-2" fontSize="small" />
          Mute notifications
        </MenuItem>
        <MenuItem onClick={handleMarkAsUnread}>
          <MarkUnreadIcon className="mr-2" fontSize="small" />
          Mark as unread
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteChat} className="text-red-600">
          <DeleteIcon className="mr-2" fontSize="small" />
          Delete chat
        </MenuItem>
      </Menu>
    </Box>
  );
}
