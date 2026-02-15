import { CF_CONFIG, getCfHeaders, getCloudflareConfig } from '../config/cloudflare';

interface CfRequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

export async function cfRequest<T>(endpoint: string, options: CfRequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  
  let url = `${CF_CONFIG.baseUrl}${endpoint}`;
  
  if (params) {
    const queryString = buildQueryString(params);
    if (queryString) {
      url += queryString;
    }
  }
  
  // 获取动态 headers（支持 API Token 和 Global API Key）
  const cfHeaders = await getCfHeaders();
  
  // 合并 headers
  const mergedHeaders: Record<string, string> = {
    ...cfHeaders,
    ...fetchOptions.headers,
  };
  
  const response = await fetch(url, {
    ...fetchOptions,
    headers: mergedHeaders,
  });

  const data: any = await response.json();

  if (!data.success) {
    const error = data.errors?.[0] || { message: 'Unknown error' };
    throw new Error(error.message);
  }

  return data.result as T;
}

// 获取 Account ID（从数据库或环境变量）
export async function getAccountId(): Promise<string> {
  const config = await getCloudflareConfig();
  return config.accountId;
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  
  return query ? `?${query}` : '';
}
