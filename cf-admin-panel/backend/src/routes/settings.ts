import { Router, Response } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/error';
import { prisma } from '../config/database';

const router = Router();

// 获取所有设置
router.get('/', authenticate, requirePermission('settings:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await prisma.setting.findMany();
  
  const settingsMap = settings.reduce((acc: Record<string, any>, setting: { key: string; value: string }) => {
    try {
      acc[setting.key] = JSON.parse(setting.value);
    } catch {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {});

  res.json({
    success: true,
    data: settingsMap
  });
}));

// 获取单个设置
router.get('/:key', authenticate, requirePermission('settings:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key } = req.params;

  const setting = await prisma.setting.findUnique({
    where: { key }
  });

  if (!setting) {
    throw createError('设置不存在', 404);
  }

  let value: any;
  try {
    value = JSON.parse(setting.value);
  } catch {
    value = setting.value;
  }

  res.json({
    success: true,
    data: { key: setting.key, value, description: setting.description }
  });
}));

// 创建设置
router.post('/', authenticate, requirePermission('settings:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key, value, description } = req.body;

  if (!key) {
    throw createError('设置键名不能为空', 400);
  }

  const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

  const setting = await prisma.setting.create({
    data: {
      key,
      value: valueStr,
      description
    }
  });

  res.json({
    success: true,
    message: '设置创建成功',
    data: setting
  });
}));

// 更新设置
router.put('/:key', authenticate, requirePermission('settings:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const { value, description } = req.body;

  const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

  const setting = await prisma.setting.upsert({
    where: { key },
    update: {
      value: valueStr,
      ...(description && { description })
    },
    create: {
      key,
      value: valueStr,
      description
    }
  });

  res.json({
    success: true,
    message: '设置更新成功',
    data: setting
  });
}));

// 批量更新设置
router.put('/', authenticate, requirePermission('settings:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { settings } = req.body;

  if (!Array.isArray(settings)) {
    throw createError('settings必须是数组', 400);
  }

  const results = await Promise.all(
    settings.map(async ({ key, value, description }: { key: string; value: any; description?: string }) => {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      return prisma.setting.upsert({
        where: { key },
        update: {
          value: valueStr,
          ...(description && { description })
        },
        create: {
          key,
          value: valueStr,
          description
        }
      });
    })
  );

  res.json({
    success: true,
    message: '设置批量更新成功',
    data: results
  });
}));

// 删除设置
router.delete('/:key', authenticate, requirePermission('settings:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { key } = req.params;

  await prisma.setting.delete({
    where: { key }
  });

  res.json({
    success: true,
    message: '设置删除成功'
  });
}));

// 获取系统信息
router.get('/system/info', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const info = {
    version: '1.0.0',
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };

  res.json({
    success: true,
    data: info
  });
}));

export { router as settingsRouter };
