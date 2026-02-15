import { Router, Response } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/error';
import { cfRequest } from '../utils/api';

const router = Router();

// 获取Workers脚本列表
router.get('/scripts', authenticate, requirePermission('workers:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/workers/scripts`);
  res.json(result);
}));

// 获取Workers脚本详情
router.get('/scripts/:scriptName', authenticate, requirePermission('workers:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { scriptName } = req.params;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/workers/scripts/${scriptName}`);
  res.json(result);
}));

// 创建/更新Workers脚本
router.put('/scripts/:scriptName', authenticate, requirePermission('workers:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { scriptName } = req.params;
  const { script, bindings } = req.body;

  if (!script) {
    throw createError('脚本内容不能为空', 400);
  }

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/workers/scripts/${scriptName}`, {
    method: 'PUT',
    body: JSON.stringify({ script, bindings })
  });

  res.json(result);
}));

// 删除Workers脚本
router.delete('/scripts/:scriptName', authenticate, requirePermission('workers:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { scriptName } = req.params;

  await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/workers/scripts/${scriptName}`, {
    method: 'DELETE'
  });

  res.json({ message: '脚本删除成功' });
}));

// 获取Workers路由列表
router.get('/routes', authenticate, requirePermission('workers:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await cfRequest(`/zones/${req.query.zone_id}/workers/routes`);
  res.json(result);
}));

// 创建Workers路由
router.post('/routes', authenticate, requirePermission('workers:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { zone_id, pattern, script } = req.body;

  if (!zone_id || !pattern) {
    throw createError('Zone ID和Pattern不能为空', 400);
  }

  const result = await cfRequest(`/zones/${zone_id}/workers/routes`, {
    method: 'POST',
    body: JSON.stringify({ pattern, script })
  });

  res.json(result);
}));

// 更新Workers路由
router.put('/routes/:routeId', authenticate, requirePermission('workers:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { routeId } = req.params;
  const { zone_id, pattern, script } = req.body;

  if (!zone_id) {
    throw createError('Zone ID不能为空', 400);
  }

  const result = await cfRequest(`/zones/${zone_id}/workers/routes/${routeId}`, {
    method: 'PUT',
    body: JSON.stringify({ pattern, script })
  });

  res.json(result);
}));

// 删除Workers路由
router.delete('/routes/:routeId', authenticate, requirePermission('workers:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { routeId } = req.params;
  const { zone_id } = req.query;

  if (!zone_id) {
    throw createError('Zone ID不能为空', 400);
  }

  await cfRequest(`/zones/${zone_id}/workers/routes/${routeId}`, {
    method: 'DELETE'
  });

  res.json({ message: '路由删除成功' });
}));

// 获取Workers触发器
router.get('/scripts/:scriptName/schedules', authenticate, requirePermission('workers:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { scriptName } = req.params;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/workers/scripts/${scriptName}/schedules`);
  res.json(result);
}));

// 更新Workers触发器
router.put('/scripts/:scriptName/schedules', authenticate, requirePermission('workers:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { scriptName } = req.params;
  const { schedules } = req.body;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/workers/scripts/${scriptName}/schedules`, {
    method: 'PUT',
    body: JSON.stringify({ schedules })
  });

  res.json(result);
}));

export { router as workersRouter };
