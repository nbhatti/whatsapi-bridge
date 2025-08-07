import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Common validation schemas
export const schemas = {
  // Legacy message schemas (keeping for compatibility)
  legacySendMessage: Joi.object({
    to: Joi.string().required().min(10).max(15).pattern(/^\d+$/),
    message: Joi.string().required().min(1).max(4096),
    type: Joi.string().valid('text', 'image', 'audio', 'video', 'document').default('text'),
  }),

  sendMedia: Joi.object({
    to: Joi.string().required().min(10).max(15).pattern(/^\d+$/),
    media: Joi.string().required(), // URL or base64
    caption: Joi.string().optional().max(1024),
    type: Joi.string().valid('image', 'audio', 'video', 'document').required(),
  }),

  // Client management schemas
  createClient: Joi.object({
    clientId: Joi.string().required().min(3).max(50).pattern(/^[a-zA-Z0-9_-]+$/),
    name: Joi.string().optional().max(100),
    webhook: Joi.string().optional().uri(),
  }),

  updateClient: Joi.object({
    name: Joi.string().optional().max(100),
    webhook: Joi.string().optional().uri().allow(''),
    status: Joi.string().valid('active', 'inactive').optional(),
  }),

  // Query parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),

  clientId: Joi.object({
    clientId: Joi.string().required().min(3).max(50).pattern(/^[a-zA-Z0-9_-]+$/),
  }),


  // Device Schemas
  deviceId: Joi.object({
    id: Joi.string().required(),
  }),

  // Group Schemas
  groupId: Joi.object({
    groupId: Joi.string().required(),
  }),

  joinGroup: Joi.object({
    inviteCode: Joi.string().optional(),
    inviteLink: Joi.string().optional().uri(),
  }).xor('inviteCode', 'inviteLink'),
  // Message Schemas
  sendMessage: Joi.object({
    to: Joi.string().required().min(10).max(15).pattern(/^\d+$/),
    type: Joi.string().valid('text', 'image', 'video', 'audio', 'document', 'sticker').default('text'),
    text: Joi.string().when('type', { is: 'text', then: Joi.required(), otherwise: Joi.optional() }),
    mediaBase64: Joi.string().when('type', { 
      is: Joi.not('text'), 
      then: Joi.required(), 
      otherwise: Joi.forbidden() 
    }),
    quotedId: Joi.string().optional(),
    mentions: Joi.array().items(Joi.string()).optional(),
  }),

  fetchMessages: Joi.object({
    chatId: Joi.string().required(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    before: Joi.string().optional(),
  }),

  // Contact Schemas
  getContacts: Joi.object({
    search: Joi.string().optional().min(1).max(100),
    contactIds: Joi.array().items(Joi.string()).optional(),
  }).allow({}),

  // Chat Schemas
  chatId: Joi.object({
    id: Joi.string().optional(), // Device ID from parent route
    chatId: Joi.string().required(),
  }),

  listChats: Joi.object({
    filter: Joi.string().valid('all', 'unread', 'groups', 'private', 'archived').default('all'),
    limit: Joi.number().integer().min(1).max(100).default(20),
    summary: Joi.boolean().default(true),
    search: Joi.string().optional().min(1).max(100),
  }),

  fetchChatMessages: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    before: Joi.string().optional(),
    after: Joi.string().optional(),
  }),

  sendChatMessage: Joi.object({
    to: Joi.string().required(),
    text: Joi.string().when('media', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
    media: Joi.object({
      mimetype: Joi.string().required(),
      data: Joi.string().required(), // base64 encoded
      filename: Joi.string().optional(),
    }).optional(),
    quotedMessageId: Joi.string().optional(),
    mentions: Joi.array().items(Joi.string()).optional(),
  }),

  forwardMessage: Joi.object({
    messageId: Joi.string().required(),
    to: Joi.string().required(),
  }),

  deleteMessage: Joi.object({
    messageId: Joi.string().required(),
    forEveryone: Joi.boolean().default(false),
  }),

  analyzeChatAI: Joi.object({
    messageLimit: Joi.number().integer().min(1).max(1000).default(100),
    analysisType: Joi.string().valid('comprehensive', 'sentiment', 'summary', 'issues', 'custom').default('comprehensive'),
    includeMetadata: Joi.boolean().default(true),
    provider: Joi.string().valid('openai', 'openrouter', 'xai', 'custom').optional(),
    model: Joi.string().optional(),
    customQuery: Joi.string().min(10).max(1000).optional(),
  }),

  // Unified Message Schemas
  sendUnifiedMessage: Joi.object({
    to: Joi.string().required(),
    text: Joi.string().optional(),
    media: Joi.object({
      mimetype: Joi.string().required(),
      data: Joi.string().required(),
      filename: Joi.string().optional()
    }).optional(),
    location: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      description: Joi.string().optional()
    }).optional(),
    quotedMessageId: Joi.string().optional(),
    mentions: Joi.array().items(Joi.string()).optional()
  }).or('text', 'media', 'location'),

  forwardUnifiedMessage: Joi.object({
    messageId: Joi.string().required(),
    to: Joi.string().required(),
    fromChatId: Joi.string().optional()
  }),

  deleteUnifiedMessage: Joi.object({
    messageId: Joi.string().required(),
    forEveryone: Joi.boolean().default(false),
    fromChatId: Joi.string().optional()
  }),

  editUnifiedMessage: Joi.object({
    messageId: Joi.string().required(),
    newText: Joi.string().required().min(1).max(4096),
    fromChatId: Joi.string().optional()
  }),

  // Mentions and Groups Schemas
  mentionGroupMessage: Joi.object({
    text: Joi.string().required().min(1).max(4096),
    mentions: Joi.array().items(Joi.string()).optional(),
    mentionAll: Joi.boolean().default(false)
  }),

  mentionMessage: Joi.object({
    to: Joi.string().required(),
    text: Joi.string().required().min(1).max(4096),
    mentions: Joi.array().items(Joi.string()).optional(),
    quotedMessageId: Joi.string().optional(),
    media: Joi.object({
      mimetype: Joi.string().required(),
      data: Joi.string().required(),
      filename: Joi.string().optional()
    }).optional(),
    mentionAll: Joi.boolean().default(false)
  }),

  // Example request schemas
  exampleMessage: Joi.object({
    message: Joi.string().required().min(1).max(500),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  }),

  exampleUpload: Joi.object({
    fileName: Joi.string().required().min(1).max(255),
    fileType: Joi.string().valid('image', 'document', 'video').required(),
    fileSize: Joi.number().integer().min(1).max(10485760), // 10MB max
  }),

  // Environment variables validation
  env: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().integer().min(1000).max(65535).default(3000),
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().integer().min(1).max(65535).default(6379),
    REDIS_PASSWORD: Joi.string().optional().allow(''),
    REDIS_DB: Joi.number().integer().min(0).max(15).default(0),
    CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().min(1).default(100),
  }).unknown(true),
};

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      // Keep existing params when validating, only strip for body and query
      stripUnknown: property !== 'params',
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errorMessage,
      });
      return;
    }

    // Replace the original data with validated data
    try {
      // Use Object.defineProperty to handle readonly properties
      Object.defineProperty(req, property, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } catch (err) {
      // Fallback for cases where property can't be redefined
      console.warn(`Could not override req.${property}, using original value`);
    }
    next();
  };
};

// Environment validation
export const validateEnvironment = (): void => {
  const { error, value } = schemas.env.validate(process.env);
  
  if (error) {
    console.error('Environment validation failed:', error.details.map(d => d.message).join(', '));
    process.exit(1);
  }

  // Set validated environment variables
  Object.assign(process.env, value);
};

// Custom validation helpers
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\d{10,15}$/;
  return phoneRegex.test(phone);
};

export const isValidClientId = (clientId: string): boolean => {
  const clientIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return clientIdRegex.test(clientId);
};
