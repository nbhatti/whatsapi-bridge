#!/usr/bin/env node

/**
 * Test script for the new mark as read endpoints
 * 
 * Usage:
 * node test-mark-read.js
 * 
 * This script tests the following endpoints:
 * - POST /api/v1/devices/{deviceId}/chats/{chatId}/markRead
 * - POST /api/v1/devices/{deviceId}/chats/{chatId}/messages/{messageId}/markRead
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const DEVICE_ID = 'test-device'; // Replace with your device ID
const CHAT_ID = '1234567890@c.us'; // Replace with a real chat ID
const MESSAGE_ID = 'false_1234567890@c.us_12345'; // Replace with a real message ID

async function testMarkChatAsRead() {
  try {
    console.log('🧪 Testing: Mark Chat as Read');
    console.log(`📍 Endpoint: POST ${BASE_URL}/api/v1/devices/${DEVICE_ID}/chats/${CHAT_ID}/markRead`);
    
    const response = await axios.post(`${BASE_URL}/api/v1/devices/${DEVICE_ID}/chats/${CHAT_ID}/markRead`);
    
    console.log('✅ Success:', response.status);
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log('❌ Error:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('📋 Error Details:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function testMarkMessageAsRead() {
  try {
    console.log('\n🧪 Testing: Mark Message as Read');
    console.log(`📍 Endpoint: POST ${BASE_URL}/api/v1/devices/${DEVICE_ID}/chats/${CHAT_ID}/messages/${MESSAGE_ID}/markRead`);
    
    const response = await axios.post(`${BASE_URL}/api/v1/devices/${DEVICE_ID}/chats/${CHAT_ID}/messages/${MESSAGE_ID}/markRead`);
    
    console.log('✅ Success:', response.status);
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log('❌ Error:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('📋 Error Details:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function testUnreadChats() {
  try {
    console.log('\n🧪 Testing: List Unread Chats (to see unread counts)');
    console.log(`📍 Endpoint: GET ${BASE_URL}/api/v1/devices/${DEVICE_ID}/chats?filter=unread`);
    
    const response = await axios.get(`${BASE_URL}/api/v1/devices/${DEVICE_ID}/chats?filter=unread&summary=true`);
    
    console.log('✅ Success:', response.status);
    console.log('📊 Unread Chats:', response.data.data?.length || 0);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('📋 Sample unread chat:');
      console.log(JSON.stringify(response.data.data[0], null, 2));
    }
    
    return response.data;
  } catch (error) {
    console.log('❌ Error:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('📋 Error Details:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Mark as Read API Tests');
  console.log('=' .repeat(50));
  
  // Test getting unread chats first
  await testUnreadChats();
  
  // Test marking chat as read
  await testMarkChatAsRead();
  
  // Test marking specific message as read
  await testMarkMessageAsRead();
  
  // Test getting unread chats again to see if counts changed
  console.log('\n🔄 Checking unread chats after marking as read...');
  await testUnreadChats();
  
  console.log('\n✨ Tests completed!');
  console.log('\n📝 Notes:');
  console.log('- Make sure your API server is running on localhost:3000');
  console.log('- Update DEVICE_ID, CHAT_ID, and MESSAGE_ID in this script with real values');
  console.log('- Ensure the device is connected and ready');
  console.log('- The WhatsApp Web.js library marks entire chats as read, not individual messages');
}

// Handle command line execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testMarkChatAsRead,
  testMarkMessageAsRead,
  testUnreadChats
};
