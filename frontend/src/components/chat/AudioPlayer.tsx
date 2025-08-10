"use client";

import { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, Slider } from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  GraphicEq as GraphicEqIcon
} from '@mui/icons-material';

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number; // Duration in seconds
  isMe?: boolean;
}

export function AudioPlayer({ audioUrl, duration, isMe = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleError = (e: any) => {
      setIsLoading(false);
      setError('Failed to load audio');
      console.error('Audio loading error:', e);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Failed to play audio');
    }
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value;
    setCurrentTime(value);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <Box className="mb-2 p-2 bg-red-100 dark:bg-red-900 rounded flex items-center">
        <GraphicEqIcon className="mr-2 text-red-500" />
        <Typography variant="body2" className="text-red-700 dark:text-red-300">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="mb-2">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <Box className="flex items-center bg-gray-100 dark:bg-gray-600 rounded-lg p-2">
        <IconButton 
          size="small" 
          onClick={handlePlayPause} 
          disabled={isLoading}
          className="mr-2"
        >
          {isLoading ? (
            <GraphicEqIcon className="animate-pulse" />
          ) : isPlaying ? (
            <PauseIcon />
          ) : (
            <PlayArrowIcon />
          )}
        </IconButton>

        <Box className="flex-1 mx-2">
          <Slider
            size="small"
            value={currentTime}
            min={0}
            max={audioDuration}
            onChange={(_, value) => handleSeek(value as number)}
            className="h-1"
            sx={{
              color: isMe ? '#25d366' : '#1976d2',
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
              },
              '& .MuiSlider-track': {
                height: 3,
              },
              '& .MuiSlider-rail': {
                height: 3,
                opacity: 0.3,
              },
            }}
          />
        </Box>

        <Typography 
          variant="caption" 
          className="text-gray-600 dark:text-gray-300 ml-2 min-w-[35px] text-right"
        >
          {audioDuration > 0 ? formatTime(audioDuration - currentTime) : '0:00'}
        </Typography>
      </Box>
    </Box>
  );
}
