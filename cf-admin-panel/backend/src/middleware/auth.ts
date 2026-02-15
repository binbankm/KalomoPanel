import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { cache, CacheKeys } from '../utils/cache';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    roleId: string;
    permissions: string[];
  };
}

export function generateToken(userId: string, username: string, roleId: string): string {
  return jwt.sign(
    { userId, username, roleId },
    JWT_SECRET as jwt.Secret,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  );
}

export function verifyToken(token: string): { userId: string; username: string; roleId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; username: string; roleId: string };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Try to get user permissions from cache first
    const cacheKey = CacheKeys.userPermissions(decoded.userId);
    let permissions = cache.get<string[]>(cacheKey);

    if (!permissions) {
      // Cache miss - fetch from database
      const userWithRole = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      });

      if (!userWithRole || userWithRole.status !== 'ACTIVE') {
        return res.status(401).json({ error: '用户不存在或已被禁用' });
      }

      permissions = userWithRole.role.permissions.map((rp: { permission: { code: string } }) => rp.permission.code);
      
      // Cache permissions for 5 minutes
      cache.set(cacheKey, permissions, 5 * 60 * 1000);
    }

    req.user = {
      id: decoded.userId,
      username: decoded.username,
      roleId: decoded.roleId,
      permissions
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', { error: (error as Error).message });
      return res.status(401).json({ error: '无效的认证令牌' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('JWT token expired', { error: (error as Error).message });
      return res.status(401).json({ error: '认证令牌已过期' });
    }
    logger.error('Authentication failed', error as Error);
    return res.status(500).json({ error: '认证失败' });
  }
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const hasPermission = requiredPermissions.every(perm => 
      req.user!.permissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
}
