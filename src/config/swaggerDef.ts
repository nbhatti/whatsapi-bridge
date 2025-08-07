
import { Schemas, joiToSwagger } from '../utils/joi-to-swagger';
import { schemas } from './validation';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'WhatsApp Unified API',
    version: '2.0.0',
    description:
      'A powerful, unified WhatsApp API wrapper built on whatsapp-web.js. Features reliable message queuing, device health protection, advanced messaging (text, media, location), message management (forward, delete, search), and comprehensive analytics. Self-hosted, secure, and production-ready.',
    license: {
      name: 'MIT',
      url: 'https://github.com/your-repo/blob/main/LICENSE',
    },
    contact: {
      name: 'API Support',
      url: 'https://github.com/your-repo/issues',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: `/api`,
      description: 'Development server',
    },
  ],
  tags: [
    {
      name: 'Admin',
      description: 'Administrative endpoints for system management.',
    },
    {
      name: 'AI',
      description: 'AI-powered chat analysis and intelligent features.',
    },
    {
      name: 'Analytics',
      description: 'Message analytics and communication insights.',
    },
    {
      name: 'Cache',
      description: 'Cache management and optimization endpoints.',
    },
    {
      name: 'Chats',
      description: 'Direct chat operations and conversation management.',
    },
    {
      name: 'Contacts',
      description: 'Contact information and management.',
    },
    {
      name: 'Devices',
      description: 'WhatsApp device (session) management and status.',
    },
    {
      name: 'Groups',
      description: 'WhatsApp group creation and management.',
    },
    {
      name: 'Messages',
      description: 'Unified message operations with queue reliability, advanced features, and complete message management. Supports text, media, location, forwarding, search, and status monitoring.',
    },
    {
      name: 'Queue Management',
      description: 'Message queue monitoring, configuration, and health management.',
    },
    {
      name: 'Device Health',
      description: 'Device health monitoring, safety checks, and warmup management.',
    },
  ],
  components: {
    schemas: joiToSwagger(schemas as Schemas).swagger,
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
        description: 'API key for authentication. Contact admin to get one.',
      },
    },
  },
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
};

export default swaggerDefinition;

