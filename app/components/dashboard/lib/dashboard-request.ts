import {
  fetchJsonWithRetry,
  fetchWithTimeout,
} from "@/lib/fetch-utils";

type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: number;
};

type DashboardRequestInit = RequestInit & {
  context?: string;
  timeoutMs?: number;
  retry?: false | RetryOptions;
};

type ErrorPayload = {
  error?: string;
  message?: string;
  code?: string;
};

export class DashboardRequestError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "DashboardRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const DEFAULT_RETRY: RetryOptions = {
  retries: 1,
  baseDelayMs: 250,
  maxDelayMs: 1500,
  jitter: 0.15,
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (isPlainObject(payload)) {
    const error = payload.error;
    const message = payload.message;
    if (typeof error === "string" && error.trim()) return error;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};

const getErrorCode = (payload: unknown) => {
  if (!isPlainObject(payload)) return undefined;
  const code = payload.code;
  return typeof code === "string" && code.trim() ? code : undefined;
};

async function readJsonSafely<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function dashboardRequestJson<T>(
  input: RequestInfo | URL,
  init: DashboardRequestInit = {},
): Promise<T> {
  const { context = "request", timeoutMs = 10000, retry, ...requestInit } = init;
  const method = String(requestInit.method || "GET").toUpperCase();
  const retryOptions = retry === false ? false : retry ?? (method === "GET" ? DEFAULT_RETRY : false);

  let response: Response;
  let data: T | ErrorPayload | null;

  if (retryOptions) {
    const result = await fetchJsonWithRetry<T | ErrorPayload>(
      input,
      requestInit,
      retryOptions,
      timeoutMs,
      context,
    );
    response = result.response;
    data = result.data;
  } else {
    response = await fetchWithTimeout(input, requestInit, timeoutMs);
    data = await readJsonSafely<T | ErrorPayload>(response);
  }

  if (!response.ok) {
    throw new DashboardRequestError(
      getErrorMessage(data, `${context} failed with ${response.status}`),
      response.status,
      getErrorCode(data),
      data,
    );
  }

  return (data ?? {}) as T;
}

export function getDashboardErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof DashboardRequestError) {
    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
