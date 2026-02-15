import { Router } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { prisma } from '../config/database';

const router = Router();

// 获取操作日志列表
router.get('/', authenticate, requirePermission('logs:view'), asyncHandler(async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const userId = req.query.userId as string;
  const action = req.query.action as string;
  const module = req.query.module as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const where: any = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (module) where.module = module;
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.operationLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.operationLog.count({ where })
  ]);

  // 解析details JSON
  const parsedLogs = logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null,
  }));

  res.json({
    data: parsedLogs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}));

// 获取当前用户的操作日志
router.get('/my', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const [logs, total] = await Promise.all([
    prisma.operationLog.findMany({
      where: { userId: req.user!.id },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.operationLog.count({ where: { userId: req.user!.id } })
  ]);

  const parsedLogs = logs.map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null,
  }));

  res.json({
    data: parsedLogs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}));

// 获取操作类型统计
router.get('/stats/actions', authenticate, requirePermission('logs:view'), asyncHandler(async (req: AuthRequest, res) => {
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const stats = await prisma.operationLog.groupBy({
    by: ['action'],
    where,
    _count: {
      action: true
    }
  });

  res.json(stats.map(s => ({
    action: s.action,
    count: s._count.action
  })));
}));

// 获取模块统计
router.get('/stats/modules', authenticate, requirePermission('logs:view'), asyncHandler(async (req: AuthRequest, res) => {
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const stats = await prisma.operationLog.groupBy({
    by: ['module'],
    where,
    _count: {
      module: true
    }
  });

  res.json(stats.map(s => ({
    module: s.module,
    count: s._count.module
  })));
}));

export { router as logsRouter };
