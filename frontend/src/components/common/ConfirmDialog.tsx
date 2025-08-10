"use client";

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger' | 'info' | 'question';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  loading = false,
}: ConfirmDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          color: theme.palette.error.main,
          icon: <ErrorIcon />,
          confirmColor: 'error' as const,
        };
      case 'warning':
        return {
          color: theme.palette.warning.main,
          icon: <WarningIcon />,
          confirmColor: 'warning' as const,
        };
      case 'question':
        return {
          color: theme.palette.info.main,
          icon: <HelpIcon />,
          confirmColor: 'primary' as const,
        };
      default:
        return {
          color: theme.palette.info.main,
          icon: <InfoIcon />,
          confirmColor: 'primary' as const,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xs"
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
            <Box sx={{ color: variantStyles.color }}>
              {variantStyles.icon}
            </Box>
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
        <Typography variant="body1" color="text.primary">
          {message}
        </Typography>
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
          color={variantStyles.confirmColor}
          variant="contained"
          disabled={loading}
          size="large"
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;
