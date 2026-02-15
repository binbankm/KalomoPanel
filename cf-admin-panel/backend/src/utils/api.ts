import { CF_CONFIG, getCfHeaders, getCloudflareConfig } from '../config/cloudflare';
import { logger } from './logger';
import { cache, CacheKeys } from './cache';

interface CfRequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  skipCache?: boolean;
}

export async function cfRequest<T>(endpoint: string, options: CfRequestOptions = {}): Promise<T> {
  const { params, skipCache = false, ...fetchOptions } = options;
  
  let url = `${CF_CONFIG.baseUrl}${endpoint}`;
  
  if (params) {
    const queryString = buildQueryString(params);
    if (queryString) {
      url += queryString;
    }
  }

  // Check cache for GET requests
  if (fetchOptions.method !== 'POST' && fetchOptions.method !== 'PUT' && 
      fetchOptions.method !== 'DELETE' && !skipCache) {
    const cached = cache.get<T>(url);
    if (cached) {
      logger.debug('Cache hit for Cloudflare API request', { url });
      return cached;
    }
  }
  
  // Get dynamic headers (supports API Token and Global API Key)
  const cfHeaders = await getCfHeaders();
  
  // Merge headers
  const mergedHeaders: Record<string, string> = {
    ...cfHeaders,
    ...fetchOptions.headers,
  };
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: mergedHeaders,
    });

    const data: any = await response.json();

    if (!data.success) {
      const error = data.errors?.[0] || { message: 'Unknown error' };
      logger.error('Cloudflare API error', new Error(error.message), {
        endpoint,
        code: error.code,
      });
      throw new Error(error.message);
    }

    // Cache GET requests for 2 minutes
    if (fetchOptions.method !== 'POST' && fetchOptions.method !== 'PUT' && 
        fetchOptions.method !== 'DELETE' && !skipCache) {
      cache.set(url, data.result, 2 * 60 * 1000);
    }

    return data.result as T;
  } catch (error) {
    logger.error('Cloudflare API request failed', error as Error, {
      url,
      method: fetchOptions.method || 'GET',
    });
    throw error;
  }
}

// Get Account ID (from database or environment)
export async function getAccountId(): Promise<string> {
  const cacheKey = CacheKeys.cfConfig();
  const cached = cache.get<{ accountId: string }>(cacheKey);
  
  if (cached) {
    return cached.accountId;
  }

  const config = await getCloudflareConfig();
  cache.set(cacheKey, { accountId: config.accountId }, 10 * 60 * 1000);
  
  return config.accountId;
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  
  return query ? `?${query}` : '';
}
