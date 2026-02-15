import { Router, Response } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/error';
import { cfRequest } from '../utils/api';

const router = Router();

// 获取KV命名空间列表
router.get('/namespaces', authenticate, requirePermission('kv:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.per_page as string) || 20;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces?page=${page}&per_page=${perPage}`);
  res.json(result);
}));

// 创建KV命名空间
router.post('/namespaces', authenticate, requirePermission('kv:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title } = req.body;

  if (!title) {
    throw createError('命名空间标题不能为空', 400);
  }

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces`, {
    method: 'POST',
    body: JSON.stringify({ title })
  });

  res.json(result);
}));

// 删除KV命名空间
router.delete('/namespaces/:namespaceId', authenticate, requirePermission('kv:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { namespaceId } = req.params;

  await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}`, {
    method: 'DELETE'
  });

  res.json({ message: '命名空间删除成功' });
}));

// 获取KV键列表
router.get('/namespaces/:namespaceId/keys', authenticate, requirePermission('kv:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { namespaceId } = req.params;
  const limit = parseInt(req.query.limit as string) || 1000;
  const cursor = req.query.cursor as string;

  let url = `/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/keys?limit=${limit}`;
  if (cursor) url += `&cursor=${cursor}`;

  const result = await cfRequest(url);
  res.json(result);
}));

// 获取KV键值
router.get('/namespaces/:namespaceId/values/:keyName', authenticate, requirePermission('kv:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { namespaceId, keyName } = req.params;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(keyName)}`);
  res.json(result);
}));

// 写入KV键值
router.put('/namespaces/:namespaceId/values/:keyName', authenticate, requirePermission('kv:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { namespaceId, keyName } = req.params;
  const { value, expiration, expiration_ttl } = req.body;

  const body: Record<string, any> = { value };
  if (expiration) body.expiration = expiration;
  if (expiration_ttl) body.expiration_ttl = expiration_ttl;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(keyName)}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });

  res.json(result);
}));

// 删除KV键值
router.delete('/namespaces/:namespaceId/values/:keyName', authenticate, requirePermission('kv:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { namespaceId, keyName } = req.params;

  await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(keyName)}`, {
    method: 'DELETE'
  });

  res.json({ message: '键值删除成功' });
}));

// 批量读取KV键值
router.get('/namespaces/:namespaceId/bulk', authenticate, requirePermission('kv:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { namespaceId } = req.params;
  const keys = req.query.keys as string;

  if (!keys) {
    throw createError('keys参数不能为空', 400);
  }

  const keyList = keys.split(',');
  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/bulk`, {
    method: 'POST',
    body: JSON.stringify({ keys: keyList })
  });

  res.json(result);
}));

// 批量写入KV键值
router.put('/namespaces/:namespaceId/bulk', authenticate, requirePermission('kv:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { namespaceId } = req.params;
  const { data } = req.body;

  if (!Array.isArray(data)) {
    throw createError('data必须是数组', 400);
  }

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/bulk`, {
    method: 'PUT',
    body: JSON.stringify({ data })
  });

  res.json(result);
}));

// 批量删除KV键值
router.delete('/namespaces/:namespaceId/bulk', authenticate, requirePermission('kv:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { namespaceId } = req.params;
  const { keys } = req.body;

  if (!Array.isArray(keys)) {
    throw createError('keys必须是数组', 400);
  }

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/bulk`, {
    method: 'DELETE',
    body: JSON.stringify({ keys })
  });

  res.json(result);
}));

export { router as kvRouter };
