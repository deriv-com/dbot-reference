/**
 * Centralized Error Logging Utility
 * 
 * This utility provides a consistent interface for logging errors, warnings, and info messages
 * across the application. It can be easily extended to integrate with error reporting services
 * like Sentry, TrackJS, or other monitoring tools.
 * 
 * @example
 * ```typescript
 * import { ErrorLogger } from '@/utils/error-logger';
 * 
 * // Log an error
 * ErrorLogger.error('OAuth', 'Token exchange failed', error);
 * 
 * // Log a warning
 * ErrorLogger.warn('Storage', 'Failed to clear cache', { key: 'auth_info' });
 * 
 * // Log info
 * ErrorLogger.info('Auth', 'User logged in successfully', { loginid: 'CR123' });
 * ```
 */

/**
 * Log level enum
 */
export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
}

/**
 * Log context interface for additional metadata
 */
export interface LogContext {
    [key: string]: unknown;
}

/**
 * Error reporting service interface
 * Implement this interface to integrate with external error reporting services
 */
export interface ErrorReportingService {
    /**
     * Report an error to the external service
     */
    reportError(error: Error, context?: LogContext): void;

    /**
     * Report a warning to the external service
     */
    reportWarning(message: string, context?: LogContext): void;

    /**
     * Set user context for error reporting
     */
    setUserContext(userId: string, email?: string): void;

    /**
     * Clear user context
     */
    clearUserContext(): void;
}

/**
 * Configuration for the error logger
 */
interface ErrorLoggerConfig {
    /**
     * Enable/disable console logging
     */
    enableConsole: boolean;

    /**
     * Minimum log level to output
     */
    minLogLevel: LogLevel;

    /**
     * External error reporting service (e.g., Sentry, TrackJS)
     */
    errorReportingService?: ErrorReportingService;

    /**
     * Enable/disable error reporting to external service
     */
    enableErrorReporting: boolean;
}

/**
 * Default configuration
 */
const defaultConfig: ErrorLoggerConfig = {
    enableConsole: true,
    minLogLevel: LogLevel.INFO,
    enableErrorReporting: false,
    errorReportingService: undefined,
};

/**
 * Centralized Error Logger
 */
class ErrorLoggerClass {
    private config: ErrorLoggerConfig = defaultConfig;

    /**
     * Configure the error logger
     */
    configure(config: Partial<ErrorLoggerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): ErrorLoggerConfig {
        return { ...this.config };
    }

    /**
     * Set error reporting service
     */
    setErrorReportingService(service: ErrorReportingService): void {
        this.config.errorReportingService = service;
        this.config.enableErrorReporting = true;
    }

