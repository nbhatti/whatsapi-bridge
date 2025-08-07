import { getRedisClient } from '../config/redis';
import logger, { logInfo, logError, logWarn } from '../config/logger';
import { DeviceManager } from './DeviceManager';
import { MessageMedia, MessageSendOptions } from 'whatsapp-web.js';

export interface QueuedMessage {
  id: string;
  deviceId: string;
  to: string;
  type: 'text' | 'media';
  content: string;
  mediaBase64?: string;
  mediaType?: string;
  options?: MessageSendOptions;
  priority: 'high' | 'normal' | 'low';
  scheduledAt: number;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  delay?: number;
}

export interface MessageQueueConfig {
  // Delays in milliseconds
  minDelay: number;
  maxDelay: number;
  
  // Retry configuration
  maxAttempts: number;
  retryDelay: number;
  
  // Rate limiting per device
  messagesPerMinute: number;
  burstLimit: number;
  
  // Human-like behavior
  typingDelay: boolean;
  readReceiptDelay: boolean;
}

const DEFAULT_CONFIG: MessageQueueConfig = {
  minDelay: parseInt(process.env.MESSAGE_MIN_DELAY || '1000'), // 1 second
  maxDelay: parseInt(process.env.MESSAGE_MAX_DELAY || '10000'), // 10 seconds
  maxAttempts: parseInt(process.env.MESSAGE_MAX_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.MESSAGE_RETRY_DELAY || '5000'), // 5 seconds
  messagesPerMinute: parseInt(process.env.MESSAGES_PER_MINUTE || '10'),
  burstLimit: parseInt(process.env.MESSAGE_BURST_LIMIT || '3'),
  typingDelay: process.env.ENABLE_TYPING_DELAY !== 'false',
  readReceiptDelay: process.env.ENABLE_READ_RECEIPT_DELAY !== 'false',
};

export class MessageQueueService {
  private static instance: MessageQueueService;
  private redisClient;
  private deviceManager;
  private isProcessing = false;
  private config: MessageQueueConfig;
  
  // Redis keys with specific prefixes to avoid conflicts
  private readonly QUEUE_KEY = 'whatsapp:msg_queue';
  private readonly PROCESSING_KEY = 'whatsapp:msg_processing';
  private readonly DEVICE_RATE_KEY = 'whatsapp:device_rate';
  private readonly DEVICE_LAST_MESSAGE_KEY = 'whatsapp:device_last_msg';

  private constructor() {
    this.redisClient = getRedisClient();
    this.deviceManager = DeviceManager.getInstance();
    this.config = { ...DEFAULT_CONFIG };
    this.startProcessing();
  }

  public static getInstance(): MessageQueueService {
    if (!MessageQueueService.instance) {
      MessageQueueService.instance = new MessageQueueService();
    }
    return MessageQueueService.instance;
  }

  /**
   * Add a message to the queue
   */
  public async queueMessage(message: Omit<QueuedMessage, 'id' | 'scheduledAt' | 'attempts' | 'createdAt'>): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate delay based on device's recent activity
    const delay = await this.calculateDelay(message.deviceId);
    
    const queuedMessage: QueuedMessage = {
      ...message,
      id: messageId,
      scheduledAt: Date.now() + delay,
      attempts: 0,
      createdAt: Date.now(),
      delay,
    };

    // Add to Redis sorted set (sorted by scheduledAt)
    await this.redisClient.zadd(this.QUEUE_KEY, queuedMessage.scheduledAt, JSON.stringify(queuedMessage));
    
    logInfo(`Message queued: ${messageId} for device ${this.deviceManager.getFormattedDeviceId(message.deviceId)} with ${delay}ms delay`);
    
