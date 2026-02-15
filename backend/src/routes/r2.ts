import { Router, Response } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/error';
import { cfRequest } from '../utils/api';

const router = Router();

// 获取R2 Bucket列表
router.get('/buckets', authenticate, requirePermission('r2:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/r2/buckets`);
  res.json(result);
}));

// 创建R2 Bucket
router.post('/buckets', authenticate, requirePermission('r2:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, location } = req.body;

  if (!name) {
    throw createError('Bucket名称不能为空', 400);
  }

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/r2/buckets`, {
    method: 'POST',
    body: JSON.stringify({ name, location })
  });

  res.json(result);
}));

// 删除R2 Bucket
router.delete('/buckets/:bucketName', authenticate, requirePermission('r2:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bucketName } = req.params;

  await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/r2/buckets/${bucketName}`, {
    method: 'DELETE'
  });

  res.json({ message: 'Bucket删除成功' });
}));

// 获取Bucket详情
router.get('/buckets/:bucketName', authenticate, requirePermission('r2:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bucketName } = req.params;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/r2/buckets/${bucketName}`);
  res.json(result);
}));

// 获取对象列表
router.get('/buckets/:bucketName/objects', authenticate, requirePermission('r2:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bucketName } = req.params;
  const prefix = req.query.prefix as string || '';
  const delimiter = req.query.delimiter as string || '/';
  const limit = parseInt(req.query.limit as string) || 1000;
  const cursor = req.query.cursor as string;

  const params: Record<string, any> = { prefix, delimiter, limit };
  if (cursor) params.cursor = cursor;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/r2/buckets/${bucketName}/objects?${new URLSearchParams(params)}`);
  res.json(result);
}));

// 获取对象详情
router.get('/buckets/:bucketName/objects/:objectName', authenticate, requirePermission('r2:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bucketName, objectName } = req.params;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/r2/buckets/${bucketName}/objects/${encodeURIComponent(objectName)}`);
  res.json(result);
}));

// 删除对象
router.delete('/buckets/:bucketName/objects/:objectName', authenticate, requirePermission('r2:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bucketName, objectName } = req.params;

  await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/r2/buckets/${bucketName}/objects/${encodeURIComponent(objectName)}`, {
    method: 'DELETE'
  });

  res.json({ message: '对象删除成功' });
}));

// 获取上传URL
router.post('/buckets/:bucketName/objects/:objectName/upload-url', authenticate, requirePermission('r2:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bucketName, objectName } = req.params;
  const { expirySeconds } = req.body;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/r2/buckets/${bucketName}/objects/${encodeURIComponent(objectName)}/upload-url`, {
    method: 'POST',
    body: JSON.stringify({ expirySeconds: expirySeconds || 3600 })
  });

  res.json(result);
}));

export { router as r2Router };
