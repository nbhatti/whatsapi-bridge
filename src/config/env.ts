import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  
  // Database configuration (example)
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // JWT configuration (example)
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // CORS configuration (example)
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Rate limiting (example)
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
} as const;

// Validate required environment variables
const requiredEnvVars: (keyof typeof env)[] = [];

export const validateEnv = (): void => {
  const missingVars = requiredEnvVars.filter(varName => !env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};
