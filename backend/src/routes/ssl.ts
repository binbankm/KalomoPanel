import { Router } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { cfRequest } from '../utils/api';

const router = Router();

// 获取SSL设置
router.get('/:zoneId/settings', authenticate, requirePermission('ssl:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;

  const [sslSetting, alwaysUseHttps, minTlsVersion, tls13, automaticHttpsRewrites, opportunisticEncryption,] = await Promise.all([
    cfRequest<any>(`/zones/${zoneId}/settings/ssl`),
    cfRequest<any>(`/zones/${zoneId}/settings/always_use_https`),
    cfRequest<any>(`/zones/${zoneId}/settings/min_tls_version`),
    cfRequest<any>(`/zones/${zoneId}/settings/tls_1_3`),
    cfRequest<any>(`/zones/${zoneId}/settings/automatic_https_rewrites`),
    cfRequest<any>(`/zones/${zoneId}/settings/opportunistic_encryption`),
  ]);

  res.json({
    ssl: sslSetting,
    alwaysUseHttps,
    minTlsVersion,
    tls13,
    automaticHttpsRewrites,
    opportunisticEncryption,
  });
}));

// 更新SSL设置
router.patch('/:zoneId/settings', authenticate, requirePermission('ssl:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;
  const { ssl, alwaysUseHttps, minTlsVersion, tls13, automaticHttpsRewrites } = req.body;

  const updates = [];

  if (ssl !== undefined) {
    updates.push(cfRequest(`/zones/${zoneId}/settings/ssl`, {
      method: 'PATCH',
      body: JSON.stringify({ value: ssl })
    }));
  }

  if (alwaysUseHttps !== undefined) {
    updates.push(cfRequest(`/zones/${zoneId}/settings/always_use_https`, {
      method: 'PATCH',
      body: JSON.stringify({ value: alwaysUseHttps })
    }));
  }

  if (minTlsVersion !== undefined) {
    updates.push(cfRequest(`/zones/${zoneId}/settings/min_tls_version`, {
      method: 'PATCH',
      body: JSON.stringify({ value: minTlsVersion })
    }));
  }

  if (tls13 !== undefined) {
    updates.push(cfRequest(`/zones/${zoneId}/settings/tls_1_3`, {
      method: 'PATCH',
      body: JSON.stringify({ value: tls13 })
    }));
  }

  if (automaticHttpsRewrites !== undefined) {
    updates.push(cfRequest(`/zones/${zoneId}/settings/automatic_https_rewrites`, {
      method: 'PATCH',
      body: JSON.stringify({ value: automaticHttpsRewrites })
    }));
  }

  const results = await Promise.all(updates);

  res.json(results);
}));

// 获取证书信息
router.get('/:zoneId/certificates', authenticate, requirePermission('ssl:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}/ssl/certificate_packs`);

  res.json(result);
}));

// 获取HSTS设置
router.get('/:zoneId/hsts', authenticate, requirePermission('ssl:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}/settings/security_header`);

  res.json(result);
}));

// 更新HSTS设置
router.patch('/:zoneId/hsts', authenticate, requirePermission('ssl:manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;
  const { strict_transport_security } = req.body;

  const result = await cfRequest<any>(`/zones/${zoneId}/settings/security_header`, {
    method: 'PATCH',
    body: JSON.stringify({
      value: { strict_transport_security }
    })
  });

  res.json(result);
}));

// 获取TLS客户端认证设置
router.get('/:zoneId/tls-client-auth', authenticate, requirePermission('ssl:view'), asyncHandler(async (req: AuthRequest, res) => {
  const { zoneId } = req.params;

  const result = await cfRequest<any>(`/zones/${zoneId}/settings/tls_client_auth`);

  res.json(result);
}));

export { router as sslRouter };
