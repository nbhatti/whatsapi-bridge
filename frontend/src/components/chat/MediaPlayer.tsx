\"use client\";

import { useState, useRef, useCallback } from 'react';
import { 
  Box, 
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  LinearProgress,
  Chip,
  CircularProgress
} from '@mui/material';
import { 
  Close as CloseIcon,
  Download as DownloadIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';
import { MediaPlayerProps } from '../../types/media';

interface MediaPlayerState {
  isOpen: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
}

interface MediaPlayerFullProps extends MediaPlayerProps {
  open: boolean;
  onClose: () => void;
}

export function MediaPlayerDialog({ 
  messageId, 
  deviceId, 
  mediaInfo, 
  autoPlay = false,
  open,
  onClose
}: MediaPlayerFullProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Media controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(1);

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Get media URL with proper API proxy
  const mediaUrl = `/api/backend${mediaInfo.downloadUrl}`;
  const thumbnailUrl = mediaInfo.thumbnailUrl ? `/api/backend${mediaInfo.thumbnailUrl}` : undefined;

  const handleMediaLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration || 0);
      if (autoPlay && mediaInfo.mediaType !== 'image') {
        mediaRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [autoPlay, mediaInfo.mediaType]);

  const handleMediaError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage('Failed to load media file');
  }, []);

  const handlePlayPause = useCallback(() => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleMute = useCallback(() => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mediaInfo.filename || `media_${messageId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [mediaUrl, mediaInfo.filename, messageId]);

  const handleTimeUpdate = useCallback(() => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMediaContent = () => {
    switch (mediaInfo.mediaType) {
      case 'image':
        return (
          <Box className="relative max-w-full max-h-full flex items-center justify-center">
            {isLoading && (
              <Box className="absolute inset-0 flex items-center justify-center bg-black/20">
                <CircularProgress />
              </Box>
            )}
            {hasError ? (
              <Box className="flex flex-col items-center justify-center p-8">
                <Typography variant="h6" className="text-red-500 mb-2">
                  Failed to load image
                </Typography>
                <Typography variant="body2" className="text-gray-500 mb-4">
                  {errorMessage}
                </Typography>
                <IconButton onClick={handleDownload} className="bg-blue-500 text-white">
                  <DownloadIcon />
                </IconButton>
              </Box>
            ) : (
              <img
                ref={imageRef}
                src={mediaUrl}
                alt="Media content"
                className="max-w-full max-h-full object-contain"
                onLoad={handleMediaLoad}
                onError={handleMediaError}
                style={{
                  transform: `scale(${zoom})`,
                  transition: 'transform 0.2s ease'
                }}
              />
            )}
            
            {/* Image controls */}
            <Box className="absolute top-4 right-4 flex space-x-2">
              <IconButton 
                onClick={handleZoomIn}
                className="bg-black/50 text-white hover:bg-black/70"
                size="small"
              >
                <ZoomInIcon />
              </IconButton>
              <IconButton 
                onClick={handleZoomOut}
                className="bg-black/50 text-white hover:bg-black/70"
                size="small"
              >
                <ZoomOutIcon />
              </IconButton>
            </Box>
          </Box>
        );

      case 'video':
        return (
          <Box className="relative w-full">
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={mediaUrl}
              className="w-full h-auto max-h-[70vh]"
              onLoadedData={handleMediaLoad}
              onError={handleMediaError}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              poster={thumbnailUrl}
              controls={false}
            />
            
            {/* Custom video controls */}
            <Box className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <Box className="flex items-center space-x-2 mb-2">
                <IconButton onClick={handlePlayPause} className="text-white">
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </IconButton>
                <IconButton onClick={handleMute} className="text-white">
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
                <Typography variant="body2" className="text-white">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={duration > 0 ? (currentTime / duration) * 100 : 0}
                className="w-full"
              />
            </Box>
          </Box>
        );

      case 'audio':
        return (
          <Box className="w-full max-w-md p-6">
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={mediaUrl}
              onLoadedData={handleMediaLoad}
              onError={handleMediaError}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            />
            
            <Box className="flex flex-col items-center space-y-4">
              <Typography variant="h6" className="text-center">
                {mediaInfo.filename || 'Audio Message'}
              </Typography>
              
              <Box className="flex items-center space-x-4">
                <IconButton 
                  onClick={handlePlayPause} 
                  className="bg-blue-500 text-white"
                  size="large"
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </IconButton>
                <IconButton onClick={handleMute}>
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
              </Box>
              
              <Box className="w-full">
                <LinearProgress 
                  variant="determinate" 
                  value={duration > 0 ? (currentTime / duration) * 100 : 0}
                  className="mb-2"
                />
                <Box className="flex justify-between text-sm text-gray-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </Box>
              </Box>
            </Box>
          </Box>
        );

      default:
        return (
          <Box className="flex flex-col items-center justify-center p-8">
            <Typography variant="h6" className="mb-4">
              {mediaInfo.filename || 'Document'}
            </Typography>
            <Typography variant="body2" className="text-gray-500 mb-4">
              {mediaInfo.mimetype}
            </Typography>
            {mediaInfo.filesize && (
              <Typography variant="body2" className="text-gray-500 mb-4">
                Size: {(mediaInfo.filesize / 1024 / 1024).toFixed(2)} MB
              </Typography>
            )}
            <IconButton 
              onClick={handleDownload}
              className="bg-blue-500 text-white"
              size="large"
            >
              <DownloadIcon />
            </IconButton>
          </Box>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white'
        }
      }}
    >
      <DialogTitle className="flex justify-between items-center">
        <Box>
          <Typography variant="h6">
            {mediaInfo.filename || `${mediaInfo.mediaType.charAt(0).toUpperCase() + mediaInfo.mediaType.slice(1)} Message`}
          </Typography>
          <Box className="flex space-x-2 mt-1">
            <Chip 
              label={mediaInfo.mediaType}
              size="small"
              className="bg-blue-500 text-white"
            />
            <Chip 
              label={mediaInfo.mimetype}
              size="small"
              variant="outlined"
              className="text-gray-300 border-gray-500"
            />
            {mediaInfo.dimensions && (
              <Chip 
                label={`${mediaInfo.dimensions.width}×${mediaInfo.dimensions.height}`}
                size="small"
                variant="outlined"
                className="text-gray-300 border-gray-500"
              />
            )}
          </Box>
        </Box>
        <Box className="flex space-x-1">
          <IconButton onClick={handleDownload} className="text-white">
            <DownloadIcon />
          </IconButton>
          <IconButton onClick={onClose} className="text-white">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent className="flex items-center justify-center p-0">
        {renderMediaContent()}
      </DialogContent>
    </Dialog>
  );
}

// Lightweight media player component for inline use
export function MediaPlayer(props: MediaPlayerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Box 
        onClick={() => setDialogOpen(true)}
        className="cursor-pointer"
      >
        {/* This would typically show a thumbnail or preview */}
        <Typography variant="body2" className="text-blue-500 underline">
          Click to view {props.mediaInfo.mediaType}
        </Typography>
      </Box>
      
      <MediaPlayerDialog
        {...props}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
