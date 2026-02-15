import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/error';
import { cfRequest, buildQueryString } from '../utils/api';

const router = Router();

const dnsRecordSchema = z.object({
  type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR', 'SPF', 'LOC']),
  name: z.string().min(1),
  content: z.string().min(1),
  ttl: z.number().min(1).optional(),
  priority: z.number().optional(),
  proxied: z.boolean().optional(),
  comment: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// 获取DNS记录列表
router.get('/:zoneId/records', authenticate, requirePermission('dns:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.per_page as string) || 100;
  const type = req.query.type as string;
  const name = req.query.name as string;
  const content = req.query.content as string;

  const queryParams: Record<string, any> = {
    page,
    per_page: perPage,
  };

  if (type) queryParams.type = type;
  if (name) queryParams.name = name;
  if (content) queryParams.content = content;

  const result = await cfRequest<any>(
    `/zones/${zoneId}/dns_records${buildQueryString(queryParams)}`
  );

  res.json({
    data: result,
    pagination: {
      page,
      perPage,
      total: result.length,
    }
  });
}));

// 获取单个DNS记录
router.get('/:zoneId/records/:recordId', authenticate, requirePermission('dns:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId, recordId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}/dns_records/${recordId}`);

  res.json(result);
}));

// 创建DNS记录
router.post('/:zoneId/records', authenticate, requirePermission('dns:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;
  const data = dnsRecordSchema.parse(req.body);

  const result = await cfRequest<any>(`/zones/${zoneId}/dns_records`, {
    method: 'POST',
    body: JSON.stringify(data)
  });

  res.status(201).json(result);
}));

// 更新DNS记录
router.put('/:zoneId/records/:recordId', authenticate, requirePermission('dns:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId, recordId } = req.params;
  const data = dnsRecordSchema.partial().parse(req.body);

  const result = await cfRequest<any>(`/zones/${zoneId}/dns_records/${recordId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

  res.json(result);
}));

// 删除DNS记录
router.delete('/:zoneId/records/:recordId', authenticate, requirePermission('dns:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId, recordId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}/dns_records/${recordId}`, {
    method: 'DELETE'
  });

  res.json(result);
}));

// 批量创建DNS记录
router.post('/:zoneId/records/batch', authenticate, requirePermission('dns:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    throw createError('请提供DNS记录列表', 400);
  }

  const results = [];
  const errors = [];

  for (const record of records) {
    try {
      const validated = dnsRecordSchema.parse(record);
      const result = await cfRequest<any>(`/zones/${zoneId}/dns_records`, {
        method: 'POST',
        body: JSON.stringify(validated)
      });
      results.push(result);
    } catch (error: any) {
      errors.push({ record, error: error.message });
    }
  }

  res.json({
    success: results.length,
    failed: errors.length,
    results,
    errors
  });
}));

// 导出DNS记录
router.get('/:zoneId/export', authenticate, requirePermission('dns:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;

  const result = await cfRequest<string>(`/zones/${zoneId}/dns_records/export`);

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${zoneId}-dns.txt"`);
  res.send(result);
}));

// 导入DNS记录
router.post('/:zoneId/import', authenticate, requirePermission('dns:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;
  const { file } = req.body;

  if (!file) {
    throw createError('请提供DNS文件内容', 400);
  }

  const result = await cfRequest<any>(`/zones/${zoneId}/dns_records/import`, {
    method: 'POST',
    body: JSON.stringify({ file })
  });

  res.json(result);
}));

export { router as dnsRouter };
