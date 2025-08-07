import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import { v4 as uuidv4 } from 'uuid';
import qrcode from 'qrcode-terminal';
import logger from './logger';
import { getRedisClient } from './redis';
import { cacheInbound, cacheOutbound } from '../services/messageCache';
import { convertToLightMessageMeta, shouldCacheMessage } from '../utils/messageUtils';
import path from 'path';
import fs from 'fs';

export interface WhatsAppClientConfig {
  clientId: string;
  name?: string;
  webhook?: string;
  puppeteerOptions?: any;
}

export interface ClientInstance {
  id: string;
  client: Client;
  status: 'initializing' | 'qr_code' | 'authenticated' | 'ready' | 'disconnected';
  qrCode?: string;
  createdAt: Date;
  lastActivity: Date;
}

// Store for active client instances
export const activeClients = new Map<string, ClientInstance>();

// Create WhatsApp client instance
export const createWhatsAppClient = async (config: WhatsAppClientConfig): Promise<ClientInstance> => {
  const clientId = config.clientId || uuidv4();
  
  // Create session directory
  const sessionPath = path.join(process.cwd(), 'sessions', clientId);
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: clientId,
      dataPath: sessionPath,
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
      ...config.puppeteerOptions,
    },
  });

  const clientInstance: ClientInstance = {
    id: clientId,
    client,
    status: 'initializing',
    createdAt: new Date(),
    lastActivity: new Date(),
  };

  // Setup event handlers
  setupClientEventHandlers(clientInstance, config);

  // Store client instance
  activeClients.set(clientId, clientInstance);

  // Save client metadata to Redis
  await saveClientMetadata(clientId, {
    name: config.name,
    webhook: config.webhook,
    status: 'initializing',
    createdAt: new Date().toISOString(),
  });

  logger.info(`WhatsApp client created: ${clientId}`);
  
  return clientInstance;
};

// Setup event handlers for WhatsApp client
const setupClientEventHandlers = (clientInstance: ClientInstance, config: WhatsAppClientConfig) => {
  const { client, id } = clientInstance;

  client.on('qr', async (qr) => {
    logger.info(`QR Code generated for client: ${id}`);
    clientInstance.status = 'qr_code';
    clientInstance.qrCode = qr;
    
    // Generate QR code in terminal for development
    if (process.env.NODE_ENV === 'development') {
      qrcode.generate(qr, { small: true });
    }

    // Save QR code to Redis with expiration
    const redisClient = getRedisClient();
    await redisClient.setex(`whatsapp:qr:${id}`, 300, qr); // 5 minutes expiration
    
    // Update client status
    await updateClientStatus(id, 'qr_code');
  });

  client.on('authenticated', async () => {
    logger.info(`Client authenticated: ${id}`);
    clientInstance.status = 'authenticated';
    await updateClientStatus(id, 'authenticated');
  });

  client.on('ready', async () => {
    logger.info(`Client ready: ${id}`);
    clientInstance.status = 'ready';
    clientInstance.lastActivity = new Date();
    await updateClientStatus(id, 'ready');
  });

  client.on('auth_failure', async (msg) => {
    logger.error(`Authentication failed for client ${id}:`, msg);
    clientInstance.status = 'disconnected';
    await updateClientStatus(id, 'disconnected');
  });

  client.on('disconnected', async (reason) => {
    logger.warn(`Client disconnected ${id}:`, reason);
    clientInstance.status = 'disconnected';
    await updateClientStatus(id, 'disconnected');
  });

  client.on('message', async (message) => {
    logger.debug(`Message received on client ${id}:`, {
      from: message.from,
      body: message.body.substring(0, 100),
    });
    
    clientInstance.lastActivity = new Date();
    
    // Cache inbound message
    if (shouldCacheMessage(message)) {
      try {
        const messageMeta = convertToLightMessageMeta(message, id, false);
        await cacheInbound(messageMeta);
        logger.debug(`Cached inbound message ${messageMeta.messageId} from client ${id}`);
      } catch (error) {
        logger.error(`Failed to cache inbound message from client ${id}:`, error);
      }
    }
    
    // Send webhook if configured
    if (config.webhook) {
      await sendWebhook(config.webhook, {
        type: 'message',
        clientId: id,
        data: {
          id: message.id._serialized,
          from: message.from,
          body: message.body,
          timestamp: message.timestamp,
          hasMedia: message.hasMedia,
        },
      });
    }
  });

  client.on('message_create', async (message) => {
    if (message.fromMe) {
      logger.debug(`Message sent from client ${id}:`, {
        to: message.to,
        body: message.body.substring(0, 100),
      });
      
      clientInstance.lastActivity = new Date();
      
      // Cache outbound message
      if (shouldCacheMessage(message)) {
        try {
          const messageMeta = convertToLightMessageMeta(message, id, true);
          await cacheOutbound(messageMeta);
          logger.debug(`Cached outbound message ${messageMeta.messageId} from client ${id}`);
        } catch (error) {
          logger.error(`Failed to cache outbound message from client ${id}:`, error);
        }
      }
    }
  });
};

// Initialize WhatsApp client
export const initializeClient = async (clientId: string): Promise<void> => {
  const clientInstance = activeClients.get(clientId);
  if (!clientInstance) {
    throw new Error(`Client not found: ${clientId}`);
  }

  try {
    await clientInstance.client.initialize();
    logger.info(`Client initialization started: ${clientId}`);
  } catch (error) {
    logger.error(`Failed to initialize client ${clientId}:`, error);
    throw error;
  }
};

// Destroy WhatsApp client
export const destroyClient = async (clientId: string): Promise<void> => {
  const clientInstance = activeClients.get(clientId);
  if (!clientInstance) {
    return;
  }

  try {
    await clientInstance.client.destroy();
    activeClients.delete(clientId);
    
    // Clean up Redis data
    const redisClient = getRedisClient();
    await redisClient.del(`whatsapp:client:${clientId}`);
    await redisClient.del(`whatsapp:qr:${clientId}`);
    
    logger.info(`Client destroyed: ${clientId}`);
  } catch (error) {
    logger.error(`Failed to destroy client ${clientId}:`, error);
    throw error;
  }
};

// Get client instance
export const getClient = (clientId: string): ClientInstance | undefined => {
  return activeClients.get(clientId);
};

// Get all active clients
export const getAllClients = (): ClientInstance[] => {
  return Array.from(activeClients.values());
};

// Save client metadata to Redis
const saveClientMetadata = async (clientId: string, metadata: any): Promise<void> => {
  const redisClient = getRedisClient();
  await redisClient.hset(`whatsapp:client:${clientId}`, metadata);
};

// Update client status
const updateClientStatus = async (clientId: string, status: string): Promise<void> => {
  const redisClient = getRedisClient();
  await redisClient.hset(`whatsapp:client:${clientId}`, {
    status,
    lastUpdate: new Date().toISOString(),
  });
};

// Send webhook notification
const sendWebhook = async (webhookUrl: string, data: any): Promise<void> => {
  try {
    const fetch = (await import('node-fetch')).default;
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    logger.error('Failed to send webhook:', error);
  }
};

// Cleanup inactive clients (run periodically)
export const cleanupInactiveClients = async (): Promise<void> => {
  const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
  const now = new Date();

  for (const [clientId, clientInstance] of activeClients.entries()) {
    const timeSinceLastActivity = now.getTime() - clientInstance.lastActivity.getTime();
    
    if (timeSinceLastActivity > inactiveThreshold && clientInstance.status === 'disconnected') {
      logger.info(`Cleaning up inactive client: ${clientId}`);
      await destroyClient(clientId);
    }
  }
};
