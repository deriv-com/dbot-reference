# Authentication Flow - Revised (Post-Refactoring)

## Overview

This document describes the **revised authentication flow** after the refactoring that removed `useOauth2`, `whoami.service`, and `logout.service`. The new flow is simplified and more maintainable.

**Last Updated:** 2026-02-04  
**Related PR:** Authentication & Logout Refactoring

---

## Table of Contents

1. [Architecture Changes](#architecture-changes)
2. [OAuth2 Authentication Flow](#oauth2-authentication-flow)
3. [Token Management](#token-management)
4. [Logout Flow](#logout-flow)
5. [Invalid Token Handling](#invalid-token-handling)
6. [Key Components](#key-components)
7. [Error Handling](#error-handling)

---

## Architecture Changes

### What Was Removed

- ❌ `src/hooks/auth/useOauth2.ts` - Complex OAuth hook
- ❌ `src/services/whoami.service.ts` - Redundant service
- ❌ `src/services/logout.service.ts` - Redundant service
- ❌ 763 lines of code total

### What Was Added/Modified

- ✅ [`src/hooks/useLogout.ts`](../src/hooks/useLogout.ts:1) - Simplified logout hook
- ✅ [`src/hooks/useInvalidTokenHandler.ts`](../src/hooks/useInvalidTokenHandler.ts:1) - Invalid token handler
- ✅ [`src/services/oauth-token-exchange.service.ts`](../src/services/oauth-token-exchange.service.ts:1) - Enhanced with auto-initialization
- ✅ [`src/stores/client-store.ts`](../src/stores/client-store.ts:243) - Updated logout method

---

## OAuth2 Authentication Flow

### 1. Initial Authentication

```
User clicks "Login"
    ↓
Generate OAuth URL with PKCE
    ↓
Redirect to OAuth provider
    ↓
User authenticates
    ↓
Redirect to callback with authorization code
    ↓
Exchange code for access token
    ↓
Fetch accounts and initialize WebSocket
    ↓
User is authenticated
```

### 2. Token Exchange Process

**File:** [`src/services/oauth-token-exchange.service.ts`](../src/services/oauth-token-exchange.service.ts:96)

```typescript
static async exchangeCodeForToken(code: string): Promise<TokenExchangeResponse> {
    // 1. Get code verifier from sessionStorage
    const codeVerifier = getCodeVerifier();

    // 2. Exchange authorization code for access token
    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
            client_id: clientId,
        }),
    });

    // 3. Store auth info in sessionStorage
    const authInfo = {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        expires_at: Date.now() + (data.expires_in || 3600) * 1000,
        scope: data.scope,
        refresh_token: data.refresh_token,
    };
    sessionStorage.setItem('auth_info', JSON.stringify(authInfo));

    // 4. Automatically fetch accounts and initialize WebSocket
    const accounts = await DerivWSAccountsService.fetchAccountsList(data.access_token);

    if (accounts && accounts.length > 0) {
        // Store accounts
        DerivWSAccountsService.storeAccounts(accounts);

        // Set first account as active
        const firstAccount = accounts[0];
        localStorage.setItem('active_loginid', firstAccount.account_id);

        // Set account type (demo/real)
        const isDemo = firstAccount.account_id.startsWith('VRT') ||
                      firstAccount.account_id.startsWith('VRTC');
        localStorage.setItem('account_type', isDemo ? 'demo' : 'real');

        // Initialize WebSocket with the account
        const { api_base } = await import('@/external/bot-skeleton');
        await api_base.init(true);
    } else {
        // Error: No accounts available
        return {
            error: 'no_accounts',
            error_description: 'No accounts available after successful authentication',
        };
    }

    return data;
}
```

### 3. Session Storage Structure

**sessionStorage:**

```json
{
    "auth_info": {
        "access_token": "a1-xxx",
        "token_type": "Bearer",
        "expires_in": 3600,
        "expires_at": 1738659600000,
        "scope": "read trade",
        "refresh_token": "r1-xxx"
    }
}
```

**localStorage:**

```json
{
    "active_loginid": "CR1234567",
    "account_type": "real",
    "accountsList": "[{...}]",
    "clientAccounts": "{...}",
    "authToken": "a1-xxx"
}
```

---

## Token Management

### Access Token Retrieval

```typescript
// Get current access token
const token = OAuthTokenExchangeService.getAccessToken();

// Check if authenticated
const isAuth = OAuthTokenExchangeService.isAuthenticated();
```

### Token Expiration

Tokens are automatically checked for expiration:

```typescript
static getAuthInfo(): AuthInfo | null {
    const authInfo = JSON.parse(sessionStorage.getItem('auth_info'));

    // Check if token is expired
    if (authInfo.expires_at && Date.now() >= authInfo.expires_at) {
        this.clearAuthInfo();
        return null;
    }

    return authInfo;
}
```

---

## Logout Flow

### 1. User-Initiated Logout

**File:** [`src/hooks/useLogout.ts`](../src/hooks/useLogout.ts:1)

```typescript
export const useLogout = () => {
    const { client } = useStore() ?? {};

    return useCallback(async () => {
        try {
            // Call client store logout method
            await client?.logout();

            // Note: Analytics.reset() removed - Analytics package removed from project
            // See migrate-docs/MONITORING_PACKAGES.md for re-enabling if needed
        } catch (error) {
            console.error('Logout failed:', error);

            // Fallback: Clear only auth-related storage keys
            // This preserves user preferences (theme, language, etc.)
            try {
                // Clear auth-related sessionStorage
                sessionStorage.removeItem('auth_info');

                // Clear auth-related localStorage
                localStorage.removeItem('active_loginid');
                localStorage.removeItem('authToken');
                localStorage.removeItem('accountsList');
                localStorage.removeItem('clientAccounts');
                localStorage.removeItem('account_type');
            } catch (storageError) {
                console.error('Failed to clear auth storage:', storageError);

                // Last resort: clear all storage
                try {
                    sessionStorage.clear();
                    localStorage.clear();
                } catch (finalError) {
                    console.error('Failed to clear all storage:', finalError);
                }
            }
        }
    }, [client]);
};
```

### 2. ClientStore Logout Method

**File:** [`src/stores/client-store.ts`](../src/stores/client-store.ts:243)

```typescript
logout = async () => {
    if (localStorage.getItem('active_loginid')) {
        // 1. Clear DerivAPI singleton and close WebSocket
        const { clearDerivApiInstance } = await import('@/external/bot-skeleton/services/api/appId');
        clearDerivApiInstance();

        // 2. Clear accounts cache
        const { DerivWSAccountsService } = await import('@/services/derivws-accounts.service');
        DerivWSAccountsService.clearStoredAccounts();
        DerivWSAccountsService.clearCache();

        // 3. Clear OAuth token
        const { OAuthTokenExchangeService } = await import('@/services/oauth-token-exchange.service');
        OAuthTokenExchangeService.clearAuthInfo();

        // 4. Reset all states
        this.account_list = [];
        this.accounts = {};
        this.is_logged_in = false;
        this.loginid = '';
        this.balance = '0';
        this.currency = 'USD';
        this.all_accounts_balance = null;

        // 5. Clear storage
        localStorage.removeItem('active_loginid');
        localStorage.removeItem('accountsList');
        localStorage.removeItem('authToken');
        localStorage.removeItem('clientAccounts');
        localStorage.removeItem('account_type');
        sessionStorage.clear();

        // 6. Clear cookies
        removeCookies('client_information');

        // 7. Reset observables
        setIsAuthorized(false);
        setAccountList([]);
        setAuthData(null);

        // 8. Disable live chat
        window.LC_API?.close_chat?.();
        window.LiveChatWidget?.call('hide');

        // 9. Shutdown Intercom
        if (window.Intercom) {
            window.Intercom('shutdown');
            window.DerivInterCom.initialize({
                hideLauncher: true,
                token: null,
            });
        }
    }
};
```

### 3. Auth Error Logout

**File:** [`src/app/CoreStoreProvider.tsx`](../src/app/CoreStoreProvider.tsx:115)

```typescript
// Handle auth errors by calling client.logout() directly
// This prevents redundant logout operations since useLogout internally calls client.logout()
if (error?.code === 'AuthorizationRequired' || error?.code === 'DisabledClient' || error?.code === 'InvalidToken') {
    // Clear all URL query parameters for these auth errors
    clearInvalidTokenParams();

    // Call client store logout directly to avoid double logout
    await client?.logout();
}
```

---

## Invalid Token Handling

### Hook Implementation

**File:** [`src/hooks/useInvalidTokenHandler.ts`](../src/hooks/useInvalidTokenHandler.ts:1)

```typescript
const handleInvalidToken = async () => {
    try {
        // 1. Clear invalid session data to prevent infinite reload loop
        sessionStorage.removeItem('auth_info');
        localStorage.removeItem('active_loginid');
        localStorage.removeItem('authToken');
        localStorage.removeItem('accountsList');
        localStorage.removeItem('clientAccounts');

        // 2. Clear sessionStorage completely
        sessionStorage.clear();

        // 3. Redirect to OAuth login instead of reload
        const { generateOAuthURL } = await import('@/components/shared');
        const oauthUrl = await generateOAuthURL();

        if (oauthUrl) {
            // Use replace to prevent back button from returning to invalid state
            window.location.replace(oauthUrl);
        } else {
            // Fallback: reload if OAuth URL generation fails
            console.error('Failed to generate OAuth URL, falling back to reload');
            window.location.reload();
        }
    } catch (error) {
        console.error('Error handling invalid token:', error);
        // Last resort: reload the page
        window.location.reload();
    }
};
```

### Why This Approach?

**Previous Implementation (❌ Caused Infinite Loop):**

```typescript
// Old code - WRONG
const handleInvalidToken = () => {
    window.location.reload(); // ❌ Infinite loop if token is truly invalid
};
```

**New Implementation (✅ Correct):**

1. Clears invalid auth data
2. Redirects to OAuth login for fresh authentication
3. Uses `window.location.replace()` to prevent back button issues
4. Has fallback error handling

---

## Key Components

### 1. OAuthTokenExchangeService

**Location:** [`src/services/oauth-token-exchange.service.ts`](../src/services/oauth-token-exchange.service.ts:1)

**Responsibilities:**

- Exchange authorization code for access token
- Store and retrieve auth info from sessionStorage
- Check token expiration
- Refresh access tokens
- Auto-initialize WebSocket after token exchange

**Key Methods:**

- `exchangeCodeForToken(code: string)` - Exchange code for token
- `getAuthInfo()` - Get stored auth info
- `getAccessToken()` - Get current access token
- `isAuthenticated()` - Check if user is authenticated
- `clearAuthInfo()` - Clear auth info from storage

### 2. useLogout Hook

**Location:** [`src/hooks/useLogout.ts`](../src/hooks/useLogout.ts:1)

**Responsibilities:**

- Provide logout functionality to components
- Handle logout errors with fallback storage clearing
- Preserve user preferences during error scenarios

**Usage:**

```typescript
const handleLogout = useLogout();

// In component
<button onClick={handleLogout}>Logout</button>
```

### 3. useInvalidTokenHandler Hook

**Location:** [`src/hooks/useInvalidTokenHandler.ts`](../src/hooks/useInvalidTokenHandler.ts:1)

**Responsibilities:**

- Listen for 'InvalidToken' events from API
- Clear invalid auth data
- Redirect to OAuth login

**Usage:**

```typescript
// In component
useInvalidTokenHandler();
```

### 4. ClientStore

**Location:** [`src/stores/client-store.ts`](../src/stores/client-store.ts:1)

**Responsibilities:**

- Manage client state (accounts, balance, currency)
- Handle logout operations
- Clear all auth-related data
- Reset observables and external services

---

## Error Handling

### 1. Token Exchange Errors

```typescript
// Error response structure
{
    error: 'no_accounts' | 'account_fetch_failed' | 'network_error',
    error_description: 'Detailed error message'
}
```

**Handled Errors:**

- `no_accounts` - No accounts returned after authentication
- `account_fetch_failed` - Failed to fetch accounts from API
- `network_error` - Network or parsing error during token exchange

### 2. Logout Errors

**Three-tier fallback:**

1. **Primary:** Call `client.logout()`
2. **Fallback 1:** Clear only auth-related storage keys
3. **Fallback 2:** Clear all storage (last resort)

```typescript
try {
    await client?.logout();
} catch (error) {
    try {
        // Clear only auth keys
        sessionStorage.removeItem('auth_info');
        localStorage.removeItem('active_loginid');
        // ... other auth keys
    } catch (storageError) {
        try {
            // Last resort: clear everything
            sessionStorage.clear();
            localStorage.clear();
        } catch (finalError) {
            console.error('Failed to clear all storage:', finalError);
        }
    }
}
```

### 3. Invalid Token Errors

**Handled by:** [`useInvalidTokenHandler`](../src/hooks/useInvalidTokenHandler.ts:1)

**Flow:**

1. Detect 'InvalidToken' event
2. Clear invalid auth data
3. Redirect to OAuth login
4. Fallback to reload if OAuth URL generation fails

---

## Security Considerations

### ✅ Security Features Maintained

1. **OAuth PKCE Flow** - Code verifier/challenge mechanism intact
2. **Token Storage** - Access tokens stored in sessionStorage (cleared on tab close)
3. **Token Expiration** - Automatic expiration checking
4. **Secure Logout** - Complete cleanup of auth data
5. **No XSS Vulnerabilities** - Proper token handling

### ⚠️ Security Notes

1. **sessionStorage vs localStorage:**
    - `sessionStorage` - Used for access tokens (more secure, cleared on tab close)
    - `localStorage` - Used for account info (persists across tabs)

2. **Token Refresh:**
    - Refresh tokens stored in sessionStorage
    - Automatic refresh not yet implemented (future enhancement)

---

## Comparison: Old vs New Flow

### Old Flow (Before Refactoring)

```
Login → useOauth2 → whoami.service → logout.service → Complex state management
```

**Issues:**

- 763 lines of code
- Multiple redundant services
- Complex state synchronization
- Difficult to maintain

### New Flow (After Refactoring)

```
Login → OAuthTokenExchangeService → useLogout → ClientStore → Simple state management
```

**Benefits:**

- -763 lines of code
- Single responsibility per component
- Simplified state management
- Easy to maintain and test

---

## Testing Recommendations

### Unit Tests Needed

1. **useLogout.spec.ts**
    - Test successful logout
    - Test logout error handling
    - Test storage clearing fallbacks

2. **useInvalidTokenHandler.spec.ts**
    - Test invalid token detection
    - Test OAuth redirect
    - Test fallback reload

3. **oauth-token-exchange.service.spec.ts**
    - Test token exchange
    - Test token expiration
    - Test error handling

### Integration Tests Needed

1. **Full authentication flow**
2. **Logout from different states**
3. **Invalid token recovery**

---

## Related Documentation

- [PKCE Implementation](./PKCE_IMPLEMENTATION.md)
- [WebSocket Connection Flow](./WEBSOCKET_CONNECTION_FLOW.md)
- [Monitoring Packages](./MONITORING_PACKAGES.md)
- [Original Authentication Flow](./AUTHENTICATION_FLOW.md) (deprecated)

---

## Changelog

### 2026-02-04 - Initial Revised Documentation

- Documented new simplified authentication flow
- Removed references to deleted services
- Added error handling documentation
- Added security considerations

---

## Future Enhancements

1. **Automatic Token Refresh** - Implement refresh token flow
2. **Centralized Error Logging** - Add error reporting service (Sentry, TrackJS)
3. **Test Coverage** - Add comprehensive unit and integration tests
4. **Session Timeout** - Add automatic logout on inactivity
5. **Multi-tab Synchronization** - Sync logout across tabs
