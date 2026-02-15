import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from './auth';

export function logOperation(action: string, module: string, getResource?: (req: Request) => string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(body: any) {
      // 异步记录日志，不阻塞响应
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
        }).catch(err => console.error('日志记录失败:', err));
      }
      
      originalSend.call(this, body);
      return this;
    };
    
    next();
  };
}
