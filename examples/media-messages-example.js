/**
 * Example: Working with Media Messages
 * 
 * This example demonstrates how to use the enhanced media functionality
 * to fetch messages with detailed media information and download media files.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api/v1';

// Replace these with your actual values
const DEVICE_ID = 'your-device-id';
const CHAT_ID = 'your-chat-id@c.us';

/**
 * Example 1: Fetch messages with enhanced media details
 */
async function fetchMessagesWithMedia() {
  console.log('📥 Fetching messages with media details...');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/devices/${DEVICE_ID}/chats/${CHAT_ID}/messages?limit=20`
    );
    
    const messages = response.data.data;
    
    console.log(`Found ${messages.length} messages`);
    
    messages.forEach((message, index) => {
      console.log(`\n--- Message ${index + 1} ---`);
      console.log(`ID: ${message.id}`);
      console.log(`Type: ${message.type}`);
      console.log(`From Me: ${message.fromMe}`);
      console.log(`Has Media: ${message.hasMedia}`);
      
      if (message.body) {
        console.log(`Body: ${message.body.substring(0, 100)}${message.body.length > 100 ? '...' : ''}`);
      }
      
      // Show media information
      if (message.hasMedia && message.mediaInfo) {
        console.log(`📎 Media Info:`);
        console.log(`  - Type: ${message.mediaInfo.mediaType}`);
        console.log(`  - MIME Type: ${message.mediaInfo.mimetype}`);
        console.log(`  - Download URL: ${message.mediaInfo.downloadUrl}`);
        
        if (message.mediaInfo.thumbnailUrl) {
          console.log(`  - Thumbnail URL: ${message.mediaInfo.thumbnailUrl}`);
        }
        
        if (message.mediaInfo.duration) {
          console.log(`  - Duration: ${message.mediaInfo.duration}s`);
        }
        
        if (message.mediaInfo.dimensions) {
          console.log(`  - Dimensions: ${message.mediaInfo.dimensions.width}x${message.mediaInfo.dimensions.height}`);
        }
        
        if (message.mediaInfo.filename) {
          console.log(`  - Filename: ${message.mediaInfo.filename}`);
        }
      }
      
      // Show location information
      if (message.location) {
        console.log(`📍 Location: ${message.location.latitude}, ${message.location.longitude}`);
        if (message.location.description) {
          console.log(`   Description: ${message.location.description}`);
        }
      }
      
      // Show quoted message (reply)
      if (message.quotedMessage) {
        console.log(`↩️ Quoted Message: "${message.quotedMessage.body}"`);
      }
      
      // Show reactions
      if (message.reactions && message.reactions.length > 0) {
        console.log(`😀 Reactions: ${message.reactions.map(r => r.aggregateEmoji).join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('Error fetching messages:', error.response?.data || error.message);
  }
}

/**
 * Example 2: Download media from a specific message
 */
async function downloadMediaFromMessage(messageId) {
  console.log(`\n📥 Downloading media from message ${messageId}...`);
  
  try {
    // First, get media info
    const infoResponse = await axios.get(
      `${BASE_URL}/devices/${DEVICE_ID}/messages/${messageId}/media/info`
    );
    
    const mediaInfo = infoResponse.data.data;
    console.log('Media Info:', mediaInfo);
    
    // Download the media
    const downloadResponse = await axios.get(
      `${BASE_URL}/devices/${DEVICE_ID}/messages/${messageId}/media/download`,
      { responseType: 'stream' }
    );
    
    // Get the content type and determine file extension
    const contentType = downloadResponse.headers['content-type'];
    let extension = '.bin'; // default
    
    if (contentType) {
      if (contentType.startsWith('image/')) {
        extension = contentType.includes('jpeg') ? '.jpg' : 
                   contentType.includes('png') ? '.png' : 
                   contentType.includes('gif') ? '.gif' : '.img';
      } else if (contentType.startsWith('video/')) {
        extension = '.mp4';
      } else if (contentType.startsWith('audio/')) {
        extension = contentType.includes('ogg') ? '.ogg' : '.mp3';
      } else if (contentType.includes('pdf')) {
        extension = '.pdf';
      }
    }
    
    // Save to downloads directory
    const downloadsDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir);
    }
    
    const filename = `media_${messageId}${extension}`;
    const filepath = path.join(downloadsDir, filename);
    
    const writer = fs.createWriteStream(filepath);
    downloadResponse.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ Media downloaded successfully: ${filepath}`);
        console.log(`File size: ${fs.statSync(filepath).size} bytes`);
        resolve(filepath);
      });
      writer.on('error', reject);
    });
    
  } catch (error) {
    console.error('Error downloading media:', error.response?.data || error.message);
  }
}

/**
 * Example 3: Get thumbnail for image messages
 */
async function downloadThumbnail(messageId) {
  console.log(`\n📥 Downloading thumbnail for message ${messageId}...`);
  
  try {
    const response = await axios.get(
      `${BASE_URL}/devices/${DEVICE_ID}/messages/${messageId}/media/thumbnail`,
      { responseType: 'stream' }
    );
    
    const downloadsDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir);
    }
    
    const filename = `thumbnail_${messageId}.jpg`;
    const filepath = path.join(downloadsDir, filename);
    
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ Thumbnail downloaded: ${filepath}`);
        resolve(filepath);
      });
      writer.on('error', reject);
    });
    
  } catch (error) {
    if (error.response?.status === 501) {
      console.log('ℹ️ Thumbnail extraction not supported for this media type');
    } else if (error.response?.status === 400) {
      console.log('ℹ️ No thumbnail available for this media type');
    } else {
      console.error('Error downloading thumbnail:', error.response?.data || error.message);
    }
  }
}

