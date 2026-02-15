import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

/**
 * Standard rate limiter for general API endpoints
 */
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({ error: 'Too many requests, please try again later' });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      username: req.body?.username,
    });
    res.status(429).json({ 
      error: 'Too many login attempts, please try again after 15 minutes' 
    });
  },
});

/**
 * Lenient rate limiter for read-only operations
 */
export const readOnlyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // 200 requests per window
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Middleware to sanitize request inputs
 */
export function sanitizeInputs(req: Request, res: Response, next: NextFunction) {
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
}

/**
 * Middleware to validate request size
 */
export function requestSizeValidator(maxSizeInMB: number = 10) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('content-length');
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      if (sizeInMB > maxSizeInMB) {
        logger.warn('Request size exceeded limit', {
          ip: req.ip,
          path: req.path,
          sizeInMB: sizeInMB.toFixed(2),
          limit: maxSizeInMB,
        });
        return res.status(413).json({ 
          error: `Request size exceeds ${maxSizeInMB}MB limit` 
        });
      }
    }
    next();
  };
}
