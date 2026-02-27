const DEFAULT_TIMEOUT_MS = 10000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const isTransientStatus = (status) => status === 429 || status >= 500;

const isTimeoutError = (error) => {
    if (!error) return false;
    if (error.name === 'AbortError') return true;
    return String(error.message || '').toLowerCase().includes('timeout');
};

export const isTransientError = (error) => {
    if (!error) return false;
    if (error.isTransient) return true;
    if (isTimeoutError(error)) return true;

    const code = String(error.code || '');
    if (code.startsWith('UND_ERR_')) return true;
    if (code === 'ECONNRESET' || code === 'ENOTFOUND' || code === 'ECONNREFUSED') return true;

    const msg = String(error.message || '').toLowerCase();
    return msg.includes('network') || msg.includes('socket') || msg.includes('fetch failed');
};

const createTransientResponseError = (response, context = 'fetch') => {
    const error = new Error(`${context} transient response: ${response.status}`);
    error.isTransient = true;
    error.status = response.status;
    return error;
};

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const upstreamSignal = options.signal;
    if (upstreamSignal) {
        if (upstreamSignal.aborted) {
            controller.abort();
        } else {
            upstreamSignal.addEventListener('abort', () => controller.abort(), { once: true });
        }
    }

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeout);
    }
}

export async function fetchWithRetry(fn, options = {}) {
    const {
        retries = 2,
        baseDelayMs = 300,
        maxDelayMs = 2500,
        jitter = 0.2
    } = options;

    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
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

    throw lastError || new Error('Retry failed without captured error');
}

export async function fetchJsonWithRetry(url, options = {}, retryOptions = {}, timeoutMs = DEFAULT_TIMEOUT_MS, context = 'fetch') {
    const response = await fetchWithRetry(async () => {
        const res = await fetchWithTimeout(url, options, timeoutMs);
        if (isTransientStatus(res.status)) {
            throw createTransientResponseError(res, context);
        }
        return res;
    }, retryOptions);

    let data = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    return { response, data };
}
