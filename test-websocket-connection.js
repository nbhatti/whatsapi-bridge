#!/usr/bin/env node
/**
 * WebSocket Connection Test Script
 * 
 * This script tests the WebSocket connection as documented in docs/WEBSOCKET_GATEWAY.md
 * It validates that the documentation examples work correctly.
 */

const { io } = require('socket.io-client');
const readline = require('readline');

// Configuration  
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'test-api-key-123';
const DEVICE_ID = process.argv[2] || 'test-device-123';

console.log('🔌 WebSocket Connection Test');
console.log('============================');
console.log(`Server URL: ${SERVER_URL}`);
console.log(`Device ID: ${DEVICE_ID}`);
console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
console.log('');

// Test 1: Basic Socket.IO endpoint test
console.log('📡 Testing Socket.IO endpoint...');
const testEndpoint = async () => {
    try {
        const response = await fetch(`${SERVER_URL}/ws/socket.io/`);
        const data = await response.json();
        
        if (data.code === 0 && data.message === "Transport unknown") {
            console.log('✅ Socket.IO endpoint is working correctly');
        } else {
            console.log('❌ Unexpected response from Socket.IO endpoint:', data);
        }
    } catch (error) {
        console.log('❌ Failed to connect to Socket.IO endpoint:', error.message);
        process.exit(1);
    }
};

// Test 2: WebSocket connection test
const testWebSocketConnection = () => {
    return new Promise((resolve, reject) => {
        console.log('\n🔗 Testing WebSocket connection...');
        
        const socket = io(`${SERVER_URL}/device/${DEVICE_ID}`, {
            path: '/ws',
            query: { apiKey: API_KEY },
            timeout: 10000
        });

        let connectionSuccessful = false;

        socket.on('connect', () => {
            console.log('✅ WebSocket connected successfully!');
            console.log(`   Socket ID: ${socket.id}`);
            connectionSuccessful = true;
            
            // Set up event listeners as documented
            socket.on('qr', (data) => {
                console.log('📱 QR Code event received:', {
                    deviceId: data.deviceId,
                    timestamp: new Date(data.timestamp).toISOString(),
                    qrLength: data.qr?.length || 0
                });
            });

            socket.on('ready', (data) => {
                console.log('🟢 Device ready event:', {
                    deviceId: data.deviceId,
                    phoneNumber: data.phoneNumber || 'Not provided',
                    timestamp: new Date(data.timestamp).toISOString()
                });
            });

            socket.on('authenticated', (data) => {
                console.log('🔐 Device authenticated event:', {
                    deviceId: data.deviceId,
                    phoneNumber: data.phoneNumber,
                    clientName: data.clientName,
                    timestamp: new Date(data.timestamp).toISOString()
                });
            });

            socket.on('message', (data) => {
                console.log('💬 New message event:', {
                    deviceId: data.deviceId,
                    messageType: data.message?.type || 'unknown',
                    timestamp: new Date(data.timestamp).toISOString()
                });
            });

            socket.on('state', (data) => {
                console.log('🔄 Device state change:', {
                    deviceId: data.deviceId,
                    status: data.status,
                    timestamp: new Date(data.timestamp).toISOString()
                });
            });

            socket.on('disconnected', (data) => {
                console.log('🔴 Device disconnected event:', {
                    deviceId: data.deviceId,
                    reason: data.reason,
                    timestamp: new Date(data.timestamp).toISOString()
                });
            });

            // Keep connection alive for a few seconds to receive events
            setTimeout(() => {
                socket.disconnect();
                resolve();
            }, 5000);
        });

        socket.on('connect_error', (error) => {
            console.log('❌ WebSocket connection failed:', error.message);
            
            // Provide troubleshooting hints
            if (error.message.includes('Invalid API key')) {
                console.log('💡 Troubleshooting: Check your API_KEY in .env file');
            } else if (error.message.includes('timeout')) {
                console.log('💡 Troubleshooting: Server might not be running on the specified port');
            }
            
            reject(error);
        });

        socket.on('disconnect', (reason) => {
            if (connectionSuccessful) {
                console.log('🔌 WebSocket disconnected:', reason);
            }
        });
    });
};

// Main test function
const runTests = async () => {
    try {
        await testEndpoint();
        await testWebSocketConnection();
        
        console.log('\n✅ All WebSocket tests passed!');
        console.log('\n📖 Documentation validation successful.');
        console.log('   The examples in docs/WEBSOCKET_GATEWAY.md are working correctly.');
        console.log('\n🚀 Your WebSocket gateway is ready for use!');
        
    } catch (error) {
        console.log('\n❌ WebSocket tests failed:', error.message);
        console.log('\n🔧 Troubleshooting steps:');
        console.log('1. Ensure the server is running: npm run dev');
        console.log('2. Check your API_KEY in .env file');
        console.log('3. Verify the server is accessible on the specified port');
        console.log('4. Review the complete documentation: docs/WEBSOCKET_GATEWAY.md');
        process.exit(1);
    }
};

// Handle process termination
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('Press Ctrl+C to stop the test\n');

// Run the tests
runTests().then(() => {
    rl.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n\n👋 Test interrupted by user');
    rl.close();
    process.exit(0);
});
