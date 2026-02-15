/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    timestamp: string;
    version?: string;
    [key: string]: any;
  };
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Creates a successful API response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Creates a paginated API response
 */
export function paginatedResponse<T>(
  data: T,
  pagination: PaginatedResponse<T>['pagination']
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Creates an error API response
 */
export function errorResponse(error: string, statusCode?: number): ApiResponse {
  return {
    success: false,
    error,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Removes sensitive fields from user object
 */
export function sanitizeUserData(user: any) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Removes sensitive fields from multiple users
 */
export function sanitizeUsersData(users: any[]) {
  return users.map(sanitizeUserData);
}