/**
 * Example 4: Search for media messages
 */
async function searchMediaMessages() {
  console.log('\n🔍 Searching for media messages...');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/devices/${DEVICE_ID}/messages/search?query=&limit=20`
    );
    
    const results = response.data.data;
    const mediaMessages = results.filter(msg => msg.hasMedia);
    
    console.log(`Found ${mediaMessages.length} media messages out of ${results.length} total results`);
    
    mediaMessages.forEach((message, index) => {
      console.log(`\n📎 Media Message ${index + 1}:`);
      console.log(`  - Chat: ${message.chatName}`);
      console.log(`  - Type: ${message.mediaInfo.mediaType}`);
      console.log(`  - MIME Type: ${message.mediaInfo.mimetype}`);
      
      if (message.body) {
        console.log(`  - Caption: ${message.body}`);
      }
    });
    
  } catch (error) {
    console.error('Error searching messages:', error.response?.data || error.message);
  }
}

/**
 * Example 5: Process all media messages in a conversation
 */
async function processAllMediaInConversation() {
  console.log('\n🔄 Processing all media messages in conversation...');
  
  try {
    let hasMore = true;
    let beforeCursor = null;
    let allMediaMessages = [];
    
    while (hasMore) {
      const url = `${BASE_URL}/devices/${DEVICE_ID}/chats/${CHAT_ID}/messages?limit=50${beforeCursor ? `&before=${beforeCursor}` : ''}`;
      const response = await axios.get(url);
      
      const messages = response.data.data;
      const mediaMessages = messages.filter(msg => msg.hasMedia);
      
      allMediaMessages.push(...mediaMessages);
      
      // Check if there are more messages
      hasMore = response.data.pagination.hasMore;
      if (hasMore && response.data.pagination.cursors.older) {
        beforeCursor = response.data.pagination.cursors.older.before;
      } else {
        hasMore = false;
      }
      
      console.log(`Processed batch: ${messages.length} messages, ${mediaMessages.length} media messages`);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`Total media messages: ${allMediaMessages.length}`);
    
    // Count by media type
    const typeCount = {};
    allMediaMessages.forEach(msg => {
      const type = msg.mediaInfo.mediaType;
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    console.log('Media types:');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
    
    return allMediaMessages;
    
  } catch (error) {
    console.error('Error processing media messages:', error.response?.data || error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Enhanced Media Messages Example\n');
  
  try {
    // Example 1: Fetch messages with media details
    await fetchMessagesWithMedia();
    
    // Example 2: Search for media messages
    await searchMediaMessages();
    
    // Example 3: Process all media in conversation
    const mediaMessages = await processAllMediaInConversation();
    
    // Example 4: Download media from first media message found
    if (mediaMessages && mediaMessages.length > 0) {
      const firstMediaMessage = mediaMessages[0];
      console.log(`\n📥 Downloading media from first message: ${firstMediaMessage.id}`);
      
      await downloadMediaFromMessage(firstMediaMessage.id);
      
      // Try to get thumbnail if it's an image
      if (firstMediaMessage.mediaInfo.mediaType === 'image') {
        await downloadThumbnail(firstMediaMessage.id);
      }
    }
    
    console.log('\n✅ Example completed successfully!');
    
  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

// Run the example
if (require.main === module) {
  main();
}

module.exports = {
  fetchMessagesWithMedia,
  downloadMediaFromMessage,
  downloadThumbnail,
  searchMediaMessages,
  processAllMediaInConversation
};
