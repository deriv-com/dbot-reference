# Authentication Guide

Complete documentation of the OAuth 2.0 authentication system with PKCE, token management, session handling, and logout flows.

## Table of Contents

- [Overview](#overview)
- [Authentication Flow](#authentication-flow)
- [PKCE Implementation](#pkce-implementation)
- [Token Exchange](#token-exchange)
- [Token Management](#token-management)
- [Session Storage Structure](#session-storage-structure)
- [Logout Flow](#logout-flow)
- [Invalid Token Handling](#invalid-token-handling)
- [Session Management](#session-management)
- [Security Considerations](#security-considerations)
- [Key Files Reference](#key-files-reference)
- [Debugging Authentication](#debugging-authentication)
- [Testing](#testing)

---

## Overview

The application uses **OAuth 2.0 with PKCE** (Proof Key for Code Exchange) for authentication. This is a secure flow designed for single-page applications (SPAs) that cannot safely store client secrets.

### Key Components

| Component                      | File                                           | Responsibility                    |
| ------------------------------ | ---------------------------------------------- | --------------------------------- |
| OAuth callback handling        | `src/hooks/useOAuthCallback.ts`                | Extract & validate OAuth params from URL |
| OAuth URL generation           | `src/components/shared/utils/config/config.ts` | Generate login URL with PKCE      |
| Token exchange                 | `src/services/oauth-token-exchange.service.ts`  | Exchange auth code for tokens     |
| Account management             | `src/services/derivws-accounts.service.ts`     | Fetch and store user accounts     |
| Client state                   | `src/stores/client-store.ts`                   | Manage auth state in MobX         |
| Logout hook                    | `src/hooks/useLogout.ts`                       | Handle logout operations          |
| Invalid token handler          | `src/hooks/useInvalidTokenHandler.ts`          | Detect and recover from bad tokens|
| API bridge                     | `src/app/CoreStoreProvider.tsx`                | Bridge API events to MobX stores  |
| App (OAuth orchestrator)       | `src/app/App.tsx`                              | Orchestrates callback + token exchange |

> **Note:** There is no separate callback page. The OAuth provider redirects back to the root URL (`/`) with query parameters (`?code=...&state=...`). The `App` component handles the callback inline using the `useOAuthCallback` hook.

---

## Authentication Flow

### Complete Flow Diagram

```
1. User clicks "Login"
   ├── Generate code_verifier (random string)
   ├── Generate code_challenge = SHA256(code_verifier)
   ├── Store code_verifier in sessionStorage
   └── Redirect to OAuth server with code_challenge
                    ↓
2. User authenticates on OAuth server
   └── Enters credentials, completes verification
                    ↓
3. OAuth server redirects back to root URL
   └── /?code=AUTHORIZATION_CODE&state=CSRF_TOKEN
                    ↓
4. App.tsx processes callback (via useOAuthCallback hook)
   ├── Extract code and state from URL query params
   ├── Validate CSRF token (state parameter)
   └── Return validated authorization code
                    ↓
5. Token Exchange (triggered by App.tsx useEffect)
   ├── Call OAuthTokenExchangeService.exchangeCodeForToken(code)
   ├── Retrieve code_verifier from sessionStorage
   ├── POST to token endpoint: code + code_verifier
   ├── Receive access_token + refresh_token
   ├── Store auth_info in sessionStorage
   └── Clean up URL query params via cleanupURL()
                    ↓
6. Account Initialization (auto-triggered by token exchange)
   ├── Fetch accounts list from DerivWS API
   ├── Store accounts in sessionStorage
   ├── Set first account as active in localStorage
   └── Determine account type (demo/real)
                    ↓
7. WebSocket Connection
   ├── Initialize WebSocket with authenticated endpoint
   ├── Call api_base.init(true) to force new connection
   ├── Authorize via balance API call
   └── Subscribe to streams (balance, transactions, proposals)
                    ↓
8. User is fully authenticated
   └── UI updates via MobX stores
```

### Step-by-Step Implementation

#### Step 1: Login Button Click

**File:** `src/components/layout/header/header.tsx`

```typescript
const handleLogin = useCallback(async () => {
    setIsAuthorizing(true);
    const oauthUrl = await generateOAuthURL(); // Async - generates PKCE params
    if (oauthUrl) {
        window.location.replace(oauthUrl);
    }
}, [setIsAuthorizing]);
```

#### Step 2: OAuth URL Generation with PKCE

**File:** `src/components/shared/utils/config/config.ts`

```typescript
export const generateOAuthURL = async () => {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store code verifier for later token exchange
    storeCodeVerifier(codeVerifier);

    // Build OAuth URL
    const oauthUrl = `${hostname}auth?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
        `state=${csrfToken}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256`;

    return oauthUrl;
};
```

#### Step 3: OAuth Callback Handling (Inline — No Separate Page)

**Hook:** `src/hooks/useOAuthCallback.ts`
**Orchestrator:** `src/app/App.tsx`

After the user authenticates, the OAuth server redirects back to the root URL (`/`) with query parameters. There is **no separate callback page** — the `App` component handles this inline:

1. The `useOAuthCallback` hook extracts `code`, `state`, and `error` from URL query params
2. Validates the CSRF token (`state` parameter) against the stored value
3. If valid, returns the authorization code to `App.tsx`
4. `App.tsx` triggers the token exchange in a `useEffect`
5. After processing, `cleanupURL()` removes the OAuth params from the URL

```typescript
// src/app/App.tsx
function App() {
    const { isProcessing, isValid, params, error, cleanupURL } = useOAuthCallback();

    useAccountSwitching();

    React.useEffect(() => {
        if (!isProcessing && isValid && params.code) {
            OAuthTokenExchangeService.exchangeCodeForToken(params.code)
                .then(response => {
                    if (response.access_token) {
                        cleanupURL();
                    } else if (response.error) {
                        console.error('Token exchange failed:', response.error);
                        cleanupURL();
                    }
                })
                .catch(error => {
                    console.error('Token exchange request failed:', error);
                    cleanupURL();
                });
        }
    }, [isProcessing, isValid, params.code, error, cleanupURL]);

    return <RouterProvider router={router} />;
}
```

#### Step 4: Token Exchange

**File:** `src/services/oauth-token-exchange.service.ts`

```typescript
static async exchangeCodeForToken(code: string): Promise<TokenExchangeResponse> {
    // Retrieve PKCE code verifier
    const codeVerifier = getCodeVerifier();

    // Exchange authorization code for access token
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

    const data = await response.json();

    // Store auth info
    const authInfo = {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        expires_at: Date.now() + (data.expires_in || 3600) * 1000,
        scope: data.scope,
        refresh_token: data.refresh_token,
    };
    sessionStorage.setItem('auth_info', JSON.stringify(authInfo));

    // Clear PKCE code verifier
    clearCodeVerifier();

    // Auto-initialize: fetch accounts and set up WebSocket
    const accounts = await DerivWSAccountsService.fetchAccountsList(data.access_token);
    if (accounts?.length > 0) {
        DerivWSAccountsService.storeAccounts(accounts);
        localStorage.setItem('active_loginid', accounts[0].account_id);
        localStorage.setItem('account_type', accounts[0].account_id.startsWith('VRT') ? 'demo' : 'real');

        const { api_base } = await import('@/external/bot-skeleton');
        await api_base.init(true);
    }

    return data;
}
```

---

## PKCE Implementation

PKCE (RFC 7636) adds security to the OAuth flow by preventing authorization code interception attacks.

### How It Works

1. **Code Verifier** - A cryptographically random string (32 bytes, base64url-encoded = 43 characters)
2. **Code Challenge** - SHA-256 hash of the code verifier, sent with the authorization request
3. **Verification** - The authorization server verifies the code verifier matches the challenge during token exchange

### PKCE Helper Functions

| Function                  | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `generateCodeVerifier()`  | Creates a 43-character random string            |
| `generateCodeChallenge()` | Computes SHA-256 hash, returns base64url string |
| `storeCodeVerifier()`     | Stores verifier in sessionStorage with timestamp|
| `getCodeVerifier()`       | Retrieves verifier (validates not expired)       |
| `clearCodeVerifier()`     | Removes verifier after successful exchange      |

### Expiration

Both PKCE code verifier and CSRF token expire after **10 minutes** (600,000 milliseconds). If the user takes longer than 10 minutes to authenticate, the flow must be restarted.

### Browser Compatibility

PKCE uses these Web APIs (supported in all modern browsers):

- `crypto.getRandomValues()` - Random byte generation
- `crypto.subtle.digest()` - SHA-256 hashing (requires HTTPS in production)
- `TextEncoder` - String to byte conversion

---

## Token Exchange

### Token Exchange Service

**File:** `src/services/oauth-token-exchange.service.ts`

The `OAuthTokenExchangeService` class provides:

| Method                       | Description                              |
| ---------------------------- | ---------------------------------------- |
| `exchangeCodeForToken(code)` | Exchange authorization code for tokens   |
| `getAuthInfo()`              | Retrieve stored auth info (checks expiry)|
| `getAccessToken()`           | Get current access token                 |
| `isAuthenticated()`          | Check if user has valid token            |
| `clearAuthInfo()`            | Clear all auth data from storage         |

### Token Expiration Handling

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

### Error Responses

| Error Code             | Description                               | Recovery                |
| ---------------------- | ----------------------------------------- | ----------------------- |
| `no_accounts`          | No accounts returned after auth           | Fallback to default     |
| `account_fetch_failed` | Failed to fetch accounts from API         | Retry or re-authenticate|
| `network_error`        | Network or parsing error during exchange  | Retry with backoff      |
| `invalid_request`      | PKCE code verifier not found or expired   | Restart login flow      |

---

## Token Management

### Access Token Retrieval

```typescript
// Get current access token
const token = OAuthTokenExchangeService.getAccessToken();

// Check if user is authenticated
const isAuth = OAuthTokenExchangeService.isAuthenticated();
```

### Automatic Expiration

Tokens are automatically checked for expiration on every `getAuthInfo()` call. If expired, the auth info is cleared and `null` is returned.

---

## Session Storage Structure

### sessionStorage (Cleared on Tab Close)

```json
{
    "auth_info": {
        "access_token": "ory_at_xxx",
        "token_type": "bearer",
        "expires_in": 2591999,
        "expires_at": 1738659600000,
        "scope": "read trade",
        "refresh_token": "ory_rt_xxx"
    },
    "oauth_code_verifier": "random_43_char_string",
    "oauth_code_verifier_timestamp": "1738567890123",
    "oauth_csrf_token": "random_csrf_token",
    "oauth_csrf_token_timestamp": "1738567890123",
    "deriv_accounts": [
        {
            "account_id": "CR1234567",
            "balance": "1000.00",
            "currency": "USD",
            "group": "real",
            "status": "active",
            "account_type": "real"
        }
    ]
}
```

### localStorage (Persists Across Tabs)

```json
{
    "active_loginid": "CR1234567",
    "account_type": "real",
    "accountsList": "[{...}]",
    "clientAccounts": "{...}",
    "authToken": "ory_at_xxx"
}
```

**Security note:** Access tokens are stored in `sessionStorage` (more secure, cleared on tab close). Account identifiers are stored in `localStorage` (persists across tabs for multi-tab support).

---

## Logout Flow

### User-Initiated Logout

**File:** `src/hooks/useLogout.ts`

```typescript
export const useLogout = () => {
    const { client } = useStore() ?? {};

    return useCallback(async () => {
        try {
            await client?.logout();
        } catch (error) {
            // Fallback: clear auth-related storage keys
            sessionStorage.removeItem('auth_info');
            localStorage.removeItem('active_loginid');
            localStorage.removeItem('authToken');
            localStorage.removeItem('accountsList');
            localStorage.removeItem('clientAccounts');
            localStorage.removeItem('account_type');
        }
    }, [client]);
};
```

Usage in components:

```typescript
const handleLogout = useLogout();
<button onClick={handleLogout}>Log out</button>
```

### ClientStore Logout Method

**File:** `src/stores/client-store.ts`

The full logout sequence:

1. Clear DerivAPI singleton and close WebSocket connection
2. Clear accounts cache (`DerivWSAccountsService.clearStoredAccounts()`)
3. Clear OAuth token (`OAuthTokenExchangeService.clearAuthInfo()`)
4. Reset all MobX observable state
5. Clear localStorage and sessionStorage auth keys
6. Clear auth cookies
7. Reset RxJS observables (`setIsAuthorized(false)`, etc.)
8. Disable live chat widgets
9. Shutdown Intercom (if configured)

### Error-Triggered Logout

**File:** `src/app/CoreStoreProvider.tsx`

Auth errors from WebSocket messages trigger automatic logout:

```typescript
if (error?.code === 'AuthorizationRequired' ||
    error?.code === 'DisabledClient' ||
    error?.code === 'InvalidToken') {
    clearInvalidTokenParams();
    await client?.logout();
}
```

### Three-Tier Fallback

Logout has a resilient fallback strategy:

1. **Primary:** Call `client.logout()` (full cleanup)
2. **Fallback 1:** Clear only auth-related storage keys (preserves preferences)
3. **Fallback 2:** Clear all storage (last resort)

---

## Invalid Token Handling

**File:** `src/hooks/useInvalidTokenHandler.ts`

When the API detects an invalid token, the global observer emits an `InvalidToken` event:

```typescript
const handleInvalidToken = async () => {
    // 1. Clear invalid session data
    sessionStorage.removeItem('auth_info');
    localStorage.removeItem('active_loginid');
    localStorage.removeItem('authToken');
    localStorage.removeItem('accountsList');
    localStorage.removeItem('clientAccounts');
    sessionStorage.clear();

    // 2. Redirect to OAuth login (NOT reload)
    const { generateOAuthURL } = await import('@/components/shared');
    const oauthUrl = await generateOAuthURL();

    if (oauthUrl) {
        window.location.replace(oauthUrl); // replace prevents back-button issues
    } else {
        window.location.reload(); // fallback
    }
};
```

**Why redirect instead of reload?** A simple `window.location.reload()` with invalid tokens causes an infinite loop - the page reloads, tries to use the invalid token, fails, and reloads again. Redirecting to OAuth forces a fresh authentication.

---

## Session Management

### Session Validation Triggers

The application validates the user's session on:

- **Tab becomes visible** - When user returns to the tab after being away
- **Window gains focus** - When user switches back to the browser window
- **After account list is set** - After initial authentication completes

### WebSocket Regeneration

The WebSocket connection is regenerated when:

| Trigger                  | Action                                    |
| ------------------------ | ----------------------------------------- |
| Account switch           | New WebSocket with different account_id   |
| Tab returns with changed account | Detect mismatch, regenerate       |
| Connection lost          | Reconnect with current account            |
| OAuth login complete     | Switch from public to authenticated       |
| Page refresh             | Re-establish connection from storage      |

### Reconnection Strategy

The API layer tracks reconnection attempts with a maximum of **5 attempts**:

```typescript
reconnectIfNotConnected = () => {
    if (this.api?.connection?.readyState > 1) { // CLOSING or CLOSED
        this.reconnection_attempts += 1;

        if (this.reconnection_attempts >= 5) {
            // Reset session after too many failures
            this.reconnection_attempts = 0;
            setIsAuthorized(false);
            setAccountList([]);
            localStorage.removeItem('active_loginid');
            localStorage.removeItem('accountsList');
        }

        this.init(true); // Force new connection
    }
};
```

Network event listeners also trigger reconnection:

```typescript
window.addEventListener('online', this.reconnectIfNotConnected);
window.addEventListener('focus', this.reconnectIfNotConnected);
```

---

## Security Considerations

### Security Features

| Feature                | Implementation                                   |
| ---------------------- | ------------------------------------------------ |
| PKCE                   | Code verifier/challenge prevents code interception|
| CSRF Protection        | `state` parameter validated on callback          |
| Token in sessionStorage| Cleared on tab close (more secure than localStorage)|
| Token expiration       | Automatic expiry checking on every access        |
| Secure WebSocket       | Always uses WSS (WebSocket Secure) protocol      |
| Complete logout cleanup| All auth data cleared from all storage layers    |
| No XSS vulnerability   | Proper token handling, no inline scripts         |

### Important Notes

1. **sessionStorage vs localStorage:**
   - `sessionStorage` for sensitive tokens (cleared on tab close)
   - `localStorage` for account identifiers (needed for multi-tab support)

2. **Token refresh:** Refresh tokens are stored but automatic refresh is not yet implemented. Currently, expired tokens trigger re-authentication.

3. **PKCE expiration:** Code verifiers expire after 10 minutes. If the OAuth flow takes longer, the user must restart.

---

## Key Files Reference

### Core Authentication

| File                                       | Purpose                           |
| ------------------------------------------ | --------------------------------- |
| `src/app/App.tsx`                          | OAuth orchestrator + app entry    |
| `src/app/CoreStoreProvider.tsx`            | API-to-store bridge               |
| `src/hooks/useOAuthCallback.ts`            | OAuth callback param extraction & CSRF validation |

### Services

| File                                       | Purpose                           |
| ------------------------------------------ | --------------------------------- |
| `src/services/oauth-token-exchange.service.ts` | Token exchange and management |
| `src/services/derivws-accounts.service.ts`  | Account fetching and storage     |

### API Layer

| File                                       | Purpose                           |
| ------------------------------------------ | --------------------------------- |
| `src/external/bot-skeleton/services/api/api-base.ts` | WebSocket management    |
| `src/external/bot-skeleton/services/api/appId.js` | WebSocket instance creation |
| `src/external/bot-skeleton/services/api/observables/connection-status-stream.ts` | RxJS streams |

### Stores

| File                                       | Purpose                           |
| ------------------------------------------ | --------------------------------- |
| `src/stores/client-store.ts`               | Client state, logout, session     |
| `src/stores/root-store.ts`                 | Root store initialization         |

### Hooks

| File                                       | Purpose                           |
| ------------------------------------------ | --------------------------------- |
| `src/hooks/useOAuthCallback.ts`            | OAuth callback param extraction & CSRF validation |
| `src/hooks/useLogout.ts`                   | Logout handler for components     |
| `src/hooks/useInvalidTokenHandler.ts`      | Invalid token recovery            |
| `src/hooks/useAccountSwitching.ts`         | Account switching via URL params  |
| `src/hooks/useApiBase.ts`                  | API base access hook              |

### Configuration

| File                                       | Purpose                           |
| ------------------------------------------ | --------------------------------- |
| `src/components/shared/utils/config/config.ts` | PKCE helpers, OAuth URL gen  |
| `brand.config.json`                        | Auth endpoint URLs (do not change `auth2_url`) |

---

## Debugging Authentication

### Check Auth State

```javascript
// In browser console
console.log('Auth Info:', JSON.parse(sessionStorage.getItem('auth_info')));
console.log('Active Account:', localStorage.getItem('active_loginid'));
console.log('Account Type:', localStorage.getItem('account_type'));
console.log('PKCE Verifier:', sessionStorage.getItem('oauth_code_verifier'));
```

### Verify OAuth URL

When clicking Login, check the URL for PKCE parameters:

```
https://auth.deriv.com/oauth2/authorize?
    response_type=code&
    client_id=YOUR_CLIENT_ID&
    redirect_uri=https://localhost:8443/&
    state=CSRF_TOKEN&
    code_challenge=BASE64URL_HASH&        ← PKCE parameter
    code_challenge_method=S256            ← PKCE method
```

> Note: The redirect URI points to the root URL (`/`), not a `/callback` path. The `App` component handles the OAuth response inline.

### Verify Token Exchange

In the browser Network tab, look for the token exchange POST request:

- **URL:** Token endpoint
- **Method:** POST
- **Body:** Should include `code_verifier` parameter
- **Response:** Should contain `access_token`

### Common Issues

| Problem                         | Cause                          | Solution                        |
| ------------------------------- | ------------------------------ | ------------------------------- |
| Infinite redirect loop          | Invalid token + page reload    | Clear storage, redirect to OAuth|
| "PKCE code verifier not found"  | Expired after 10 minutes       | Restart login flow              |
| "No accounts available"         | No trading accounts on server  | Check account status            |
| WebSocket auth fails            | Token expired during session   | Token exchange triggers re-auth |
| Login works but state not updated| CoreStoreProvider not bridging | Check observable subscriptions  |

---

## Testing

### Manual Testing Checklist

- [ ] Click Login - verify redirect to Deriv OAuth provider
- [ ] Complete OAuth - verify redirect back to root URL (`/`) with `?code=...&state=...` params
- [ ] Check sessionStorage for `auth_info` with valid token
- [ ] Check localStorage for `active_loginid`
- [ ] Verify WebSocket connects with authenticated endpoint
- [ ] Verify balance and account info appear in UI
- [ ] Switch accounts - verify WebSocket regenerates
- [ ] Click Logout - verify all storage cleared
- [ ] Verify redirect to logged-out state
- [ ] Close and reopen tab - verify session cleared (sessionStorage)
- [ ] Test with expired token - verify re-authentication flow
- [ ] Test with invalid token - verify redirect to OAuth (not infinite loop)

### PKCE Verification

1. Click Login
2. Check `sessionStorage` for `oauth_code_verifier`
3. Verify OAuth URL contains `code_challenge` and `code_challenge_method=S256`
4. Complete OAuth flow
5. Verify token exchange request includes `code_verifier`
6. Confirm `oauth_code_verifier` is cleared after successful exchange
7. Verify `auth_info` in sessionStorage has `expires_at` timestamp

### Unit Tests Needed

| Test File                              | What to Test                     |
| -------------------------------------- | -------------------------------- |
| `useLogout.spec.ts`                    | Successful logout, error fallbacks, storage clearing |
| `useInvalidTokenHandler.spec.ts`       | Token detection, OAuth redirect, fallback reload |
| `oauth-token-exchange.service.spec.ts` | Token exchange, expiration, errors |

---

## Future Enhancements

1. **Automatic Token Refresh** - Implement refresh token flow before expiration
2. **Session Timeout** - Add automatic logout on inactivity
3. **Multi-Tab Synchronization** - Sync logout across browser tabs
4. **Centralized Error Logging** - Integrate with error reporting service for auth failures
