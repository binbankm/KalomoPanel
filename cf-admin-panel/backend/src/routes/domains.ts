import { Router } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { cfRequest, buildQueryString } from '../utils/api';

const router = Router();

// 获取域名列表
router.get('/', authenticate, requirePermission('domain:view'), asyncHandler(async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.per_page as string) || 20;
  const search = req.query.search as string;

  const queryParams: Record<string, any> = {
    page,
    per_page: perPage,
  };

  if (search) {
    queryParams.name = search;
  }

  const result = await cfRequest<any>(
    `/zones${buildQueryString(queryParams)}`
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

// 获取单个域名详情
router.get('/:zoneId', authenticate, requirePermission('domain:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}`);

  res.json(result);
}));

// 获取域名设置
router.get('/:zoneId/settings', authenticate, requirePermission('domain:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}/settings`);

  res.json(result);
}));

// 更新域名设置
router.patch('/:zoneId/settings', authenticate, requirePermission('domain:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;
  const settings = req.body;

  const result = await cfRequest<any>(`/zones/${zoneId}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(settings)
  });

  res.json(result);
}));

// 获取域名状态
router.get('/:zoneId/status', authenticate, requirePermission('domain:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}/activation_check`);

  res.json(result);
}));

// 清除缓存
router.post('/:zoneId/purge', authenticate, requirePermission('domain:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;
  const { files, tags, hosts, prefixes, purge_everything } = req.body;

  const body: any = {};
  
  if (purge_everything) {
    body.purge_everything = true;
  } else {
    if (files) body.files = files;
    if (tags) body.tags = tags;
    if (hosts) body.hosts = hosts;
    if (prefixes) body.prefixes = prefixes;
  }

  const result = await cfRequest<any>(`/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    body: JSON.stringify(body)
  });

  res.json(result);
}));

// 获取域名分析
router.get('/:zoneId/analytics', authenticate, requirePermission('analytics:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;
  const since = req.query.since as string;
  const until = req.query.until as string;
  const continuous = req.query.continuous === 'true';

  const queryParams: Record<string, any> = {};
  if (since) queryParams.since = since;
  if (until) queryParams.until = until;
  if (continuous) queryParams.continuous = continuous;

  const result = await cfRequest<any>(
    `/zones/${zoneId}/analytics/dashboard${buildQueryString(queryParams)}`
  );

  res.json(result);
}));

export { router as domainRouter };
