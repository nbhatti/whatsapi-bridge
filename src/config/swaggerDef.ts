
import { Schemas, joiToSwagger } from '../utils/joi-to-swagger';
import { schemas } from './validation';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'WhatsApp Web.js API',
    version: '1.0.0',
    description:
      'A RESTful API wrapper for the whatsapp-web.js library, designed to be hosted on your own server. This API provides a set of endpoints to interact with WhatsApp, allowing you to send messages, manage contacts, and handle devices programmatically. Secure, scalable, and easy to integrate into your applications.',
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
      name: 'Chats',
      description: 'Endpoints for managing WhatsApp chats and conversations.',
    },
    {
      name: 'Contacts',
      description: 'Endpoints for retrieving contact information.',
    },
    {
      name: 'Devices',
      description: 'Endpoints for managing WhatsApp devices (sessions).',
    },
    {
      name: 'Future',
      description: 'Future and experimental endpoints under development.',
    },
    {
      name: 'Groups',
      description: 'Endpoints for managing WhatsApp groups.',
    },
    {
      name: 'Legacy Messages',
      description: 'Legacy message endpoints maintained for backward compatibility.',
    },
    {
      name: 'Unified Messages',
      description: 'All-in-one message operations with proper forwarding, media, and location support.',
    },
    {
      name: 'Queue Management',
      description: 'Message queue monitoring and configuration endpoints.',
    },
    {
      name: 'Device Health',
      description: 'Device health monitoring and warmup management.',
    },
    {
      name: 'Validation Examples',
      description: 'Examples showcasing Joi validation patterns.',
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

