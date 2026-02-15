import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/error';

const router = Router();

const createRoleSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

const updateRoleSchema = z.object({
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

// 获取角色列表
router.get('/', authenticate, requirePermission('role:view'), asyncHandler(async (req: AuthRequest, res) => {
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: { permission: true }
      },
      _count: {
        select: { users: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(roles.map(role => ({
    ...role,
    permissions: role.permissions.map(rp => rp.permission),
    userCount: role._count.users,
    _count: undefined
  })));
}));

// 获取所有权限（用于角色配置）
router.get('/permissions', authenticate, requirePermission('role:view'), asyncHandler(async (req: AuthRequest, res) => {
  const permissions = await prisma.permission.findMany({
    orderBy: [
      { module: 'asc' },
      { name: 'asc' }
    ]
  });

  // 按模块分组
  const grouped = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  res.json(grouped);
}));

// 获取单个角色
router.get('/:id', authenticate, requirePermission('role:view'), asyncHandler(async (req: AuthRequest, res) => {
  const role = await prisma.role.findUnique({
    where: { id: req.params.id },
    include: {
      permissions: {
        include: { permission: true }
      },
      _count: {
        select: { users: true }
      }
    }
  });

  if (!role) {
    throw createError('角色不存在', 404);
  }

  res.json({
    ...role,
    permissions: role.permissions.map(rp => rp.permission),
    userCount: role._count.users,
    _count: undefined
  });
}));

// 创建角色
router.post('/', authenticate, requirePermission('role:create'), asyncHandler(async (req: AuthRequest, res) => {
  const data = createRoleSchema.parse(req.body);

  // 检查角色名是否已存在
  const existingRole = await prisma.role.findUnique({
    where: { name: data.name }
  });

  if (existingRole) {
    throw createError('角色名称已存在', 400);
  }

  const role = await prisma.role.create({
    data: {
      name: data.name,
      description: data.description,
      permissions: data.permissionIds ? {
        create: data.permissionIds.map(permissionId => ({
          permission: { connect: { id: permissionId } }
        }))
      } : undefined
    },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });

  res.status(201).json({
    ...role,
    permissions: role.permissions.map(rp => rp.permission)
  });
}));

// 更新角色
router.put('/:id', authenticate, requirePermission('role:update'), asyncHandler(async (req: AuthRequest, res) => {
  const data = updateRoleSchema.parse(req.body);

  // 先删除旧权限
  if (data.permissionIds !== undefined) {
    await prisma.rolePermission.deleteMany({
      where: { roleId: req.params.id }
    });
  }

  const role = await prisma.role.update({
    where: { id: req.params.id },
    data: {
      description: data.description,
      permissions: data.permissionIds ? {
        create: data.permissionIds.map(permissionId => ({
          permission: { connect: { id: permissionId } }
        }))
      } : undefined
    },
    include: {
      permissions: {
        include: { permission: true }
      }
    }
  });

  res.json({
    ...role,
    permissions: role.permissions.map(rp => rp.permission)
  });
}));

// 删除角色
router.delete('/:id', authenticate, requirePermission('role:delete'), asyncHandler(async (req: AuthRequest, res) => {
  // 检查是否有用户使用该角色
  const roleWithUsers = await prisma.role.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { users: true } } }
  });

  if (!roleWithUsers) {
    throw createError('角色不存在', 404);
  }

  if (roleWithUsers._count.users > 0) {
    throw createError('该角色下还有用户，无法删除', 400);
  }

  await prisma.role.delete({
    where: { id: req.params.id }
  });

  res.json({ message: '角色删除成功' });
}));

export { router as roleRouter };
