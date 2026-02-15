import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { strongPasswordSchema } from '../utils/validation';
import { logger } from '../utils/logger';
import { cache, CacheKeys } from '../utils/cache';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '原密码不能为空'),
  newPassword: strongPasswordSchema,
});

// Login endpoint
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { username },
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

  if (!user) {
    logger.warn('Login failed: user not found', { username, ip: req.ip });
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (user.status !== 'ACTIVE') {
    logger.warn('Login failed: account disabled', { username, status: user.status });
    return res.status(401).json({ error: '账户已被禁用' });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    logger.warn('Login failed: invalid password', { username, ip: req.ip });
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  // Update last login time
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  const token = generateToken(user.id, user.username, user.roleId);
  const permissions = user.role.permissions.map(rp => rp.permission.code);

  // Cache user permissions
  cache.set(CacheKeys.userPermissions(user.id), permissions, 5 * 60 * 1000);

  logger.info('User logged in successfully', { 
    userId: user.id, 
    username: user.username,
    ip: req.ip,
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
      permissions,
    }
  });
}));

// 获取当前用户信息
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
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

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const permissions = user.role.permissions.map(rp => rp.permission.code);

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    role: {
      id: user.role.id,
      name: user.role.name,
    },
    permissions,
  });
}));

// Change password endpoint
router.post('/change-password', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id }
  });

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const isValidPassword = await bcrypt.compare(oldPassword, user.password);
  
  if (!isValidPassword) {
    logger.warn('Password change failed: invalid old password', {
      userId: req.user!.id,
    });
    return res.status(400).json({ error: '原密码错误' });
  }

  // Use higher cost factor for better security
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password: hashedPassword }
  });

  // Invalidate user cache after password change
  cache.invalidate(CacheKeys.userPermissions(req.user!.id));

  logger.info('Password changed successfully', {
    userId: req.user!.id,
  });

  res.json({ message: '密码修改成功' });
}));

// Logout endpoint
router.post('/logout', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  // Invalidate cached permissions on logout
  cache.invalidate(CacheKeys.userPermissions(req.user!.id));
  
  logger.info('User logged out', {
    userId: req.user!.id,
  });
  
  res.json({ message: '登出成功' });
}));

export { router as authRouter };
