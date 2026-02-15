import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '原密码不能为空'),
  newPassword: z.string().min(6, '新密码至少6位'),
});

// 登录
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
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(401).json({ error: '账户已被禁用' });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  // 更新最后登录时间
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  const token = generateToken(user.id, user.username, user.roleId);
  const permissions = user.role.permissions.map(rp => rp.permission.code);

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

// 修改密码
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
    return res.status(400).json({ error: '原密码错误' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password: hashedPassword }
  });

  res.json({ message: '密码修改成功' });
}));

// 登出（前端清除token即可，这里可用于记录日志）
router.post('/logout', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  res.json({ message: '登出成功' });
}));

export { router as authRouter };
