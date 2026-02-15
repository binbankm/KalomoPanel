import { Router, Response } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/error';
import { cfRequest } from '../utils/api';

const router = Router();

// 获取Pages项目列表
router.get('/projects', authenticate, requirePermission('pages:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.per_page as string) || 20;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/pages/projects?page=${page}&per_page=${perPage}`);
  res.json(result);
}));

// 获取Pages项目详情
router.get('/projects/:projectName', authenticate, requirePermission('pages:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectName } = req.params;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/pages/projects/${projectName}`);
  res.json(result);
}));

// 创建Pages项目
router.post('/projects', authenticate, requirePermission('pages:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, production_branch } = req.body;

  if (!name) {
    throw createError('项目名称不能为空', 400);
  }

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/pages/projects`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      production_branch: production_branch || 'main'
    })
  });

  res.json(result);
}));

// 删除Pages项目
router.delete('/projects/:projectName', authenticate, requirePermission('pages:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectName } = req.params;

  await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/pages/projects/${projectName}`, {
    method: 'DELETE'
  });

  res.json({ message: '项目删除成功' });
}));

// 获取部署列表
router.get('/projects/:projectName/deployments', authenticate, requirePermission('pages:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectName } = req.params;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/pages/projects/${projectName}/deployments`);
  res.json(result);
}));

// 获取部署详情
router.get('/projects/:projectName/deployments/:deploymentId', authenticate, requirePermission('pages:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectName, deploymentId } = req.params;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/pages/projects/${projectName}/deployments/${deploymentId}`);
  res.json(result);
}));

// 创建部署
router.post('/projects/:projectName/deployments', authenticate, requirePermission('pages:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectName } = req.params;
  const { branch, commit_message } = req.body;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/pages/projects/${projectName}/deployments`, {
    method: 'POST',
    body: JSON.stringify({ branch, commit_message })
  });

  res.json(result);
}));

// 删除部署
router.delete('/projects/:projectName/deployments/:deploymentId', authenticate, requirePermission('pages:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectName, deploymentId } = req.params;

  await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/pages/projects/${projectName}/deployments/${deploymentId}`, {
    method: 'DELETE'
  });

  res.json({ message: '部署删除成功' });
}));

// 获取自定义域名列表
router.get('/projects/:projectName/domains', authenticate, requirePermission('pages:view'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectName } = req.params;

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/pages/projects/${projectName}/domains`);
  res.json(result);
}));

// 添加自定义域名
router.post('/projects/:projectName/domains', authenticate, requirePermission('pages:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectName } = req.params;
  const { domain } = req.body;

  if (!domain) {
    throw createError('域名不能为空', 400);
  }

  const result = await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/pages/projects/${projectName}/domains`, {
    method: 'POST',
    body: JSON.stringify({ domain })
  });

  res.json(result);
}));

// 删除自定义域名
router.delete('/projects/:projectName/domains/:domain', authenticate, requirePermission('pages:manage'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { projectName, domain } = req.params;

  await cfRequest(`/accounts/${process.env.CF_ACCOUNT_ID}/pages/projects/${projectName}/domains/${domain}`, {
    method: 'DELETE'
  });

  res.json({ message: '域名删除成功' });
}));

export { router as pagesRouter };
