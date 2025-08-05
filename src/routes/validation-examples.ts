import { Router, Request, Response } from 'express';
import { validate } from '../middlewares';
import { schemas } from '../config/validation';
import Joi from 'joi';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Validation Examples
 *   description: Examples demonstrating various validation patterns with Joi
 */

// Define specific validation schemas for this route
const validationExampleSchemas = {
  // Query parameter validation example
  searchQuery: Joi.object({
    q: Joi.string().required().min(3).max(100),
    category: Joi.string().valid('users', 'messages', 'devices').default('users'),
    limit: Joi.number().integer().min(1).max(50).default(10),
  }),

  // Body validation with nested objects
  createUser: Joi.object({
    name: Joi.string().required().min(2).max(50),
    email: Joi.string().email().required(),
    age: Joi.number().integer().min(18).max(120).optional(),
    preferences: Joi.object({
      notifications: Joi.boolean().default(true),
      theme: Joi.string().valid('light', 'dark').default('light'),
    }).optional(),
    tags: Joi.array().items(Joi.string().min(1).max(20)).max(5).optional(),
  }),

  // Path parameter with complex validation
  userId: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * @swagger
 * /api/v1/validation-examples/search:
 *   get:
 *     summary: Example of query parameter validation
 *     tags: [Validation Examples]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *         description: Search query (minimum 3 characters)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [users, messages, devices]
 *           default: users
 *         description: Search category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Validation error
 */
router.get('/search', validate(validationExampleSchemas.searchQuery, 'query'), (req: Request, res: Response) => {
  const { q, category, limit } = req.query;
  
  res.json({
    success: true,
    message: 'Query validation successful',
    data: {
      searchQuery: q,
      category,
      limit,
      results: [], // Would contain actual search results
    },
  });
});

/**
 * @swagger
 * /api/v1/validation-examples/users:
 *   post:
 *     summary: Example of request body validation with nested objects and arrays
 *     tags: [Validation Examples]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               age:
 *                 type: integer
 *                 minimum: 18
 *                 maximum: 120
 *               preferences:
 *                 type: object
 *                 properties:
 *                   notifications:
 *                     type: boolean
 *                     default: true
 *                   theme:
 *                     type: string
 *                     enum: [light, dark]
 *                     default: light
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   minLength: 1
 *                   maxLength: 20
 *                 maxItems: 5
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
router.post('/users', validate(validationExampleSchemas.createUser), (req: Request, res: Response) => {
  const { name, email, age, preferences, tags } = req.body;
  
  res.status(201).json({
    success: true,
    message: 'User validation successful',
    data: {
      id: 'generated-uuid-here',
      name,
      email,
      age,
      preferences,
      tags,
      createdAt: new Date().toISOString(),
    },
  });
});

/**
 * @swagger
 * /api/v1/validation-examples/users/{id}:
 *   get:
 *     summary: Example of path parameter validation with UUID format
 *     tags: [Validation Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User details
 *       400:
 *         description: Validation error - invalid UUID format
 *       404:
 *         description: User not found
 */
router.get('/users/:id', validate(validationExampleSchemas.userId, 'params'), (req: Request, res: Response) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'UUID validation successful',
    data: {
      id,
      name: 'John Doe',
      email: 'john@example.com',
      retrievedAt: new Date().toISOString(),
    },
  });
});

/**
 * @swagger
 * /api/v1/validation-examples/message:
 *   post:
 *     summary: Example using predefined WhatsApp message validation schema
 *     tags: [Validation Examples]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *                 pattern: '^\\d{10,15}$'
 *                 description: Phone number (10-15 digits)
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 4096
 *               type:
 *                 type: string
 *                 enum: [text, image, audio, video, document]
 *                 default: text
 *     responses:
 *       200:
 *         description: Message validation successful
 *       400:
 *         description: Validation error
 */
router.post('/message', validate(schemas.sendMessage), (req: Request, res: Response) => {
  const { to, message, type } = req.body;
  
  res.json({
    success: true,
    message: 'WhatsApp message validation successful',
    data: {
      to,
      message,
      type,
      messageId: 'generated-message-id',
      sentAt: new Date().toISOString(),
    },
  });
});

export default router;
