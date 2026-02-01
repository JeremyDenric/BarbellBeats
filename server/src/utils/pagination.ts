/**
 * Pagination Utilities
 * Standardized pagination helpers for consistent API responses
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  params: PaginationParams
): PaginatedResult<never>['pagination'] {
  const limit = params.limit ?? 20;
  const page = params.page ?? Math.floor((params.offset ?? 0) / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Apply pagination to an array
 */
export function paginate<T>(
  items: T[],
  params: PaginationParams
): PaginatedResult<T> {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? (((params.page ?? 1) - 1) * limit);

  const paginatedItems = items.slice(offset, offset + limit);
  const pagination = calculatePagination(items.length, { ...params, limit });

  return {
    data: paginatedItems,
    pagination,
  };
}

/**
 * Create Prisma pagination args
 */
export function prismaPagination(params: PaginationParams): {
  skip: number;
  take: number;
} {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? (((params.page ?? 1) - 1) * limit);

  return {
    skip: offset,
    take: limit,
  };
}

/**
 * Format paginated response for API
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    data,
    pagination: calculatePagination(total, params),
  };
}
