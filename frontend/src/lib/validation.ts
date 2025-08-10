import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email format').min(1, 'Email is required');
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number');

const phoneNumberSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(['user', 'admin']).optional().default('user'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// User management schemas
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

// Device schemas
export const createDeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(100, 'Device name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

export const updateDeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(100, 'Device name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  isActive: z.boolean().optional(),
});

// Message schemas
export const sendMessageSchema = z.object({
  to: phoneNumberSchema,
  message: z.string().min(1, 'Message is required').max(4096, 'Message too long'),
  deviceId: z.string().min(1, 'Device ID is required'),
  messageType: z.enum(['text', 'image', 'document']).optional().default('text'),
});

export const messageSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Query too long'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  deviceId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// Contact schemas
export const createContactSchema = z.object({
  phoneNumber: phoneNumberSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email().optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: z.string().email().optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

// Group schemas
export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  participants: z.array(phoneNumberSchema).min(1, 'At least one participant is required'),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
});

export const addParticipantsSchema = z.object({
  participants: z.array(phoneNumberSchema).min(1, 'At least one participant is required'),
});

// AI Chat schemas
export const aiChatSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000, 'Prompt too long'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
  targetChatId: z.string().optional(),
  model: z.string().optional(),
});

// Analytics schemas
export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  deviceId: z.string().optional(),
  limit: z.number().int().min(1).max(1000).optional().default(100),
});

// Generic ID parameter validation
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const deviceIdParamSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

export const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export const contactIdParamSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
});

export const groupIdParamSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
});

// Validation helper functions
export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Invalid request data' };
  }
}

export function validateParams<T>(schema: z.ZodSchema<T>, params: unknown): { success: true; data: T } | { success: false; error: string } {
  return validateRequestBody(schema, params);
}

// Middleware wrapper for validation
export function withValidation<TBody, TParams extends any[]>(
  bodySchema: z.ZodSchema<TBody> | null,
  handler: (request: NextRequest, validatedBody: TBody | null, ...args: TParams) => Promise<NextResponse | Response>
) {
  return async function validatedHandler(request: NextRequest, ...args: TParams) {
    let validatedBody: TBody | null = null;
    
    if (bodySchema && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
      try {
        const body = await request.json();
        const validation = validateRequestBody(bodySchema, body);
        
        if (!validation.success) {
          return NextResponse.json(
            { error: 'Validation failed', details: validation.error },
            { status: 400 }
          );
        }
        
        validatedBody = validation.data;
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    }
    
    return handler(request, validatedBody, ...args);
  };
}