    /**
     * Check if log level should be output
     */
    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        const currentLevelIndex = levels.indexOf(this.config.minLogLevel);
        const requestedLevelIndex = levels.indexOf(level);
        return requestedLevelIndex >= currentLevelIndex;
    }

    /**
     * Format log message with prefix
     */
    private formatMessage(category: string, message: string): string {
        return `[${category}] ${message}`;
    }

    /**
     * Log to console
     */
    private logToConsole(
        level: LogLevel,
        category: string,
        message: string,
        data?: unknown
    ): void {
        if (!this.config.enableConsole || !this.shouldLog(level)) {
            return;
        }

        const formattedMessage = this.formatMessage(category, message);

        switch (level) {
            case LogLevel.ERROR:
                if (data !== undefined) {
                    console.error(formattedMessage, data);
                } else {
                    console.error(formattedMessage);
                }
                break;
            case LogLevel.WARN:
                if (data !== undefined) {
                    console.warn(formattedMessage, data);
                } else {
                    console.warn(formattedMessage);
                }
                break;
            case LogLevel.INFO:
                if (data !== undefined) {
                    console.log(formattedMessage, data);
                } else {
                    console.log(formattedMessage);
                }
                break;
            case LogLevel.DEBUG:
                if (data !== undefined) {
                    console.debug(formattedMessage, data);
                } else {
                    console.debug(formattedMessage);
                }
                break;
        }
    }

    /**
     * Report to external error reporting service
     */
    private reportToExternalService(
        level: LogLevel,
        category: string,
        message: string,
        data?: unknown
    ): void {
        if (!this.config.enableErrorReporting || !this.config.errorReportingService) {
            return;
        }

        const context: LogContext = {
            category,
            level,
            ...(data && typeof data === 'object' ? (data as LogContext) : { data }),
        };

        try {
            if (level === LogLevel.ERROR && data instanceof Error) {
                this.config.errorReportingService.reportError(data, context);
            } else if (level === LogLevel.WARN) {
                this.config.errorReportingService.reportWarning(
                    this.formatMessage(category, message),
                    context
                );
            }
        } catch (reportingError) {
            // Fallback to console if external reporting fails
            console.error('[ErrorLogger] Failed to report to external service:', reportingError);
        }
    }

    /**
     * Log an error message
     * 
     * @param category - Category/module name (e.g., 'OAuth', 'Storage', 'API')
     * @param message - Error message
     * @param data - Optional error object or additional context
     * 
     * @example
     * ErrorLogger.error('OAuth', 'Token exchange failed', error);
     * ErrorLogger.error('Storage', 'Failed to clear cache', { key: 'auth_info' });
     */
    error(category: string, message: string, data?: unknown): void {
        this.logToConsole(LogLevel.ERROR, category, message, data);
        this.reportToExternalService(LogLevel.ERROR, category, message, data);
    }

    /**
     * Log a warning message
     * 
     * @param category - Category/module name
     * @param message - Warning message
     * @param data - Optional additional context
     * 
     * @example
     * ErrorLogger.warn('API', 'Rate limit approaching', { remaining: 10 });
     */
    warn(category: string, message: string, data?: unknown): void {
        this.logToConsole(LogLevel.WARN, category, message, data);
        this.reportToExternalService(LogLevel.WARN, category, message, data);
    }

    /**
     * Log an info message
     * 
     * @param category - Category/module name
     * @param message - Info message
     * @param data - Optional additional context
     * 
     * @example
     * ErrorLogger.info('Auth', 'User logged in', { loginid: 'CR123' });
     */
    info(category: string, message: string, data?: unknown): void {
        this.logToConsole(LogLevel.INFO, category, message, data);
    }

    /**
     * Log a debug message
     * 
     * @param category - Category/module name
     * @param message - Debug message
     * @param data - Optional additional context
     * 
     * @example
     * ErrorLogger.debug('WebSocket', 'Connection state changed', { state: 'open' });
     */
    debug(category: string, message: string, data?: unknown): void {
        this.logToConsole(LogLevel.DEBUG, category, message, data);
    }

    /**
     * Set user context for error reporting
     * 
     * @param userId - User ID
     * @param email - Optional user email
     */
    setUserContext(userId: string, email?: string): void {
        if (this.config.errorReportingService) {
            this.config.errorReportingService.setUserContext(userId, email);
        }
    }

    /**
     * Clear user context
     */
    clearUserContext(): void {
        if (this.config.errorReportingService) {
            this.config.errorReportingService.clearUserContext();
        }
    }
}

/**
 * Singleton instance of ErrorLogger
 */
export const ErrorLogger = new ErrorLoggerClass();

/**
 * Example implementation of Sentry error reporting service
 * Uncomment and implement when ready to integrate Sentry
 */
/*
import * as Sentry from '@sentry/browser';

class SentryErrorReportingService implements ErrorReportingService {
    reportError(error: Error, context?: LogContext): void {
        Sentry.captureException(error, {
            extra: context,
        });
    }

    reportWarning(message: string, context?: LogContext): void {
        Sentry.captureMessage(message, {
            level: 'warning',
            extra: context,
        });
    }

    setUserContext(userId: string, email?: string): void {
        Sentry.setUser({
            id: userId,
            email,
        });
    }

    clearUserContext(): void {
        Sentry.setUser(null);
    }
}

// Initialize Sentry and configure ErrorLogger
Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: process.env.NODE_ENV,
});

ErrorLogger.setErrorReportingService(new SentryErrorReportingService());
*/

/**
 * Example implementation of TrackJS error reporting service
 * Uncomment and implement when ready to integrate TrackJS
 */
/*
import { TrackJS } from 'trackjs';

class TrackJSErrorReportingService implements ErrorReportingService {
    reportError(error: Error, context?: LogContext): void {
        TrackJS.track(error);
        if (context) {
            TrackJS.addMetadata('context', context);
        }
    }

    reportWarning(message: string, context?: LogContext): void {
        TrackJS.console.warn(message, context);
    }

    setUserContext(userId: string, email?: string): void {
        TrackJS.configure({
            userId,
            metadata: { email },
        });
    }

    clearUserContext(): void {
        TrackJS.configure({
            userId: undefined,
            metadata: {},
        });
    }
}

// Initialize TrackJS and configure ErrorLogger
TrackJS.install({
    token: 'YOUR_TRACKJS_TOKEN',
});

ErrorLogger.setErrorReportingService(new TrackJSErrorReportingService());
*/