    return messageId;
  }

  /**
   * Calculate human-like delay based on device activity
   */
  private async calculateDelay(deviceId: string): Promise<number> {
    try {
      // Get last message time for this device
      const lastMessageTime = await this.redisClient.get(`${this.DEVICE_LAST_MESSAGE_KEY}:${deviceId}`);
      const now = Date.now();
      
      if (lastMessageTime) {
        const timeSinceLastMessage = now - parseInt(lastMessageTime);
        
        // If last message was very recent, add extra delay
        if (timeSinceLastMessage < 30000) { // Less than 30 seconds
          return this.getRandomDelay(this.config.maxDelay * 0.8, this.config.maxDelay);
        }
      }
      
      // Check current rate limit for device
      const messageCount = await this.getDeviceMessageCount(deviceId);
      
      if (messageCount >= this.config.messagesPerMinute) {
        // Device is at rate limit, add extra delay
        return this.getRandomDelay(this.config.maxDelay * 0.6, this.config.maxDelay);
      } else if (messageCount >= this.config.burstLimit) {
        // Device is approaching burst limit
        return this.getRandomDelay(this.config.minDelay * 2, this.config.maxDelay * 0.7);
      }
      
      // Normal random delay
      return this.getRandomDelay(this.config.minDelay, this.config.maxDelay);
      
    } catch (error) {
      logError('Error calculating delay:', error);
      return this.getRandomDelay(this.config.minDelay, this.config.maxDelay);
    }
  }

  /**
   * Get random delay within range
   */
  private getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get device message count for rate limiting
   */
  private async getDeviceMessageCount(deviceId: string): Promise<number> {
    const key = `${this.DEVICE_RATE_KEY}:${deviceId}`;
    const count = await this.redisClient.get(key);
    return count ? parseInt(count) : 0;
  }

  /**
   * Increment device message count
   */
  private async incrementDeviceMessageCount(deviceId: string): Promise<void> {
    const key = `${this.DEVICE_RATE_KEY}:${deviceId}`;
    const current = await this.redisClient.incr(key);
    
    if (current === 1) {
      // Set expiration to 1 minute for rate limiting window
      await this.redisClient.expire(key, 60);
    }
  }

  /**
   * Start processing the message queue
   */
  private startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    logInfo('Message queue processing started');
    
    // Process queue every 2 seconds
    const processInterval = setInterval(async () => {
      try {
        await this.processQueue();
      } catch (error) {
        logError('Error processing message queue:', error);
      }
    }, 2000);

    // Cleanup on process exit
    process.on('SIGINT', () => {
      clearInterval(processInterval);
      this.isProcessing = false;
      logInfo('Message queue processing stopped');
    });
  }

  /**
   * Process messages from the queue
   */
  private async processQueue(): Promise<void> {
    const now = Date.now();
    
    // Get messages that are ready to be sent (score <= now)
    const messages = await this.redisClient.zrangebyscore(
      this.QUEUE_KEY, 
      '-inf', 
      now.toString(), 
      'LIMIT', 
      '0', 
      '5' // Process up to 5 messages at a time
    );

    if (messages.length === 0) return;

    for (const messageData of messages) {
      try {
        const message: QueuedMessage = JSON.parse(messageData);
        
        // Check if device is ready
        const device = this.deviceManager.getDevice(message.deviceId);
        if (!device || device.status !== 'ready') {
          // Remove from current position and reschedule for later
          await this.redisClient.zrem(this.QUEUE_KEY, messageData);
          await this.rescheduleMessage(message, 30000); // 30 seconds later
          continue;
        }

        // Remove from queue before processing
        await this.redisClient.zrem(this.QUEUE_KEY, messageData);
        
        // Add to processing set
        await this.redisClient.sadd(this.PROCESSING_KEY, message.id);
        
        // Process the message
        await this.sendMessage(message);
        
        // Remove from processing set
        await this.redisClient.srem(this.PROCESSING_KEY, message.id);
        
      } catch (error) {
        logError('Error processing queued message:', error);
      }
    }
  }

  /**
   * Send a message with human-like behavior
   */
  private async sendMessage(message: QueuedMessage): Promise<void> {
    const device = this.deviceManager.getDevice(message.deviceId);
    if (!device || device.status !== 'ready') {
      throw new Error(`Device ${message.deviceId} not ready`);
    }

    try {
      // Format phone number
      let formattedTo = message.to;
      if (!message.to.includes('@')) {
        formattedTo = `${message.to}@c.us`;
      }

      // Simulate typing indicator if enabled
      if (this.config.typingDelay && message.type === 'text') {
        const chat = await device.client.getChatById(formattedTo);
        await chat.sendStateTyping();
        
        // Wait for typing duration (based on message length)
        const typingDuration = Math.min(message.content.length * 50, 3000); // Max 3 seconds
        await this.delay(typingDuration);
        
        await chat.clearState();
      }

      // Send the actual message
      let sentMessage;
      if (message.type === 'text') {
        sentMessage = await device.client.sendMessage(formattedTo, message.content, message.options);
      } else if (message.type === 'media' && message.mediaBase64) {
        const media = new MessageMedia(message.mediaType || 'image/jpeg', message.mediaBase64);
        sentMessage = await device.client.sendMessage(formattedTo, media, message.options);
      }

      // Update device activity tracking
      await this.redisClient.set(`${this.DEVICE_LAST_MESSAGE_KEY}:${message.deviceId}`, Date.now().toString());
      await this.incrementDeviceMessageCount(message.deviceId);

      logInfo(`Message sent successfully: ${message.id} to ${message.to} from device ${this.deviceManager.getFormattedDeviceId(message.deviceId)} | Type: ${message.type} | Content: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`);
      
    } catch (error: any) {
      logError(`Failed to send message ${message.id} to ${message.to}:`, {
        error: error.message,
        stack: error.stack,
        messageId: message.id,
        deviceId: message.deviceId,
        to: message.to,
        type: message.type,
        content: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '')
      });
      
      // Retry logic
      if (message.attempts < message.maxAttempts) {
        message.attempts++;
        message.scheduledAt = Date.now() + this.config.retryDelay * message.attempts;
        
        await this.redisClient.zadd(this.QUEUE_KEY, message.scheduledAt, JSON.stringify(message));
        logInfo(`Message ${message.id} rescheduled for retry (attempt ${message.attempts}/${message.maxAttempts})`);
      } else {
        logError(`Message ${message.id} failed after ${message.maxAttempts} attempts`);
      }
    }
  }

  /**
   * Reschedule a message for later processing
   */
  private async rescheduleMessage(message: QueuedMessage, delayMs: number): Promise<void> {
    message.scheduledAt = Date.now() + delayMs;
    await this.redisClient.zadd(this.QUEUE_KEY, message.scheduledAt, JSON.stringify(message));
    logInfo(`Message ${message.id} rescheduled for ${delayMs}ms later`);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   */
  public async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    totalQueued: number;
  }> {
    const [pending, processing] = await Promise.all([
      this.redisClient.zcount(this.QUEUE_KEY, '-inf', '+inf'),
      this.redisClient.scard(this.PROCESSING_KEY)
    ]);

    return {
      pending: pending,
      processing,
      totalQueued: pending + processing,
    };
  }

  /**
   * Get device queue status
   */
  public async getDeviceStatus(deviceId: string): Promise<{
    messagesInLast60s: number;
    lastMessageTime: number | null;
    queuedMessages: number;
  }> {
    const [messageCount, lastMessageTime, queuedCount] = await Promise.all([
      this.getDeviceMessageCount(deviceId),
      this.redisClient.get(`${this.DEVICE_LAST_MESSAGE_KEY}:${deviceId}`),
      this.redisClient.zcount(this.QUEUE_KEY, '-inf', '+inf') // This is simplified, could be made device-specific
    ]);

    return {
      messagesInLast60s: messageCount,
      lastMessageTime: lastMessageTime ? parseInt(lastMessageTime) : null,
      queuedMessages: queuedCount,
    };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<MessageQueueConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logInfo('Message queue configuration updated', newConfig);
  }

  /**
   * Clear all queued messages
   */
  public async clearQueue(): Promise<number> {
    const count = await this.redisClient.zcard(this.QUEUE_KEY);
    await this.redisClient.del(this.QUEUE_KEY);
    await this.redisClient.del(this.PROCESSING_KEY);
    logInfo(`Cleared ${count} messages from queue`);
    return count;
  }
}
