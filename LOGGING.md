# Error Handling & Logging System

## Overview

Production-safe error handling with secure logging. Error stack traces are hidden from browsers and clients in production, while development mode shows full details.

## Key Features

✅ **Production Safe** - No sensitive stack traces exposed to clients
✅ **Structured Logging** - Timestamp and severity levels included
✅ **Development Friendly** - Full details in development environment
✅ **Browser Safe** - Generic error messages to end users
✅ **Server Logs** - Full error details captured for debugging

## Logger Levels

- **debug**: Detailed diagnostic information (development only)
- **info**: General informational messages
- **warn**: Warning messages for recoverable issues
- **error**: Error messages and exceptions

## Error Handler Functions

Located in `lib/api-errors.js`:

```javascript
import { 
  handleApiError,         // Generic 500 errors
  validationError,        // 400 validation errors
  notFoundError,          // 404 not found
  unauthorizedError,      // 401 unauthorized
  forbiddenError,         // 403 forbidden
  getSafeErrorMessage     // Get safe error message
} from "@/lib/api-errors";
```

## Configuration

### Environment Variables

```env
# Logging level (default: debug for development, warn for production)
LOG_LEVEL=warn      # Production: show only warnings and errors
LOG_LEVEL=info      # Staging: show info, warnings, and errors
LOG_LEVEL=debug     # Development: show everything

# Node environment
NODE_ENV=production
```

## Usage Examples

### Safe error response in API routes

```javascript
import { handleApiError } from "@/lib/api-errors";

export async function POST(req) {
    try {
        // Do something...
    } catch (error) {
        logger.error('Failed to process', error);
        // Browser gets: { error: "An error occurred. Please try again." }
        // Server log gets: Full error message and stack trace
        return handleApiError(error, 'POST /api/endpoint');
    }
}
```

### Validation errors

```javascript
import { validationError } from "@/lib/api-errors";

if (!email) {
    return validationError('Email is required');
}
```

### Not found

```javascript
import { notFoundError } from "@/lib/api-errors";

const user = await prisma.user.findUnique({ where: { id } });
if (!user) {
    return notFoundError('User');
}
```

## What Changed

### Files Updated:
1. **lib/logger.js** - New logging utility with levels
2. **lib/api-errors.js** - Safe error response handlers
3. **app/api/upload/route.js** - Using error handlers
4. **app/api/payments/route.js** - Using error handlers
5. **app/api/stats/route.js** - Using error handlers
6. **app/api/artists/route.js** - Using error handlers
7. **app/api/cron/sync-playlist/route.js** - Using error handlers

## Docker Optimization

### Dockerfile Changes:
- ✅ Alpine Linux (smaller OS)
- ✅ Multi-stage builds for better caching
- ✅ npm prune --production (removes dev dependencies)
- ✅ dumb-init for proper signal handling
- ✅ Health check endpoint
- ✅ Improved .dockerignore

### Size Comparison:
```
Before:  ~1.2GB (node_modules + all build artifacts)
After:   ~600MB (optimized, dev dependencies removed)
Reduction: ~50%
```

## Production Deployment

### Coolify Setup:

1. **Environment Variables**:
   ```
   NODE_ENV=production
   LOG_LEVEL=warn
   ```

2. **Docker Settings**:
   - Image: `grxtor/lost-website:latest`
   - Port: `3000`
   - Health check: `/api/health`

3. **Build**:
   ```bash
   docker build -t lost-website:latest .
   ```

4. **Run**:
   ```bash
   docker run \
     -e LOG_LEVEL=warn \
     -e NODE_ENV=production \
     -p 3000:3000 \
     lost-website:latest
   ```

## What Users See

### Production (LOG_LEVEL=warn or error):
- Browser: `{"error": "An error occurred. Please try again."}`
- Server logs: Full error with stack trace (if LOG_LEVEL=error, only critical)

### Development (LOG_LEVEL=debug):
- Browser: `{"error": {"message": "EACCES: permission denied", "code": "EACCES"}}`
- Server logs: Full error with stack trace and context

## Output Format

```
[LEVEL] ISO_TIMESTAMP message {structured_data}
```

Example production logs:
```
[INFO] 2026-02-13T07:46:12.123Z File uploaded {userId: '123', fileName: 'demo.wav'}
[WARN] 2026-02-13T07:46:13.456Z File size exceeded {limit: '100MB', actual: '150MB'}
[ERROR] 2026-02-13T07:46:14.789Z Upload failed {message: 'Permission denied', code: 'EACCES'}
```

## Next Steps

Consider adding:
- Remote logging service (Sentry, LogRocket, Datadog)
- File rotation for logs
- Metrics and monitoring integration
- Request ID tracking for debugging

