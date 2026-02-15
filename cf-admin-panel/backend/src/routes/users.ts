import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/error';

const router = Router();

const createUserSchema = z.object({
  username: z.string().min(3, '用户名至少3位').max(50),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
  name: z.string().optional(),
  roleId: z.string().uuid('请选择角色'),
});

const updateUserSchema = z.object({
  email: z.string().email('邮箱格式不正确').optional(),
  name: z.string().optional(),
  roleId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

// 获取用户列表
router.get('/', authenticate, requirePermission('user:view'), asyncHandler(async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
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
    data: users.map(user => ({
      ...user,
      password: undefined
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}));

// 获取单个用户
router.get('/:id', authenticate, requirePermission('user:view'), asyncHandler(async (req: AuthRequest, res) => {
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

  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
}));

// 创建用户
router.post('/', authenticate, requirePermission('user:create'), asyncHandler(async (req: AuthRequest, res) => {
  const data = createUserSchema.parse(req.body);

  // 检查用户名是否已存在
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

  const hashedPassword = await bcrypt.hash(data.password, 10);

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

  const { password, ...userWithoutPassword } = user;
  res.status(201).json(userWithoutPassword);
}));

// 更新用户
router.put('/:id', authenticate, requirePermission('user:update'), asyncHandler(async (req: AuthRequest, res) => {
  const data = updateUserSchema.parse(req.body);

  // 不能修改自己
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

  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
}));

// 删除用户
router.delete('/:id', authenticate, requirePermission('user:delete'), asyncHandler(async (req: AuthRequest, res) => {
  // 不能删除自己
  if (req.params.id === req.user!.id) {
    throw createError('不能删除自己', 400);
  }

  await prisma.user.delete({
    where: { id: req.params.id }
  });

  res.json({ message: '用户删除成功' });
}));

// 重置密码
router.post('/:id/reset-password', authenticate, requirePermission('user:update'), asyncHandler(async (req: AuthRequest, res) => {
  const newPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: req.params.id },
    data: { password: hashedPassword }
  });

  res.json({ 
    message: '密码重置成功',
    newPassword // 实际生产环境应该通过邮件发送
  });
}));

export { router as userRouter };
