"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  TextField,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

export interface InputDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  initialValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
  loading?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  type?: 'text' | 'email' | 'password' | 'number';
}

export function InputDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  initialValue = '',
  placeholder = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  required = false,
  loading = false,
  multiline = false,
  rows = 1,
  maxLength,
  type = 'text',
}: InputDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setError('');
    }
  }, [open, initialValue]);

  const handleConfirm = () => {
    if (required && !value.trim()) {
      setError('This field is required');
      return;
    }

    if (maxLength && value.length > maxLength) {
      setError(`Maximum ${maxLength} characters allowed`);
      return;
    }

    onConfirm(value);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    if (error) setError('');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !multiline) {
      handleConfirm();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          m: fullScreen ? 0 : 2,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon color="primary" />
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            disabled={loading}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
          {message}
        </Typography>
        
        <TextField
          fullWidth
          value={value}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          error={!!error}
          helperText={error || (maxLength ? `${value.length}/${maxLength} characters` : '')}
          disabled={loading}
          autoFocus
          type={type}
          multiline={multiline}
          rows={multiline ? rows : 1}
          variant="outlined"
          size="medium"
          sx={{ mt: 1 }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          size="large"
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          variant="contained"
          disabled={loading || (required && !value.trim())}
          size="large"
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InputDialog;
