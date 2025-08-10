"use client";

import { useState } from 'react';
import { Box, Typography, Button, TextField, Paper } from '@mui/material';
import { AudioPlayer } from '../../components/chat/AudioPlayer';

export default function AudioTestPage() {
  const [deviceId, setDeviceId] = useState('d7172497-d027-4b66-816b-d2dae38b3740');
  const [messageId, setMessageId] = useState('');
  const [testUrl, setTestUrl] = useState('');

  const generateTestUrl = () => {
    if (deviceId && messageId) {
      const url = `/api/devices/${deviceId}/media/${encodeURIComponent(messageId)}?type=audio&t=${Date.now()}`;
      setTestUrl(url);
    }
  };

  const testDirectBackend = () => {
    if (deviceId && messageId) {
      const url = `http://localhost:3000/devices/${deviceId}/media/${messageId}?type=audio`;
      window.open(url, '_blank');
    }
  };

  return (
    <Box className="container mx-auto p-8">
      <Typography variant="h4" className="mb-6">
        Audio Message Test Page
      </Typography>

      <Paper className="p-6 mb-6">
        <Typography variant="h6" className="mb-4">
          Test Media URL Generation
        </Typography>
        
        <TextField
          label="Device ID"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          fullWidth
          className="mb-4"
        />
        
        <TextField
          label="Message ID"
          value={messageId}
          onChange={(e) => setMessageId(e.target.value)}
          fullWidth
          className="mb-4"
          placeholder="Enter message ID from backend logs"
        />
        
        <Box className="flex gap-4 mb-4">
          <Button variant="contained" onClick={generateTestUrl}>
            Generate Test URL
          </Button>
          <Button variant="outlined" onClick={testDirectBackend}>
            Test Direct Backend
          </Button>
        </Box>
        
        {testUrl && (
          <Box className="mt-4">
            <Typography variant="subtitle2" className="mb-2">
              Generated URL:
            </Typography>
            <Paper className="p-2 bg-gray-100">
              <Typography variant="body2" className="break-all">
                {testUrl}
              </Typography>
            </Paper>
          </Box>
        )}
      </Paper>

      {testUrl && (
        <Paper className="p-6 mb-6">
          <Typography variant="h6" className="mb-4">
            Audio Player Test
          </Typography>
          <AudioPlayer 
            audioUrl={testUrl} 
            duration={30} 
            isMe={false}
          />
        </Paper>
      )}

      <Paper className="p-6">
        <Typography variant="h6" className="mb-4">
          Sample Audio URLs
        </Typography>
        <Typography variant="body2" className="mb-4">
          Test with sample audio files:
        </Typography>
        
        <Box className="space-y-4">
          <Box>
            <Typography variant="subtitle2" className="mb-2">
              Sample OGG Audio:
            </Typography>
            <AudioPlayer 
              audioUrl="https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" 
              duration={3} 
              isMe={true}
            />
          </Box>
          
          <Box>
            <Typography variant="subtitle2" className="mb-2">
              Sample MP3 Audio:
            </Typography>
            <AudioPlayer 
              audioUrl="https://www.w3schools.com/html/horse.mp3" 
              duration={10} 
              isMe={false}
            />
          </Box>
        </Box>
      </Paper>

      <Paper className="p-6 mt-6">
        <Typography variant="h6" className="mb-4">
          Instructions
        </Typography>
        <Typography variant="body2" className="mb-2">
          1. Start your WhatsApp backend server on port 3000
        </Typography>
        <Typography variant="body2" className="mb-2">
          2. Send a voice message in WhatsApp to get a PTT message
        </Typography>
        <Typography variant="body2" className="mb-2">
          3. Check browser console for message IDs when loading chat messages
        </Typography>
        <Typography variant="body2" className="mb-2">
          4. Copy a message ID from a PTT message and paste it above
        </Typography>
        <Typography variant="body2">
          5. Test the audio player functionality
        </Typography>
      </Paper>
    </Box>
  );
}
