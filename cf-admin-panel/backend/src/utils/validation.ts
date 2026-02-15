import { z } from 'zod';

/**
 * Validates environment variables on application startup
 */
export function validateEnv() {
  const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
    PORT: z.string().regex(/^\d+$/).transform(Number).optional().default('3000'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),
    JWT_EXPIRES_IN: z.string().optional().default('7d'),
    CF_API_TOKEN: z.string().optional(),
    CF_ACCOUNT_ID: z.string().optional(),
  });

  try {
    const validatedEnv = envSchema.parse(process.env);
    
    // Warn about default JWT secret in production
    if (validatedEnv.NODE_ENV === 'production' && 
        validatedEnv.JWT_SECRET.includes('your-secret-key')) {
      throw new Error('Please change JWT_SECRET in production environment!');
    }
    
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(`Environment validation failed:\n${errors}`);
    }
    throw error;
  }
}

/**
 * Strong password validation schema
 */
export const strongPasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

/**
 * Validates pagination parameters
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

/**
 * Common UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid ID format');
