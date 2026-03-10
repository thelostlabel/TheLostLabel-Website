export type OffsetPaginationParams = {
  page: number;
  limit: number;
  skip: number;
};

export type OffsetPaginationMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type PaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
};

export function parseOffsetPagination(searchParams: URLSearchParams, options: PaginationOptions = {}): OffsetPaginationParams {
  const defaultLimit = options.defaultLimit ?? 50;
  const maxLimit = options.maxLimit ?? 100;
  const requestedPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const requestedLimit = Number.parseInt(searchParams.get("limit") || String(defaultLimit), 10);

  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), maxLimit) : defaultLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function buildOffsetPaginationMeta(total: number, page: number, limit: number): OffsetPaginationMeta {
  const pages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    pages,
    hasNextPage: page < pages,
    hasPreviousPage: page > 1,
  };
}
