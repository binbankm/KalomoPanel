import { Router, Response } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { cfRequest } from '../utils/api';

const router = Router();

// 获取Zone分析数据
router.get('/zones/:zoneId', authenticate, requirePermission('analytics:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { zoneId } = req.params;
  const since = req.query.since as string;
  const until = req.query.until as string;
  const continuous = req.query.continuous === 'true';

  let url = `/zones/${zoneId}/analytics/dashboard`;
  const params = new URLSearchParams();
  if (since) params.append('since', since);
  if (until) params.append('until', until);
  if (continuous) params.append('continuous', 'true');
  if (params.toString()) url += `?${params.toString()}`;

  const result = await cfRequest(url);
  res.json(result);
}));

// 获取HTTP请求分析
router.get('/zones/:zoneId/http-requests', authenticate, requirePermission('analytics:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { zoneId } = req.params;
  const since = req.query.since as string;
  const until = req.query.until as string;

  let url = `/zones/${zoneId}/analytics/latency`;
  const params = new URLSearchParams();
  if (since) params.append('since', since);
  if (until) params.append('until', until);
  if (params.toString()) url += `?${params.toString()}`;

  const result = await cfRequest(url);
  res.json(result);
}));

// 获取缓存分析
router.get('/zones/:zoneId/cache', authenticate, requirePermission('analytics:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { zoneId } = req.params;
  const since = req.query.since as string;
  const until = req.query.until as string;

  let url = `/zones/${zoneId}/analytics/dashboard`;
  const params = new URLSearchParams();
  if (since) params.append('since', since);
  if (until) params.append('until', until);
  if (params.toString()) url += `?${params.toString()}`;

  const result = await cfRequest(url);
  res.json(result);
}));

// 获取安全分析
router.get('/zones/:zoneId/security', authenticate, requirePermission('analytics:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { zoneId } = req.params;
  const since = req.query.since as string;
  const until = req.query.until as string;

  let url = `/zones/${zoneId}/security/events`;
  const params = new URLSearchParams();
  if (since) params.append('since', since);
  if (until) params.append('until', until);
  if (params.toString()) url += `?${params.toString()}`;

  const result = await cfRequest(url);
  res.json(result);
}));

// 获取威胁分析
router.get('/zones/:zoneId/threats', authenticate, requirePermission('analytics:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { zoneId } = req.params;
  const since = req.query.since as string;
  const until = req.query.until as string;

  let url = `/zones/${zoneId}/security/threats`;
  const params = new URLSearchParams();
  if (since) params.append('since', since);
  if (until) params.append('until', until);
  if (params.toString()) url += `?${params.toString()}`;

  const result = await cfRequest(url);
  res.json(result);
}));

// 获取Bot管理分析
router.get('/zones/:zoneId/bots', authenticate, requirePermission('analytics:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { zoneId } = req.params;
  const since = req.query.since as string;
  const until = req.query.until as string;

  let url = `/zones/${zoneId}/security/bots`;
  const params = new URLSearchParams();
  if (since) params.append('since', since);
  if (until) params.append('until', until);
  if (params.toString()) url += `?${params.toString()}`;

  const result = await cfRequest(url);
  res.json(result);
}));

// 获取Colo分析
router.get('/zones/:zoneId/colos', authenticate, requirePermission('analytics:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { zoneId } = req.params;

  const result = await cfRequest(`/zones/${zoneId}/analytics/colos`);
  res.json(result);
}));

// 获取Account级别分析
router.get('/account', authenticate, requirePermission('analytics:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const since = req.query.since as string;
  const until = req.query.until as string;

  let url = `/accounts/${process.env.CF_ACCOUNT_ID}/analytics`;
  const params = new URLSearchParams();
  if (since) params.append('since', since);
  if (until) params.append('until', until);
  if (params.toString()) url += `?${params.toString()}`;

  const result = await cfRequest(url);
  res.json(result);
}));

export { router as analyticsRouter };
