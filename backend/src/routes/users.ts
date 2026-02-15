import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/error';
import { strongPasswordSchema, paginationSchema, uuidSchema } from '../utils/validation';
import { sanitizeUserData, sanitizeUsersData } from '../utils/response';
import { cache, CacheKeys } from '../utils/cache';
import { logger } from '../utils/logger';

const router = Router();

const createUserSchema = z.object({
  username: z.string().min(3, '用户名至少3位').max(50),
  email: z.string().email('邮箱格式不正确'),
  password: strongPasswordSchema,
  name: z.string().optional(),
  roleId: uuidSchema,
});

const updateUserSchema = z.object({
  email: z.string().email('邮箱格式不正确').optional(),
  name: z.string().optional(),
  roleId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

// Get user list
router.get('/', authenticate, requirePermission('user:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { page, pageSize } = paginationSchema.parse({
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 10,
  });
  const search = req.query.search as string;

  const where = search ? {
    OR: [
      { username: { contains: search } },
      { email: { contains: search } },
      { name: { contains: search } },
    ]
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        role: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    data: sanitizeUsersData(users),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}));

// Get single user
router.get('/:id', authenticate, requirePermission('user:view'), asyncHandler(async (req: AuthRequest, res) => {
  uuidSchema.parse(req.params.id);
  
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      role: {
        select: { id: true, name: true }
      }
    }
  });

  if (!user) {
    throw createError('用户不存在', 404);
  }

  res.json(sanitizeUserData(user));
}));

// Create user
router.post('/', authenticate, requirePermission('user:create'), asyncHandler(async (req: AuthRequest, res) => {
  const data = createUserSchema.parse(req.body);

  // Check if username or email already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: data.username },
        { email: data.email }
      ]
    }
  });

  if (existingUser) {
    throw createError('用户名或邮箱已存在', 400);
  }

  // Use higher cost factor for password hashing
  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword
    },
    include: {
      role: {
        select: { id: true, name: true }
      }
    }
  });

  logger.info('User created', {
    userId: user.id,
    username: user.username,
    createdBy: req.user!.id,
  });

  res.status(201).json(sanitizeUserData(user));
}));

// Update user
router.put('/:id', authenticate, requirePermission('user:update'), asyncHandler(async (req: AuthRequest, res) => {
  uuidSchema.parse(req.params.id);
  const data = updateUserSchema.parse(req.body);

  // Cannot modify own role
  if (req.params.id === req.user!.id && data.roleId) {
    throw createError('不能修改自己的角色', 400);
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    include: {
      role: {
        select: { id: true, name: true }
      }
    }
  });

  // Invalidate user cache after update
  cache.invalidate(CacheKeys.userPermissions(req.params.id));

  logger.info('User updated', {
    userId: user.id,
    updatedBy: req.user!.id,
  });

  res.json(sanitizeUserData(user));
}));

// Delete user
router.delete('/:id', authenticate, requirePermission('user:delete'), asyncHandler(async (req: AuthRequest, res) => {
  uuidSchema.parse(req.params.id);
  
  // Cannot delete self
  if (req.params.id === req.user!.id) {
    throw createError('不能删除自己', 400);
  }

  await prisma.user.delete({
    where: { id: req.params.id }
  });

  // Invalidate user cache after deletion
  cache.invalidate(CacheKeys.userPermissions(req.params.id));

  logger.info('User deleted', {
    userId: req.params.id,
    deletedBy: req.user!.id,
  });

  res.json({ message: '用户删除成功' });
}));

// Reset password
router.post('/:id/reset-password', authenticate, requirePermission('user:update'), asyncHandler(async (req: AuthRequest, res) => {
  uuidSchema.parse(req.params.id);
  
  // Generate cryptographically secure random password that includes all character categories
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const digitChars = '0123456789';
  const specialChars = '!@#$%^&*';
  const allChars = upperChars + lowerChars + digitChars + specialChars;
  const passwordLength = 12;

  // Ensure at least one character from each category
  const passwordArray: string[] = [
    upperChars.charAt(crypto.randomInt(0, upperChars.length)),
    lowerChars.charAt(crypto.randomInt(0, lowerChars.length)),
    digitChars.charAt(crypto.randomInt(0, digitChars.length)),
    specialChars.charAt(crypto.randomInt(0, specialChars.length)),
  ];

  // Fill the remaining characters with random choices from the full set
  while (passwordArray.length < passwordLength) {
    passwordArray.push(allChars.charAt(crypto.randomInt(0, allChars.length)));
  }

  // Shuffle the password characters using a cryptographically strong shuffle
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const temp = passwordArray[i];
    passwordArray[i] = passwordArray[j];
    passwordArray[j] = temp;
  }
  const newPassword = passwordArray.join('');
  
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: req.params.id },
    data: { password: hashedPassword }
  });

  // Invalidate user cache after password reset
  cache.invalidate(CacheKeys.userPermissions(req.params.id));

  logger.info('Password reset', {
    userId: req.params.id,
    resetBy: req.user!.id,
  });

  res.json({ 
    message: '密码重置成功',
    newPassword // In production, send via email instead
  });
}));

export { router as userRouter };
