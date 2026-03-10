export type ApiErrorDetails<TCode extends string = string> = {
  message: string;
  code: TCode;
  context?: string;
};

export type ApiErrorResponse<TCode extends string = string> = {
  error: string | ApiErrorDetails<TCode>;
};

export type ListResponse<T> = {
  items: T[];
  total: number;
};

export type PaginatedListResponse<T> = ListResponse<T> & {
  page: number;
  pageSize: number;
};
