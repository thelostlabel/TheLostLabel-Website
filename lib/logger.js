// Production-friendly logger
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'debug');

const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

const currentLevel = levels[LOG_LEVEL] || levels.debug;

function formatTimestamp() {
    return new Date().toISOString();
}

function shouldLog(level) {
    return levels[level] >= currentLevel;
}

export const logger = {
    debug: (message, data = null) => {
        if (shouldLog('debug')) {
            console.log(`[DEBUG] ${formatTimestamp()} ${message}`, data ? data : '');
        }
    },
    
    info: (message, data = null) => {
        if (shouldLog('info')) {
            console.log(`[INFO] ${formatTimestamp()} ${message}`, data ? data : '');
        }
    },
    
    warn: (message, data = null) => {
        if (shouldLog('warn')) {
            console.warn(`[WARN] ${formatTimestamp()} ${message}`, data ? data : '');
        }
    },
    
    error: (message, error = null) => {
        if (shouldLog('error')) {
            if (error instanceof Error) {
                console.error(`[ERROR] ${formatTimestamp()} ${message}`, {
                    message: error.message,
                    code: error.code || 'UNKNOWN',
                    // Only include stack trace in development
                    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
                });
            } else {
                console.error(`[ERROR] ${formatTimestamp()} ${message}`, error);
            }
        }
    }
};

export default logger;
