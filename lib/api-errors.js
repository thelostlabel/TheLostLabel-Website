// Safe error response handler - hides sensitive info in production
export function getSafeErrorMessage(error, context = '') {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
        // Production: generic message
        return {
            message: 'An error occurred. Please try again.',
            code: 'INTERNAL_SERVER_ERROR'
        };
    }
    
    // Development: detailed message
    return {
        message: error?.message || 'Unknown error',
        code: error?.code || 'UNKNOWN',
        context
    };
}

// Handle API errors with safe response
export function handleApiError(error, context = '') {
    const safeError = getSafeErrorMessage(error, context);
    
    return new Response(
        JSON.stringify({ error: safeError }),
        { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

// Safe validation error response
export function validationError(message) {
    return new Response(
        JSON.stringify({ error: message }),
        { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

// Safe not found error
export function notFoundError(resource = 'Resource') {
    return new Response(
        JSON.stringify({ error: `${resource} not found` }),
        { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

// Safe unauthorized error
export function unauthorizedError(message = 'Unauthorized') {
    return new Response(
        JSON.stringify({ error: message }),
        { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

// Safe forbidden error
export function forbiddenError(message = 'Forbidden') {
    return new Response(
        JSON.stringify({ error: message }),
        { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}
