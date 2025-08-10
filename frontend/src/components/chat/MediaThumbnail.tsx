\"use client\";

import { useState, useCallback } from 'react';
import { 
  Box, 
  CircularProgress, 
  IconButton,
  Typography,
  Skeleton
} from '@mui/material';
import { 
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  AudioFile as AudioIcon
} from '@mui/icons-material';
import { MediaThumbnailProps } from '../../types/media';

export function MediaThumbnail({ 
  messageId, 
  deviceId, 
  mediaInfo, 
  onClick, 
  className 
}: MediaThumbnailProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  // Get thumbnail URL with proper API proxy
  const thumbnailUrl = `/api/backend${mediaInfo.thumbnailUrl}`;
  const downloadUrl = `/api/backend${mediaInfo.downloadUrl}`;

  // Render based on media type
  switch (mediaInfo.mediaType) {
    case 'image':
      return (
        <Box 
          className={`relative cursor-pointer rounded-lg overflow-hidden ${className || ''}`}
          onClick={handleClick}
          sx={{
            minWidth: 200,
            minHeight: 150,
            maxWidth: 300,
            maxHeight: 200,
            backgroundColor: 'action.hover'
          }}
        >
          {imageLoading && !imageError && (
            <Box className="absolute inset-0 flex items-center justify-center">
              <Skeleton variant="rectangular" width="100%" height="100%" />
            </Box>
          )}
          
          {imageError ? (
            <Box className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
              <ErrorIcon className="text-gray-400 text-4xl mb-2" />
              <Typography variant="caption" className="text-gray-500">
                Failed to load image
              </Typography>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(downloadUrl, '_blank');
                }}
                className="mt-2"
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <img
              src={thumbnailUrl}
              alt="Media thumbnail"
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
          )}

          {/* Overlay for better UX */}
          <Box className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
            <Box className="opacity-0 hover:opacity-100 transition-opacity duration-200">
              <IconButton 
                className="bg-white/80 hover:bg-white text-gray-700"
                size="large"
              >
                <ImageIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Dimensions info if available */}
          {mediaInfo.dimensions && (
            <Box className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {mediaInfo.dimensions.width} × {mediaInfo.dimensions.height}
            </Box>
          )}
        </Box>
      );

    case 'video':
      return (
        <Box 
          className={`relative cursor-pointer rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 ${className || ''}`}
          onClick={handleClick}
          sx={{
            minWidth: 200,
            minHeight: 150,
            maxWidth: 300,
            maxHeight: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Video thumbnail placeholder */}
          <Box className="flex flex-col items-center justify-center p-4">
            <PlayIcon className="text-6xl text-blue-500 mb-2" />
            <Typography variant="body2" className="text-center">
              Video
            </Typography>
            {mediaInfo.duration && (
              <Typography variant="caption" className="text-gray-500 mt-1">
                Duration: {Math.round(mediaInfo.duration)}s
              </Typography>
            )}
            {mediaInfo.dimensions && (
              <Typography variant="caption" className="text-gray-500">
                {mediaInfo.dimensions.width} × {mediaInfo.dimensions.height}
              </Typography>
            )}
          </Box>

          <Box className="absolute bottom-2 right-2">
            <IconButton 
              size="small"
              className="bg-white/80 hover:bg-white text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                window.open(downloadUrl, '_blank');
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      );

    case 'audio':
      return (
        <Box 
          className={`cursor-pointer rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 ${className || ''}`}
          onClick={handleClick}
          sx={{ minWidth: 200, maxWidth: 300 }}
        >
          <Box className="flex items-center space-x-3">
            <AudioIcon className="text-blue-500 text-2xl" />
            <Box className="flex-1">
              <Typography variant="body2" className="font-medium">
                {mediaInfo.filename || 'Audio Message'}
              </Typography>
              {mediaInfo.duration && (
                <Typography variant="caption" className="text-gray-500">
                  Duration: {Math.round(mediaInfo.duration)}s
                </Typography>
              )}
            </Box>
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                window.open(downloadUrl, '_blank');
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      );

    case 'document':
    case 'sticker':
    default:
      return (
        <Box 
          className={`cursor-pointer rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 ${className || ''}`}
          onClick={handleClick}
          sx={{ minWidth: 200, maxWidth: 300 }}
        >
          <Box className="flex items-center space-x-3">
            <FileIcon className="text-gray-500 text-2xl" />
            <Box className="flex-1">
              <Typography variant="body2" className="font-medium">
                {mediaInfo.filename || `${mediaInfo.mediaType} file`}
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                {mediaInfo.mimetype}
              </Typography>
              {mediaInfo.filesize && (
                <Typography variant="caption" className="text-gray-500 block">
                  Size: {(mediaInfo.filesize / 1024).toFixed(1)} KB
                </Typography>
              )}
            </Box>
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                window.open(downloadUrl, '_blank');
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      );
  }
}
