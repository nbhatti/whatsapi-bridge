"use client";

import { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  ListItemAvatar,
  Divider,
  Switch,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Call as CallIcon,
  VideoCall as VideoCallIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  VolumeOff as VolumeOffIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  LocationOn as LocationIcon,
  Link as LinkIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

interface SelectedChat {
  chatId: string;
  deviceId: string;
  chatName: string;
}

interface ChatDetailsPaneProps {
  selectedChat: SelectedChat | null;
  onClose: () => void;
  isMobile: boolean;
}

interface MediaItem {
  id: string;
  type: 'image' | 'file' | 'link' | 'location';
  url?: string;
  name: string;
  timestamp: string;
  size?: number;
}

export function ChatDetailsPane({ selectedChat, onClose, isMobile }: ChatDetailsPaneProps) {
  const chatId = selectedChat?.chatId;
  const deviceId = selectedChat?.deviceId;
  const chatName = selectedChat?.chatName;
  const [notifications, setNotifications] = useState(true);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'media' | 'files' | 'links' | 'locations'>('media');

  // Mock chat data
  const chatData = chatId ? {
    id: chatId,
    name: `Contact ${chatId.split('-')[1]}`,
    phone: '+1 (555) 123-4567',
    avatar: undefined,
    isOnline: true,
    lastSeen: new Date().toISOString(),
    about: 'Available',
    commonGroups: ['Group 1', 'Group 2'],
    isBlocked: false,
    starred: false
  } : null;

  // Mock media items
  const mockMediaItems: MediaItem[] = [
    {
      id: '1',
      type: 'image',
      url: '/api/placeholder/150/150',
      name: 'IMG_001.jpg',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      size: 1024000
    },
    {
      id: '2',
      type: 'file',
      name: 'document.pdf',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      size: 2048000
    },
    {
      id: '3',
      type: 'link',
      url: 'https://example.com',
      name: 'Example Website',
      timestamp: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: '4',
      type: 'location',
      name: 'Times Square, New York',
      timestamp: new Date(Date.now() - 345600000).toISOString()
    }
  ];

  const filteredItems = mockMediaItems.filter(item => {
    switch (selectedTab) {
      case 'media':
        return item.type === 'image';
      case 'files':
        return item.type === 'file';
      case 'links':
        return item.type === 'link';
      case 'locations':
        return item.type === 'location';
      default:
        return true;
    }
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getItemIcon = (type: MediaItem['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="text-blue-500" />;
      case 'file':
        return <FileIcon className="text-red-500" />;
      case 'link':
        return <LinkIcon className="text-green-500" />;
      case 'location':
        return <LocationIcon className="text-orange-500" />;
      default:
        return <FileIcon />;
    }
  };

  const handleBlockUser = () => {
    // TODO: Implement block user
    setShowBlockDialog(false);
  };

  const handleDeleteChat = () => {
    // TODO: Implement delete chat
    setShowDeleteDialog(false);
  };

  if (!chatId || !chatData) {
    return null;
  }

  return (
    <Box className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <Paper
        className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center"
        elevation={0}
        square
      >
        <IconButton onClick={onClose} className="mr-2">
          {isMobile ? <ArrowBackIcon /> : <CloseIcon />}
        </IconButton>
        <Typography variant="h6" className="font-semibold">
          Contact Info
        </Typography>
      </Paper>

      {/* Profile Section */}
      <Box className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
        <Avatar
          className="w-24 h-24 mx-auto mb-4 bg-blue-500 text-2xl"
          src={chatData.avatar}
        >
          {chatData.name[0]}
        </Avatar>
        
        <Typography variant="h6" className="font-semibold mb-2">
          {chatData.name}
        </Typography>
        
        <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mb-2">
          {chatData.phone}
        </Typography>
        
        {chatData.about && (
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mb-4">
            {chatData.about}
          </Typography>
        )}
        
        {/* Action Buttons */}
        <Box className="flex justify-center space-x-4">
          <IconButton className="bg-green-500 text-white p-3">
            <CallIcon />
          </IconButton>
          <IconButton className="bg-blue-500 text-white p-3">
            <VideoCallIcon />
          </IconButton>
          <IconButton className="bg-gray-500 text-white p-3">
            <SearchIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Settings */}
      <Box className="border-b border-gray-200 dark:border-gray-700">
        <List className="p-0">
          <ListItem className="px-4 py-3">
            <ListItemIcon>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Notifications" 
              secondary={notifications ? "On" : "Off"}
            />
            <Switch
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
          </ListItem>
        </List>
      </Box>

      {/* Media Tab Navigation */}
      <Box className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Box className="flex space-x-2">
          {(['media', 'files', 'links', 'locations'] as const).map((tab) => (
            <Chip
              key={tab}
              label={tab.charAt(0).toUpperCase() + tab.slice(1)}
              onClick={() => setSelectedTab(tab)}
              variant={selectedTab === tab ? 'filled' : 'outlined'}
              color={selectedTab === tab ? 'primary' : 'default'}
              className="capitalize"
            />
          ))}
        </Box>
      </Box>

      {/* Media Items */}
      <Box className="flex-1 overflow-y-auto p-4">
        {filteredItems.length === 0 ? (
          <Box className="text-center py-8">
            <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
              No {selectedTab} shared yet
            </Typography>
          </Box>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {selectedTab === 'media' ? (
              filteredItems.map((item) => (
                <Box key={item.id} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                  />
                </Box>
              ))
            ) : (
              <div className="col-span-3 space-y-2">
                {filteredItems.map((item) => (
                  <ListItemButton
                    key={item.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <ListItemIcon>
                      {getItemIcon(item.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.name}
                      secondary={
                        <Box className="flex items-center justify-between">
                          <span>{formatTimestamp(item.timestamp)}</span>
                          {item.size && <span>{formatFileSize(item.size)}</span>}
                        </Box>
                      }
                    />
                  </ListItemButton>
                ))}
              </div>
            )}
          </div>
        )}
      </Box>

      {/* Common Groups */}
      {chatData.commonGroups.length > 0 && (
        <Box className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Typography variant="subtitle2" className="mb-2 text-gray-600 dark:text-gray-400">
            {chatData.commonGroups.length} group{chatData.commonGroups.length !== 1 ? 's' : ''} in common
          </Typography>
          {chatData.commonGroups.map((group, index) => (
            <ListItemButton key={index} className="p-2 rounded">
              <ListItemAvatar>
                <Avatar className="bg-green-500">
                  {group[0]}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={group} />
            </ListItemButton>
          ))}
        </Box>
      )}

      {/* Action Items */}
      <Box className="border-t border-gray-200 dark:border-gray-700">
        <List className="p-0">
          <ListItemButton className="px-4 py-3">
            <ListItemIcon>
              <StarIcon className="text-yellow-500" />
            </ListItemIcon>
            <ListItemText primary="Starred Messages" />
          </ListItemButton>
          
          <ListItemButton className="px-4 py-3">
            <ListItemIcon>
              <VolumeOffIcon className="text-gray-500" />
            </ListItemIcon>
            <ListItemText primary="Mute Notifications" />
          </ListItemButton>
          
          <ListItemButton 
            className="px-4 py-3 text-red-500"
            onClick={() => setShowBlockDialog(true)}
          >
            <ListItemIcon>
              <BlockIcon className="text-red-500" />
            </ListItemIcon>
            <ListItemText primary="Block Contact" />
          </ListItemButton>
          
          <ListItemButton 
            className="px-4 py-3 text-red-500"
            onClick={() => setShowDeleteDialog(true)}
          >
            <ListItemIcon>
              <DeleteIcon className="text-red-500" />
            </ListItemIcon>
            <ListItemText primary="Delete Chat" />
          </ListItemButton>
        </List>
      </Box>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onClose={() => setShowBlockDialog(false)}>
        <DialogTitle>Block {chatData.name}?</DialogTitle>
        <DialogContent>
          <Typography>
            You won't receive messages or calls from {chatData.name}. They won't know you've blocked them.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBlockDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleBlockUser} color="error" variant="contained">
            Block
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Delete chat with {chatData.name}?</DialogTitle>
        <DialogContent>
          <Typography>
            This will delete all messages in this chat. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteChat} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
