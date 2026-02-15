import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from './auth';
import { logger } from '../utils/logger';

export function logOperation(action: string, module: string, getResource?: (req: Request) => string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(body: any) {
      // Async logging without blocking response
      if (req.user) {
        const resource = getResource ? getResource(req) : req.originalUrl;
        
        prisma.operationLog.create({
          data: {
            userId: req.user.id,
            action,
            module,
            resource,
            details: JSON.stringify({
              method: req.method,
              path: req.path,
              body: req.body,
              query: req.query,
              statusCode: res.statusCode,
            }),
            ip: req.ip,
            userAgent: req.get('user-agent'),
          }
        }).catch(err => {
          logger.error('Failed to log operation', err as Error, {
            userId: req.user?.id,
            action,
            module,
          });
        });
      }
      
      originalSend.call(this, body);
      return this;
    };
    
    next();
  };
}
