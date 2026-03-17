const DEFAULT_TIMEOUT_MS = 30000;

type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: number;
};

type ErrorWithMeta = Error & {
  code?: string;
  status?: number;
  isTransient?: boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isTransientStatus = (status: number) => status === 429 || status >= 500;

const isTimeoutError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError") return true;
  // Check for timeout-specific error messages
  const message = error.message.toLowerCase();
  return message.includes("timeout") || message.includes("aborted") || message.includes("canceled");
};

export const isTransientError = (error: unknown) => {
  const resolvedError = error instanceof Error ? (error as ErrorWithMeta) : null;
  if (!resolvedError) return false;
  if (resolvedError.isTransient) return true;
  if (isTimeoutError(resolvedError)) return true;

  const code = String(resolvedError.code || "");
  if (code.startsWith("UND_ERR_")) return true;
  if (code === "ECONNRESET" || code === "ENOTFOUND" || code === "ECONNREFUSED") return true;

  const message = resolvedError.message.toLowerCase();
  return message.includes("network") || message.includes("socket") || message.includes("fetch failed");
};

const createTransientResponseError = (response: Response, context = "fetch"): ErrorWithMeta => {
  const error = new Error(`${context} transient response: ${response.status}`) as ErrorWithMeta;
  error.isTransient = true;
  error.status = response.status;
  return error;
};

export async function fetchWithTimeout(
  url: RequestInfo | URL,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const upstreamSignal = options.signal;
  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      controller.abort();
    } else {
      upstreamSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    // If it's an abort error, create a more descriptive error
    if (error instanceof Error && error.name === "AbortError") {
      const abortError = new Error(`Request to ${url} timed out after ${timeoutMs}ms`) as Error & { name: string; code?: string };
      abortError.name = "AbortError";
      abortError.code = "ETIMEDOUT";
      throw abortError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchWithRetry<T>(fn: (attempt: number) => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    retries = 2,
    baseDelayMs = 300,
    maxDelayMs = 2500,
    jitter = 0.2,
  } = options;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      const canRetry = attempt < retries && isTransientError(error);

      if (!canRetry) {
        throw error;
      }

      const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const jitterOffset = exponential * jitter * Math.random();
      await sleep(Math.round(exponential + jitterOffset));
    }
  }

  throw (lastError instanceof Error ? lastError : new Error("Retry failed without captured error"));
}

export async function fetchJsonWithRetry<T = unknown>(
  url: RequestInfo | URL,
  options: RequestInit = {},
  retryOptions: RetryOptions = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
  context = "fetch",
): Promise<{ response: Response; data: T | null }> {
  const response = await fetchWithRetry(async () => {
    const res = await fetchWithTimeout(url, options, timeoutMs);
    if (isTransientStatus(res.status)) {
      throw createTransientResponseError(res, context);
    }
    return res;
  }, retryOptions);

  let data: T | null = null;
  try {
    data = (await response.json()) as T;
  } catch {
    data = null;
  }

  return { response, data };
}
