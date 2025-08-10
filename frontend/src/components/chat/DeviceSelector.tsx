"use client";

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Collapse
} from '@mui/material';
import {
  PhoneAndroid,
  ExpandMore,
  ExpandLess,
  Refresh,
  CheckCircle,
  Settings
} from '@mui/icons-material';
import { BackendDevice } from '../../lib/backend-api';

interface DeviceSelectorProps {
  devices: BackendDevice[];
  selectedDevices: string[];
  onSelectionChange: (deviceIds: string[]) => void;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function DeviceSelector({
  devices,
  selectedDevices,
  onSelectionChange,
  loading = false,
  error = null,
  onRefresh
}: DeviceSelectorProps) {
  const [expanded, setExpanded] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleToggleDevice = (deviceId: string) => {
    const newSelection = selectedDevices.includes(deviceId)
      ? selectedDevices.filter(id => id !== deviceId)
      : [...selectedDevices, deviceId];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedDevices.length === devices.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(devices.map(d => d.deviceId));
    }
    setAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const formatDeviceName = (device: BackendDevice) => {
    if (device.phoneNumber) {
      return `${device.clientName || device.name || 'Device'} (${device.phoneNumber})`;
    }
    return device.clientName || device.name || `Device ${device.deviceId.slice(0, 8)}`;
  };

  const getSelectionSummary = () => {
    if (selectedDevices.length === 0) return 'No devices selected';
    if (selectedDevices.length === 1) {
      const device = devices.find(d => d.deviceId === selectedDevices[0]);
      return device ? formatDeviceName(device) : '1 device';
    }
    return `${selectedDevices.length} devices selected`;
  };

  return (
    <Box className="border-b border-gray-200 dark:border-gray-700">
      {/* Header */}
      <Box className="p-4 bg-white dark:bg-gray-800">
        <Box className="flex items-center justify-between">
          <Typography variant="h6" className="font-semibold flex items-center gap-2">
            <PhoneAndroid className="text-blue-600" />
            Devices
          </Typography>
          
          <Box className="flex items-center gap-1">
            {onRefresh && (
              <IconButton 
                size="small" 
                onClick={onRefresh}
                disabled={loading}
                title="Refresh devices"
              >
                {loading ? <CircularProgress size={16} /> : <Refresh />}
              </IconButton>
            )}
            
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              disabled={devices.length === 0}
              title="Device options"
            >
              <Settings />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Selection Summary */}
        <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mt-1">
          {getSelectionSummary()}
        </Typography>

        {/* Selected Devices Chips */}
        {selectedDevices.length > 0 && (
          <Box className="flex flex-wrap gap-1 mt-2">
            {selectedDevices.slice(0, 3).map(deviceId => {
              const device = devices.find(d => d.deviceId === deviceId);
              if (!device) return null;
              
              return (
                <Chip
                  key={deviceId}
                  label={device.phoneNumber || device.clientName || device.name || 'Device'}
                  size="small"
                  onDelete={() => handleToggleDevice(deviceId)}
                  className="bg-blue-100 text-blue-800"
                />
              );
            })}
            {selectedDevices.length > 3 && (
              <Chip
                label={`+${selectedDevices.length - 3} more`}
                size="small"
                className="bg-gray-100 text-gray-600"
              />
            )}
          </Box>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Box className="px-4 pb-2">
          <Alert severity="error" size="small">
            {error}
          </Alert>
        </Box>
      )}

      {/* Device List */}
      <Collapse in={expanded}>
        <Box className="max-h-48 overflow-y-auto">
          {loading && devices.length === 0 ? (
            <Box className="p-4 text-center">
              <CircularProgress size={24} />
              <Typography variant="body2" className="mt-2 text-gray-600">
                Loading devices...
              </Typography>
            </Box>
          ) : devices.length === 0 ? (
            <Box className="p-4 text-center">
              <Typography variant="body2" className="text-gray-600">
                No connected devices available
              </Typography>
              <Typography variant="caption" className="text-gray-500 block mt-1">
                Connect a device to start chatting
              </Typography>
            </Box>
          ) : (
            devices.map((device) => (
              <Box
                key={device.deviceId}
                className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedDevices.includes(device.deviceId)}
                      onChange={() => handleToggleDevice(device.deviceId)}
                      size="small"
                    />
                  }
                  label={
                    <Box className="flex items-center gap-2 min-w-0">
                      <CheckCircle
                        className={`w-4 h-4 ${
                          selectedDevices.includes(device.deviceId)
                            ? 'text-green-500'
                            : 'text-gray-300'
                        }`}
                      />
                      <Box className="min-w-0 flex-1">
                        <Typography variant="body2" className="font-medium truncate">
                          {device.clientName || device.name || 'Device'}
                        </Typography>
                        {device.phoneNumber && (
                          <Typography variant="caption" className="text-gray-500 block">
                            {device.phoneNumber}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  }
                  className="w-full m-0"
                />
              </Box>
            ))
          )}
        </Box>
      </Collapse>

      {/* Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleSelectAll}>
          {selectedDevices.length === devices.length ? 'Deselect All' : 'Select All'}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} disabled>
          Advanced Options
        </MenuItem>
      </Menu>
    </Box>
  );
}
