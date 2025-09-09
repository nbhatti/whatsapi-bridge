"use client";

import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon,
  LocationOn as LocationIcon,
  Camera as CameraIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface MessageComposerProps {
  onSendMessage: (data: { text: string }) => void;
  onFileUpload: (file: File) => void;
  onLocationShare: () => void;
}

interface MessageFormData {
  message: string;
}

export function MessageComposer({ onSendMessage, onFileUpload, onLocationShare }: MessageComposerProps) {
  const [attachMenuAnchor, setAttachMenuAnchor] = useState<null | HTMLElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  
  const { control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<MessageFormData>({
    defaultValues: {
      message: ''
    }
  });

  const messageText = watch('message');
  const hasText = messageText && messageText.trim().length > 0;

  const onSubmit = async (data: MessageFormData) => {
    if (!data.message.trim()) return;
    
    try {
      await onSendMessage({ text: data.message });
      reset();
      // Focus back to the input after sending
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleAttachClick = (event: React.MouseEvent<HTMLElement>) => {
    setAttachMenuAnchor(event.currentTarget);
  };

  const handleAttachClose = () => {
    setAttachMenuAnchor(null);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadingFile(file);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call to /messages/send
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadProgress(100);
      setTimeout(() => {
        onFileUpload(file);
        setUploadingFile(null);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      setUploadError('Failed to upload file. Please try again.');
      setUploadingFile(null);
      setUploadProgress(0);
    }
    
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
    handleAttachClose();
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate image file
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    handleFileSelect(event);
  };

  const handleDocumentClick = () => {
    fileInputRef.current?.click();
    handleAttachClose();
  };

  const handleCameraClick = () => {
    imageInputRef.current?.click();
    handleAttachClose();
  };

  const handleLocationClick = () => {
    onLocationShare();
    handleAttachClose();
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // TODO: Handle voice message recording
    } else {
      // Start recording
      setIsRecording(true);
      // TODO: Handle voice message recording
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const cancelUpload = () => {
    setUploadingFile(null);
    setUploadProgress(0);
    setUploadError(null);
  };

  return (
    <Box className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Upload Progress/Error */}
      {uploadingFile && (
        <Box className="p-3 border-b border-gray-200 dark:border-gray-700">
          <Paper className="p-3 bg-blue-50 dark:bg-blue-900/20" elevation={0}>
            <Box className="flex items-center justify-between mb-2">
              <Box className="flex items-center">
                <FileIcon className="mr-2 text-blue-500" />
                <Typography variant="body2" className="font-medium">
                  {uploadingFile.name}
                </Typography>
              </Box>
              <IconButton size="small" onClick={cancelUpload}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Box className="flex items-center">
              <Box className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-3">
                <Box
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </Box>
              <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                {uploadProgress}%
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Upload Error */}
      {uploadError && (
        <Box className="p-3 border-b border-gray-200 dark:border-gray-700">
          <Alert severity="error" onClose={() => setUploadError(null)}>
            {uploadError}
          </Alert>
        </Box>
      )}

      {/* Message Input */}
      <Box className="p-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box className="flex items-end space-x-2">
            {/* Attach Button */}
            <IconButton
              onClick={handleAttachClick}
              className="mb-2 text-gray-500 dark:text-gray-400 hover:text-blue-500"
              disabled={uploadingFile !== null}
            >
              <AttachFileIcon />
            </IconButton>

            {/* Message TextField */}
            <Box className="flex-1">
              <Controller
                name="message"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    inputRef={textInputRef}
                    multiline
                    maxRows={5}
                    placeholder="Type a message..."
                    variant="outlined"
                    fullWidth
                    size="small"
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting || uploadingFile !== null}
                    InputProps={{
                      endAdornment: (
                        <Box className="flex items-center space-x-1 ml-2">
                          <IconButton size="small" className="text-gray-500 dark:text-gray-400">
                            <EmojiIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ),
                      sx: {
                        borderRadius: '20px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.2)'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#25D366',
                          borderWidth: '2px'
                        }
                      }
                    }}
                  />
                )}
              />
            </Box>

            {/* Send/Voice Button */}
            {hasText ? (
              <IconButton
                type="submit"
                disabled={isSubmitting || uploadingFile !== null}
                className="mb-2 bg-green-500 hover:bg-green-600 text-white p-2"
                sx={{
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(37, 211, 102, 0.3)',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SendIcon />
                )}
              </IconButton>
            ) : (
              <IconButton
                onClick={handleVoiceRecord}
                className={`mb-2 p-2 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-green-500'
                }`}
                disabled={uploadingFile !== null}
              >
                <MicIcon />
              </IconButton>
            )}
          </Box>
        </form>
      </Box>

      {/* Attachment Menu */}
      <Menu
        anchorEl={attachMenuAnchor}
        open={Boolean(attachMenuAnchor)}
        onClose={handleAttachClose}
        PaperProps={{
          sx: {
            '& .MuiMenuItem-root': {
              padding: '12px 16px',
              minHeight: 'unset'
            }
          }
        }}
      >
        <MenuItem onClick={handleDocumentClick} className="flex items-center">
          <FileIcon className="mr-3 text-blue-500" />
          <Typography>Document</Typography>
        </MenuItem>
        
        <MenuItem onClick={handleCameraClick} className="flex items-center">
          <CameraIcon className="mr-3 text-green-500" />
          <Typography>Camera</Typography>
        </MenuItem>
        
        <MenuItem onClick={handleLocationClick} className="flex items-center">
          <LocationIcon className="mr-3 text-red-500" />
          <Typography>Location</Typography>
        </MenuItem>
      </Menu>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
        onChange={handleFileSelect}
      />
      
      <input
        ref={imageInputRef}
        type="file"
        hidden
        accept="image/*"
        onChange={handleImageSelect}
      />
    </Box>
  );
}
