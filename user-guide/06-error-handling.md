# Error Handling Guide

Documentation for the centralized error logging utility, including usage patterns, integration with external error reporting services, and migration from ad-hoc console logging.

## Table of Contents

- [Overview](#overview)
- [ErrorLogger API](#errorlogger-api)
- [Usage Examples](#usage-examples)
- [Category Naming Convention](#category-naming-convention)
- [Configuration](#configuration)
- [Integration with Error Reporting Services](#integration-with-error-reporting-services)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)

---

## Overview

The application uses a centralized `ErrorLogger` utility that provides standardized error handling across the entire codebase. It replaces inconsistent `console.error`/`console.warn`/`console.log` calls with a unified interface that supports:

- Consistent message formatting with category prefixes
- Configurable log levels (error, warn, info, debug)
- Pluggable external error reporting (Sentry, TrackJS, etc.)
- Searchable and filterable log output
- User context for error tracking
- Environment-aware configuration

**File:** `src/utils/error-logger.ts`

### Why Centralized Logging?

| Before (Inconsistent)                                    | After (Centralized)                                  |
| -------------------------------------------------------- | ---------------------------------------------------- |
| `console.error('[OAuth] Error parsing auth_info:', e)`   | `ErrorLogger.error('OAuth', 'Error parsing auth_info', e)` |
| `console.error('Logout failed:', e)`                     | `ErrorLogger.error('Logout', 'Logout failed', e)`   |
| `console.warn('Failed to clear cache')`                  | `ErrorLogger.warn('Storage', 'Failed to clear cache')` |

Benefits: consistent format, centralized control, easy integration with Sentry/TrackJS, searchable by category, context metadata support, configurable log levels.

---

## ErrorLogger API

### Log Levels

```typescript
enum LogLevel {
    ERROR = 'error',  // Critical errors that break functionality
    WARN  = 'warn',   // Non-critical issues, degraded experience
    INFO  = 'info',   // Important operational events
    DEBUG = 'debug',  // Detailed diagnostic information
}
```

### Methods

#### `error(category, message, data?)`

Log a critical error.

```typescript
ErrorLogger.error('OAuth', 'Token exchange failed', error);
ErrorLogger.error('Storage', 'Failed to clear cache', { key: 'auth_info' });
```

#### `warn(category, message, data?)`

Log a warning for non-critical issues.

```typescript
ErrorLogger.warn('API', 'Rate limit approaching', { remaining: 10 });
ErrorLogger.warn('Storage', 'Cache miss', { key: 'user_preferences' });
```

#### `info(category, message, data?)`

Log an informational event.

```typescript
ErrorLogger.info('Auth', 'User logged in', { loginid: 'CR123' });
ErrorLogger.info('OAuth', 'Accounts fetched', { count: 3 });
```

#### `debug(category, message, data?)`

Log detailed diagnostic information.

```typescript
ErrorLogger.debug('WebSocket', 'Connection state changed', { state: 'open' });
```

#### `configure(config)`

Update the logger configuration.

```typescript
ErrorLogger.configure({
    enableConsole: true,
    minLogLevel: LogLevel.INFO,
    enableErrorReporting: false,
});
```

#### `setErrorReportingService(service)`

Attach an external error reporting service.

```typescript
ErrorLogger.setErrorReportingService(new SentryErrorReportingService());
```

#### `setUserContext(userId, email?)`

Set user context for error reports.

```typescript
ErrorLogger.setUserContext('CR1234567', 'user@example.com');
```

#### `clearUserContext()`

Clear user context (on logout).

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

### Conditional Warnings

```typescript
if (accounts.length === 0) {
    ErrorLogger.warn('OAuth', 'No accounts returned after token exchange');
}
```

### Operational Info

```typescript
ErrorLogger.info('Auth', 'User logged in successfully', {
    loginid: firstAccount.account_id,
    accountType: isDemo ? 'demo' : 'real',
});
```

---

## Category Naming Convention

Use clear, consistent category names that identify the subsystem:

| Category        | Description                  |
| --------------- | ---------------------------- |
| `OAuth`         | OAuth authentication         |
| `Logout`        | Logout operations            |
| `InvalidToken`  | Invalid token handling       |
| `ClientStore`   | Client state management      |
| `Storage`       | Browser storage operations   |
| `API`           | REST API calls               |
| `WebSocket`     | WebSocket operations         |
| `Bot`           | Bot execution engine         |
| `Blockly`       | Blockly workspace            |
| `Chart`         | Chart component              |
| `Analytics`     | Analytics tracking           |

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

### Production Configuration

```typescript
if (process.env.NODE_ENV === 'production') {
    ErrorLogger.configure({
        enableConsole: false,         // Suppress console output
        minLogLevel: LogLevel.WARN,   // Only warnings and errors
        enableErrorReporting: true,   // Send to reporting service
    });

    ErrorLogger.setErrorReportingService(new SentryErrorReportingService());
}
```

### Development Configuration

```typescript
if (process.env.NODE_ENV === 'development') {
    ErrorLogger.configure({
        enableConsole: true,          // Full console output
        minLogLevel: LogLevel.DEBUG,  // Log everything
        enableErrorReporting: false,  // Don't pollute external service
    });
}
```

---

## Integration with Error Reporting Services

### ErrorReportingService Interface

```typescript
interface ErrorReportingService {
    reportError(error: Error, context?: LogContext): void;
    reportWarning(message: string, context?: LogContext): void;
    setUserContext(userId: string, email?: string): void;
    clearUserContext(): void;
}
```

### Sentry Integration

```typescript
import * as Sentry from '@sentry/browser';
import { ErrorLogger, ErrorReportingService, LogContext } from '@/utils/error-logger';

class SentryErrorReportingService implements ErrorReportingService {
    reportError(error: Error, context?: LogContext): void {
        Sentry.captureException(error, { extra: context });
    }

    reportWarning(message: string, context?: LogContext): void {
        Sentry.captureMessage(message, { level: 'warning', extra: context });
    }

    setUserContext(userId: string, email?: string): void {
        Sentry.setUser({ id: userId, email });
    }

    clearUserContext(): void {
        Sentry.setUser(null);
    }
}

// Initialize
Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
});

ErrorLogger.setErrorReportingService(new SentryErrorReportingService());
```

### TrackJS Integration

```typescript
import { TrackJS } from 'trackjs';
import { ErrorLogger, ErrorReportingService, LogContext } from '@/utils/error-logger';

class TrackJSErrorReportingService implements ErrorReportingService {
    reportError(error: Error, context?: LogContext): void {
        TrackJS.track(error);
        if (context) TrackJS.addMetadata('context', context);
    }

    reportWarning(message: string, context?: LogContext): void {
        TrackJS.console.warn(message, context);
    }

    setUserContext(userId: string, email?: string): void {
        TrackJS.configure({ userId, metadata: { email } });
    }

    clearUserContext(): void {
        TrackJS.configure({ userId: undefined, metadata: {} });
    }
}

// Initialize
TrackJS.install({
    token: 'YOUR_TRACKJS_TOKEN',
    application: 'dbot',
});

ErrorLogger.setErrorReportingService(new TrackJSErrorReportingService());
```

---

## Migration Guide

### Already Migrated Files

These authentication-related files already use `ErrorLogger`:

- `src/hooks/useLogout.ts`
- `src/hooks/useInvalidTokenHandler.ts`
- `src/services/oauth-token-exchange.service.ts`
- `src/stores/client-store.ts`

### How to Migrate Existing Code

#### Step 1: Import ErrorLogger

```typescript
import { ErrorLogger } from '@/utils/error-logger';
```

#### Step 2: Replace console calls

**console.error:**

```typescript
// Before
console.error('[OAuth] Token exchange failed:', error);

// After
ErrorLogger.error('OAuth', 'Token exchange failed', error);
```

**console.warn:**

```typescript
// Before
console.warn('Failed to clear cache');

// After
ErrorLogger.warn('Storage', 'Failed to clear cache');
```

**console.log (for important operational events):**

```typescript
// Before
console.log('[OAuth] Accounts fetched:', firstAccount.account_id);

// After
ErrorLogger.info('OAuth', 'Accounts fetched', { loginid: firstAccount.account_id });
```

### Priority Files for Migration

1. `src/external/bot-skeleton/services/api/api-base.ts` - API operations
2. `src/services/derivws-accounts.service.ts` - Account service
3. `src/app/App.tsx` - Main application
4. `src/stores/*.ts` - Other MobX stores
5. `src/utils/*.ts` - Utility functions

---

## Best Practices

### Use Descriptive Categories

```typescript
// Good - clear category identifies the subsystem
ErrorLogger.error('OAuth', 'Token exchange failed', error);

// Bad - vague category
ErrorLogger.error('Error', 'Something failed', error);
```

### Include Context Data

```typescript
// Good - includes helpful context for debugging
ErrorLogger.error('API', 'Request failed', {
    endpoint: '/api/authorize',
    statusCode: 401,
    error,
});

// Bad - no context to debug the issue
ErrorLogger.error('API', 'Request failed', error);
```

### Use Appropriate Log Levels

```typescript
ErrorLogger.error('Auth', 'Login failed', error);      // Critical - broken functionality
ErrorLogger.warn('Cache', 'Cache miss for key');         // Warning - degraded performance
ErrorLogger.info('Auth', 'User logged in');              // Info - operational event
ErrorLogger.debug('WebSocket', 'Ping sent');             // Debug - diagnostic detail
```

### Never Log Sensitive Data

```typescript
// Good - masked sensitive data
ErrorLogger.error('Auth', 'Login failed', { loginid: 'CR123***' });

// Bad - exposes secrets
ErrorLogger.error('Auth', 'Login failed', { password: 'xxx', token: 'a1-xxx' });
```

### Wrap Analytics/External Calls

```typescript
// Prevent analytics failures from crashing the app
try {
    ErrorLogger.info('Analytics', 'Event tracked', { event: 'page_view' });
} catch (e) {
    // Silent fail for non-critical operations
}
```
