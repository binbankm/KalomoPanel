import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/error';
import { cfRequest, buildQueryString } from '../utils/api';

const router = Router();

const firewallRuleSchema = z.object({
  filter: z.object({
    expression: z.string(),
    paused: z.boolean().optional(),
    description: z.string().optional(),
    ref: z.string().optional(),
  }),
  action: z.enum(['block', 'challenge', 'allow', 'js_challenge', 'managed_challenge', 'log', 'bypass']),
  priority: z.number().optional(),
  paused: z.boolean().optional(),
  description: z.string().optional(),
  products: z.array(z.string()).optional(),
});

// 获取防火墙规则列表
router.get('/:zoneId/rules', authenticate, requirePermission('firewall:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}/firewall/rules`);

  res.json(result);
}));

// 创建防火墙规则
router.post('/:zoneId/rules', authenticate, requirePermission('firewall:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;
  const data = firewallRuleSchema.parse(req.body);

  const result = await cfRequest<any>(`/zones/${zoneId}/firewall/rules`, {
    method: 'POST',
    body: JSON.stringify(data)
  });

  res.status(201).json(result);
}));

// 更新防火墙规则
router.put('/:zoneId/rules/:ruleId', authenticate, requirePermission('firewall:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId, ruleId } = req.params;
  const data = firewallRuleSchema.partial().parse(req.body);

  const result = await cfRequest<any>(`/zones/${zoneId}/firewall/rules/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

  res.json(result);
}));

// 删除防火墙规则
router.delete('/:zoneId/rules/:ruleId', authenticate, requirePermission('firewall:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId, ruleId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}/firewall/rules/${ruleId}`, {
    method: 'DELETE'
  });

  res.json(result);
}));

// 获取IP访问规则
router.get('/:zoneId/access-rules', authenticate, requirePermission('firewall:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;
  const mode = req.query.mode as string;
  const notes = req.query.notes as string;
  const ipAddress = req.query.ip_address as string;

  const queryParams: Record<string, any> = {};
  if (mode) queryParams.mode = mode;
  if (notes) queryParams.notes = notes;
  if (ipAddress) queryParams.ip_address = ipAddress;

  const result = await cfRequest<any>(
    `/zones/${zoneId}/firewall/access_rules/rules${buildQueryString(queryParams)}`
  );

  res.json(result);
}));

// 创建IP访问规则
router.post('/:zoneId/access-rules', authenticate, requirePermission('firewall:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;
  const { mode, configuration, notes } = req.body;

  const result = await cfRequest<any>(`/zones/${zoneId}/firewall/access_rules/rules`, {
    method: 'POST',
    body: JSON.stringify({ mode, configuration, notes })
  });

  res.status(201).json(result);
}));

// 更新IP访问规则
router.patch('/:zoneId/access-rules/:ruleId', authenticate, requirePermission('firewall:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId, ruleId } = req.params;
  const { mode, notes } = req.body;

  const result = await cfRequest<any>(`/zones/${zoneId}/firewall/access_rules/rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify({ mode, notes })
  });

  res.json(result);
}));

// 删除IP访问规则
router.delete('/:zoneId/access-rules/:ruleId', authenticate, requirePermission('firewall:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId, ruleId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}/firewall/access_rules/rules/${ruleId}`, {
    method: 'DELETE'
  });

  res.json(result);
}));

// 获取WAF规则包
router.get('/:zoneId/waf/packages', authenticate, requirePermission('firewall:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}/firewall/waf/packages`);

  res.json(result);
}));

// 获取WAF规则包详情
router.get('/:zoneId/waf/packages/:packageId', authenticate, requirePermission('firewall:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId, packageId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}/firewall/waf/packages/${packageId}`);

  res.json(result);
}));

// 获取WAF规则
router.get('/:zoneId/waf/packages/:packageId/rules', authenticate, requirePermission('firewall:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId, packageId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}/firewall/waf/packages/${packageId}/rules`);

  res.json(result);
}));

// 更新WAF规则
router.patch('/:zoneId/waf/packages/:packageId/rules/:ruleId', authenticate, requirePermission('firewall:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId, packageId, ruleId } = req.params;
  const { mode } = req.body;

  const result = await cfRequest<any>(`/zones/${zoneId}/firewall/waf/packages/${packageId}/rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify({ mode })
  });

  res.json(result);
}));

// 获取安全事件
router.get('/:zoneId/events', authenticate, requirePermission('firewall:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;
  const { 
    start, 
    end, 
    per_page = 50,
    page = 1,
    action,
    host,
    ip
  } = req.query;

  const queryParams: Record<string, any> = {
    per_page,
    page,
  };

  if (start) queryParams.start = start;
  if (end) queryParams.end = end;
  if (action) queryParams.action = action;
  if (host) queryParams.host = host;
  if (ip) queryParams.ip = ip;

  const result = await cfRequest<any>(
    `/zones/${zoneId}/security/events${buildQueryString(queryParams)}`
  );

  res.json(result);
}));

export { router as firewallRouter };
