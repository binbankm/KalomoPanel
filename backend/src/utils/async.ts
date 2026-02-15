import { cfRequest } from './api';
import { logger } from './logger';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

/**
 * Executes a function with exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries}`, {
          error: lastError.message,
          delay,
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Cloudflare API request with retry logic
 */
export async function cfRequestWithRetry<T>(
  endpoint: string,
  options: any = {}
): Promise<T> {
  return withRetry(
    () => cfRequest<T>(endpoint, options),
    {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000,
    }
  );
}

/**
 * Batches multiple requests with rate limiting
 */
export async function batchRequests<T>(
  requests: (() => Promise<T>)[],
  concurrency: number = 5
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(req => req()));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function(this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

/**
 * Throttles a function call
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
