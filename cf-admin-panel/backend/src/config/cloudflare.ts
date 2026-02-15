import { prisma } from './database';

// 默认配置（从环境变量读取）
export const CF_CONFIG = {
  apiToken: process.env.CF_API_TOKEN || '',
  accountId: process.env.CF_ACCOUNT_ID || '',
  baseUrl: 'https://api.cloudflare.com/client/v4',
};

// 从数据库获取 Cloudflare 配置
export async function getCloudflareConfig() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['cf_auth_type', 'cf_api_token', 'cf_global_key', 'cf_email', 'cf_account_id']
      }
    }
  });

  const configMap = settings.reduce((acc: Record<string, string>, setting: { key: string; value: string }) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  return {
    authType: configMap.cf_auth_type || 'token',
    apiToken: configMap.cf_api_token || CF_CONFIG.apiToken,
    globalKey: configMap.cf_global_key || '',
    email: configMap.cf_email || '',
    accountId: configMap.cf_account_id || CF_CONFIG.accountId,
  };
}

// 获取请求头
export async function getCfHeaders(): Promise<Record<string, string>> {
  const config = await getCloudflareConfig();
  
  if (config.authType === 'global' && config.globalKey && config.email) {
    // 使用 Global API Key 认证
    return {
      'X-Auth-Key': config.globalKey,
      'X-Auth-Email': config.email,
      'Content-Type': 'application/json',
    };
  }
  
  // 默认使用 API Token 认证
  return {
    'Authorization': `Bearer ${config.apiToken || CF_CONFIG.apiToken}`,
    'Content-Type': 'application/json',
  };
}

// 向后兼容的静态 headers（不推荐在新代码中使用）
export const cfHeaders = {
  'Authorization': `Bearer ${CF_CONFIG.apiToken}`,
  'Content-Type': 'application/json',
};
