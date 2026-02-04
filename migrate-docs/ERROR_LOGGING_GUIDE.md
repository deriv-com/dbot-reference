# Error Logging Guide

## Overview

This guide documents the centralized error logging utility implemented to standardize error handling across the DBot application. The utility provides a consistent interface for logging errors, warnings, and info messages, and can be easily extended to integrate with external error reporting services.

**Created:** 2026-02-04  
**Related Issue:** Issue #8 - Inconsistent Error Logging

---

## Table of Contents

1. [Why Centralized Error Logging?](#why-centralized-error-logging)
2. [ErrorLogger Utility](#errorlogger-utility)
3. [Usage Examples](#usage-examples)
4. [Integration with Error Reporting Services](#integration-with-error-reporting-services)
5. [Migration Guide](#migration-guide)
6. [Configuration](#configuration)

---

## Why Centralized Error Logging?

### Problems with Previous Approach

Before implementing the centralized error logger, the codebase had **140+ inconsistent console.error/warn/log calls**:

```typescript
// Inconsistent formats across files
console.error('[OAuth] Error parsing auth_info:', error);
console.error('Logout failed:', error);
console.error('WebSocket initialization failed:', initError);
```

**Issues:**
- ❌ Inconsistent message formatting
- ❌ No centralized control over logging
- ❌ Difficult to integrate with error reporting services
- ❌ Hard to filter/search logs
- ❌ No context metadata support

### Benefits of Centralized Approach

```typescript
// Consistent format with ErrorLogger
ErrorLogger.error('OAuth', 'Error parsing auth_info', error);
ErrorLogger.error('Logout', 'Logout failed', error);
ErrorLogger.error('ClientStore', 'WebSocket initialization failed', initError);
```

**Benefits:**
- ✅ Consistent message formatting with category prefix
- ✅ Centralized configuration and control
- ✅ Easy integration with Sentry, TrackJS, etc.
- ✅ Searchable by category
- ✅ Support for context metadata
- ✅ Can be disabled/filtered by log level

---

## ErrorLogger Utility

### Location

[`src/utils/error-logger.ts`](../src/utils/error-logger.ts:1)

### API Reference

#### Log Levels

```typescript
enum LogLevel {
    ERROR = 'error',   // Critical errors
    WARN = 'warn',     // Warnings
    INFO = 'info',     // Informational messages
    DEBUG = 'debug',   // Debug messages
}
```

#### Methods

##### `error(category: string, message: string, data?: unknown): void`

Log an error message.

```typescript
ErrorLogger.error('OAuth', 'Token exchange failed', error);
ErrorLogger.error('Storage', 'Failed to clear cache', { key: 'auth_info' });
```

##### `warn(category: string, message: string, data?: unknown): void`

Log a warning message.

```typescript
ErrorLogger.warn('API', 'Rate limit approaching', { remaining: 10 });
ErrorLogger.warn('Storage', 'Cache miss', { key: 'user_preferences' });
```

##### `info(category: string, message: string, data?: unknown): void`

Log an informational message.

```typescript
ErrorLogger.info('Auth', 'User logged in', { loginid: 'CR123' });
ErrorLogger.info('OAuth', 'Accounts fetched successfully', { count: 3 });
```

##### `debug(category: string, message: string, data?: unknown): void`

Log a debug message.

```typescript
ErrorLogger.debug('WebSocket', 'Connection state changed', { state: 'open' });
```

##### `configure(config: Partial<ErrorLoggerConfig>): void`

Configure the error logger.

```typescript
ErrorLogger.configure({
    enableConsole: true,
    minLogLevel: LogLevel.INFO,
    enableErrorReporting: false,
});
```

##### `setErrorReportingService(service: ErrorReportingService): void`

Set an external error reporting service.

```typescript
ErrorLogger.setErrorReportingService(new SentryErrorReportingService());
```

##### `setUserContext(userId: string, email?: string): void`

Set user context for error reporting.

```typescript
ErrorLogger.setUserContext('CR1234567', 'user@example.com');
```

##### `clearUserContext(): void`

Clear user context.

```typescript
ErrorLogger.clearUserContext();
```

---

## Usage Examples

### Basic Error Logging

```typescript
import { ErrorLogger } from '@/utils/error-logger';

try {
    await someAsyncOperation();
} catch (error) {
    ErrorLogger.error('MyModule', 'Operation failed', error);
}
```

### With Context Metadata

```typescript
ErrorLogger.error('OAuth', 'Token exchange failed', {
    error: data.error,
    description: data.error_description,
    timestamp: Date.now(),
});
```

### Warning Messages

```typescript
if (accounts.length === 0) {
    ErrorLogger.warn('OAuth', 'No accounts returned after token exchange');
}
```

### Info Messages

```typescript
ErrorLogger.info('Auth', 'User logged in successfully', {
    loginid: firstAccount.account_id,
    accountType: isDemo ? 'demo' : 'real',
});
```

### Category Naming Convention

Use clear, consistent category names:

- **OAuth** - OAuth authentication operations
- **Logout** - Logout operations
- **InvalidToken** - Invalid token handling
- **ClientStore** - Client store operations
- **Storage** - Storage operations
- **API** - API calls
- **WebSocket** - WebSocket operations

---

## Integration with Error Reporting Services

### Sentry Integration

```typescript
import * as Sentry from '@sentry/browser';
import { ErrorLogger, ErrorReportingService, LogContext } from '@/utils/error-logger';

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

// Initialize Sentry
Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
});

// Configure ErrorLogger to use Sentry
ErrorLogger.setErrorReportingService(new SentryErrorReportingService());
```

### TrackJS Integration

```typescript
import { TrackJS } from 'trackjs';
import { ErrorLogger, ErrorReportingService, LogContext } from '@/utils/error-logger';

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

// Initialize TrackJS
TrackJS.install({
    token: 'YOUR_TRACKJS_TOKEN',
    application: 'dbot',
});

// Configure ErrorLogger to use TrackJS
ErrorLogger.setErrorReportingService(new TrackJSErrorReportingService());
```

---

## Migration Guide

### Files Already Migrated

The following authentication-related files have been migrated to use ErrorLogger:

1. ✅ [`src/hooks/useLogout.ts`](../src/hooks/useLogout.ts:1)
2. ✅ [`src/hooks/useInvalidTokenHandler.ts`](../src/hooks/useInvalidTokenHandler.ts:1)
3. ✅ [`src/services/oauth-token-exchange.service.ts`](../src/services/oauth-token-exchange.service.ts:1)
4. ✅ [`src/stores/client-store.ts`](../src/stores/client-store.ts:1)

### Migration Steps

To migrate existing code to use ErrorLogger:

#### Step 1: Import ErrorLogger

```typescript
import { ErrorLogger } from '@/utils/error-logger';
```

#### Step 2: Replace console.error calls

**Before:**
```typescript
console.error('[OAuth] Token exchange failed:', error);
```

**After:**
```typescript
ErrorLogger.error('OAuth', 'Token exchange failed', error);
```

#### Step 3: Replace console.warn calls

**Before:**
```typescript
console.warn('Failed to clear cache');
```

**After:**
```typescript
ErrorLogger.warn('Storage', 'Failed to clear cache');
```

#### Step 4: Replace console.log calls (for important info)

**Before:**
```typescript
console.log('[OAuth] Accounts fetched and stored, active_loginid set:', firstAccount.account_id);
```

**After:**
```typescript
ErrorLogger.info('OAuth', 'Accounts fetched and stored', {
    loginid: firstAccount.account_id,
});
```

### Remaining Files to Migrate

There are **136+ remaining console.error/warn/log calls** across the codebase that can be migrated to ErrorLogger. Priority files:

1. `src/external/bot-skeleton/services/api/api-base.ts` - API operations
2. `src/services/derivws-accounts.service.ts` - Account service
3. `src/app/App.tsx` - Main app
4. `src/stores/*.ts` - Other stores
5. `src/utils/*.ts` - Utility functions

---

## Configuration

### Default Configuration

```typescript
{
    enableConsole: true,
    minLogLevel: LogLevel.INFO,
    enableErrorReporting: false,
    errorReportingService: undefined,
}
```

### Production Configuration Example

```typescript
// In production, you might want to:
// 1. Reduce console logging
// 2. Enable error reporting
// 3. Set higher log level

if (process.env.NODE_ENV === 'production') {
    ErrorLogger.configure({
        enableConsole: false,  // Disable console in production
        minLogLevel: LogLevel.WARN,  // Only log warnings and errors
        enableErrorReporting: true,
    });
    
    // Set up Sentry or TrackJS
    ErrorLogger.setErrorReportingService(new SentryErrorReportingService());
}
```

### Development Configuration Example

```typescript
// In development, you might want verbose logging
if (process.env.NODE_ENV === 'development') {
    ErrorLogger.configure({
        enableConsole: true,
        minLogLevel: LogLevel.DEBUG,  // Log everything
        enableErrorReporting: false,  // Don't send to external service
    });
}
```

---

## Best Practices

### 1. Use Descriptive Categories

```typescript
// ✅ Good - Clear category
ErrorLogger.error('OAuth', 'Token exchange failed', error);

// ❌ Bad - Vague category
ErrorLogger.error('Error', 'Something failed', error);
```

### 2. Include Context Data

```typescript
// ✅ Good - Includes helpful context
ErrorLogger.error('API', 'Request failed', {
    endpoint: '/api/authorize',
    statusCode: 401,
    error,
});

// ❌ Bad - No context
ErrorLogger.error('API', 'Request failed', error);
```

### 3. Use Appropriate Log Levels

```typescript
// ✅ Good - Correct log levels
ErrorLogger.error('Auth', 'Login failed', error);  // Critical
ErrorLogger.warn('Cache', 'Cache miss');  // Warning
ErrorLogger.info('Auth', 'User logged in');  // Info
ErrorLogger.debug('WebSocket', 'Ping sent');  // Debug

// ❌ Bad - Everything as error
ErrorLogger.error('Auth', 'User logged in');  // Should be info
```

### 4. Don't Log Sensitive Data

```typescript
// ✅ Good - No sensitive data
ErrorLogger.error('Auth', 'Login failed', {
    loginid: 'CR123***',  // Masked
});

// ❌ Bad - Logs sensitive data
ErrorLogger.error('Auth', 'Login failed', {
    password: 'user_password',  // Never log passwords!
    token: 'a1-xxx',  // Don't log full tokens
});
```

---

## Future Enhancements

1. **Automatic Error Grouping** - Group similar errors together
2. **Rate Limiting** - Prevent log spam
3. **Log Sampling** - Sample logs in high-traffic scenarios
4. **Performance Monitoring** - Track performance metrics
5. **Custom Error Tags** - Add custom tags for filtering

---

## Related Documentation

- [Authentication Flow Revised](./AUTHENTICATION_FLOW_REVISED.md)
- [Monitoring Packages](./MONITORING_PACKAGES.md)

---

## Changelog

### 2026-02-04 - Initial Implementation
- Created centralized ErrorLogger utility
- Migrated authentication-related files
- Added support for external error reporting services
- Documented usage and migration guide
