import type { ApiErrorDetails, ApiErrorResponse } from "@/types/api";

type ErrorWithCode = Error & {
  code?: string;
};

function toErrorWithCode(error: unknown): ErrorWithCode | null {
  return error instanceof Error ? (error as ErrorWithCode) : null;
}

// Safe error response handler - hides sensitive info in production
export function getSafeErrorMessage(error: unknown, context = ""): ApiErrorDetails {
  const isDevelopment = process.env.NODE_ENV === "development";
  const resolvedError = toErrorWithCode(error);

  if (!isDevelopment) {
    return {
      message: "An error occurred. Please try again.",
      code: "INTERNAL_SERVER_ERROR",
    };
  }

  return {
    message: resolvedError?.message || "Unknown error",
    code: resolvedError?.code || "UNKNOWN",
    context,
  };
}

// Handle API errors with safe response
export function handleApiError(error: unknown, context = ""): Response {
  const safeError = getSafeErrorMessage(error, context);
  const payload: ApiErrorResponse = { error: safeError };

  return new Response(JSON.stringify(payload), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

// Safe validation error response
export function validationError(message: string): Response {
  return new Response(JSON.stringify({ error: message } satisfies ApiErrorResponse), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

// Safe not found error
export function notFoundError(resource = "Resource"): Response {
  return new Response(JSON.stringify({ error: `${resource} not found` } satisfies ApiErrorResponse), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

// Safe unauthorized error
export function unauthorizedError(message = "Unauthorized"): Response {
  return new Response(JSON.stringify({ error: message } satisfies ApiErrorResponse), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

// Safe forbidden error
export function forbiddenError(message = "Forbidden"): Response {
  return new Response(JSON.stringify({ error: message } satisfies ApiErrorResponse), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
