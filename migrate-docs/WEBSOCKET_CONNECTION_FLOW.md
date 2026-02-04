# WebSocket Connection Flow Documentation

## Overview

This document describes how the WebSocket connection is established and how it switches from a public (unauthenticated) connection to an authenticated connection after OAuth login.

## Table of Contents

1. [WebSocket Connection Architecture](#websocket-connection-architecture)
2. [Connection Establishment](#connection-establishment)
3. [Public vs Authenticated Endpoints](#public-vs-authenticated-endpoints)
4. [OAuth Integration Flow](#oauth-integration-flow)
5. [Connection Regeneration](#connection-regeneration)
6. [Key Files and Functions](#key-files-and-functions)

---

## WebSocket Connection Architecture

The application uses WebSocket connections to communicate with the Deriv API. The connection can operate in two modes:

1. **Public Mode**: Unauthenticated connection for public data (e.g., active symbols, market data)
2. **Authenticated Mode**: Authenticated connection for user-specific operations (e.g., balance, trades, account info)

### Connection URL Format

**Public Connection:**
```
wss://{server}/public
```

**Authenticated Connection:**
```
wss://{server}/{account_type}?account_id={loginid}
```

Where:
- `{server}`: WebSocket server URL (e.g., `frontend.binaryws.com`)
- `{account_type}`: Either `real` or `demo` based on account type
- `{loginid}`: User's login ID (e.g., `CR1234567`)

---

## Connection Establishment

### 1. Initial Connection Creation

**File:** `src/external/bot-skeleton/services/api/appId.js`

```javascript
export const generateDerivApiInstance = () => {
    const cleanedServer = getSocketURL();
    const account_id = getAccountId();
    const account_type = getAccountType(account_id);
    
    // Build WebSocket URL
    let socket_url = `wss://${cleanedServer}/${account_type}`;
    
    // Add account_id query param for authenticated endpoints
    if (account_id) {
        socket_url += `?account_id=${account_id}`;
    }
    
    // Create WebSocket connection
    const deriv_socket = new WebSocket(socket_url);
    const deriv_api = new DerivAPIBasic({
        connection: deriv_socket,
        middleware: new APIMiddleware({}),
    });
    
    return deriv_api;
};
```

**Key Points:**
- `getSocketURL()` retrieves the WebSocket server from configuration
- `getAccountId()` checks localStorage for `active_loginid`
- `getAccountType()` determines if account is `real`, `demo`, or `public`
- If no account_id exists, defaults to `public` endpoint

### 2. API Base Initialization

**File:** `src/external/bot-skeleton/services/api/api-base.ts`

```typescript
async init(force_create_connection = false) {
    this.toggleRunButton(true);
    
    if (this.api) {
        this.unsubscribeAllSubscriptions();
    }
    
    // Create new connection if needed
    if (!this.api || this.api?.connection.readyState !== 1 || force_create_connection) {
        if (this.api?.connection) {
            ApiHelpers.disposeInstance();
            setConnectionStatus(CONNECTION_STATUS.CLOSED);
            this.api.disconnect();
            this.api.connection.removeEventListener('open', this.onsocketopen.bind(this));
            this.api.connection.removeEventListener('close', this.onsocketclose.bind(this));
        }
        
        // Generate new API instance (creates new WebSocket)
        this.api = generateDerivApiInstance();
        
        this.api?.connection.addEventListener('open', this.onsocketopen.bind(this));
        this.api?.connection.addEventListener('close', this.onsocketclose.bind(this));
    }
    
    // Initialize chart API
    chart_api.init(force_create_connection);
}
```

**Key Points:**
- `force_create_connection = true` forces a new WebSocket connection
- Event listeners are attached for `open` and `close` events
- Old connections are properly cleaned up before creating new ones

---

## Public vs Authenticated Endpoints

### Account Type Determination

**File:** `src/analytics/utils.ts`

```typescript
export const getAccountType = (loginid?: string): 'real' | 'demo' | 'public' => {
    if (!loginid) {
        return 'public';
    }
    
    // Check if loginid starts with 'VRT' or 'VRTC' for demo accounts
    if (loginid.startsWith('VRT') || loginid.startsWith('VRTC')) {
        return 'demo';
    }
    
    // Otherwise it's a real account
    return 'real';
};
```

### Endpoint Switching Logic

| Condition | Endpoint | Example URL |
|-----------|----------|-------------|
| No account_id in localStorage | Public | `wss://frontend.binaryws.com/public` |
| account_id starts with 'VRT' | Demo | `wss://frontend.binaryws.com/demo?account_id=VRTC1234` |
| account_id starts with 'CR', 'MF', etc. | Real | `wss://frontend.binaryws.com/real?account_id=CR1234567` |

---

## OAuth Integration Flow

### Complete OAuth to WebSocket Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Login"                                          │
│    - generateOAuthURL() creates OAuth URL with PKCE             │
│    - Stores code_verifier in sessionStorage                     │
│    - Redirects to OAuth server                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. User authenticates on OAuth server                           │
│    - User enters credentials                                    │
│    - OAuth server validates                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. OAuth callback with authorization code                       │
│    - Redirects to: /callback?code=xxx&state=yyy                │
│    - App validates CSRF token (state parameter)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Token Exchange (OAuthTokenExchangeService)                   │
│    - Retrieves code_verifier from sessionStorage                │
│    - Exchanges code + code_verifier for access_token            │
│    - Stores auth_info in sessionStorage                         │
│    {                                                             │
│      access_token: "ory_at_...",                                │
│      token_type: "bearer",                                      │
│      expires_in: 2591999,                                       │
│      expires_at: 1738567890123                                  │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Extract account_id from callback URL                         │
│    - URL contains: ?account_id=CR1234567&account_type=real     │
│    - Store in localStorage:                                     │
│      localStorage.setItem('active_loginid', 'CR1234567')       │
│      localStorage.setItem('account_type', 'real')              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. WebSocket Connection Switch                                  │
│    BEFORE: wss://frontend.binaryws.com/public                  │
│                                                                  │
│    - Call: api_base.init(true)  // Force new connection        │
│    - generateDerivApiInstance() reads account_id from storage   │
│    - Creates new WebSocket with authenticated endpoint          │
│                                                                  │
│    AFTER: wss://frontend.binaryws.com/real?account_id=CR123456│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Authorization and Subscription                               │
│    - api_base.authorizeAndSubscribe()                          │
│    - Calls balance API to verify authentication                 │
│    - Subscribes to: balance, transaction, proposal_open_contract│
│    - Sets isAuthorized = true                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. User is fully authenticated                                  │
│    - All API calls use authenticated WebSocket                  │
│    - User can trade, check balance, view history, etc.         │
└─────────────────────────────────────────────────────────────────┘
```

### Current Implementation in api-base.ts

**File:** `src/external/bot-skeleton/services/api/api-base.ts`

```typescript
onsocketopen() {
    setConnectionStatus(CONNECTION_STATUS.OPENED);
    this.reconnection_attempts = 0;
    
    const currentClientStore = globalObserver.getState('client.store');
    if (currentClientStore) {
        currentClientStore.setIsAccountRegenerating(false);
    }
    
    // Handle OAuth callback
    this.handleTokenExchangeIfNeeded();
}

private async handleTokenExchangeIfNeeded() {
    const urlParams = new URLSearchParams(window.location.search);
    const account_id = urlParams.get('account_id');
    const accountType = urlParams.get('account_type');
    
    // Store account information
    if (account_id) {
        localStorage.setItem('active_loginid', account_id);
        removeUrlParameter('account_id');
    }
    if (accountType) {
        localStorage.setItem('account_type', accountType);
        removeUrlParameter('account_type');
    }
    
    // Authorize if we have an account_id
    if (getAccountId()) {
        setIsAuthorizing(true);
        await this.authorizeAndSubscribe();
    }
}
```

### ⚠️ Current Issue

The current implementation has a potential issue:

1. Initial WebSocket is created with **public** endpoint
2. After OAuth callback, `account_id` is stored in localStorage
3. `authorizeAndSubscribe()` is called on the **existing public WebSocket**
4. The WebSocket is **NOT regenerated** with the authenticated endpoint

### ✅ Recommended Fix

After storing auth_info and account_id, regenerate the WebSocket connection:

```typescript
private async handleTokenExchangeIfNeeded() {
    const urlParams = new URLSearchParams(window.location.search);
    const account_id = urlParams.get('account_id');
    const accountType = urlParams.get('account_type');
    
    if (account_id) {
        localStorage.setItem('active_loginid', account_id);
        removeUrlParameter('account_id');
    }
    if (accountType) {
        localStorage.setItem('account_type', accountType);
        removeUrlParameter('account_type');
    }
    
    // If we have an account_id, regenerate WebSocket with authenticated endpoint
    if (getAccountId()) {
        setIsAuthorizing(true);
        
        // Force regenerate WebSocket connection with authenticated endpoint
        await this.init(true);
        
        // Now authorize on the new authenticated connection
        await this.authorizeAndSubscribe();
    }
}
```

---

## Connection Regeneration

### When WebSocket Regeneration Occurs

1. **Account Switch**: User switches between accounts
2. **Tab Focus**: User returns to tab after being away (checks if account changed)
3. **Connection Lost**: WebSocket connection is closed/lost
4. **Manual Refresh**: User manually refreshes the page
5. **OAuth Login**: After successful OAuth authentication

### Account Switch Flow

**File:** `src/stores/client-store.ts`

```typescript
async regenerateWebSocket() {
    if (this.is_regenerating) return;
    
    this.is_regenerating = true;
    this.setIsAccountRegenerating(true);
    
    try {
        const active_login_id = getAccountId();
        
        if (active_login_id && active_login_id !== this.ws_login_id) {
            // Clear existing data
            this.clearAccountData();
            
            // Force create new connection with new account
            await api_base.init(true);
            
            // Update tracked login ID
            this.setWebSocketLoginId(active_login_id);
        }
    } catch (error) {
        console.error('WebSocket regeneration failed:', error);
        this.setIsAccountRegenerating(false);
        this.is_regenerating = false;
    }
}
```

### Reconnection Logic

**File:** `src/external/bot-skeleton/services/api/api-base.ts`

```typescript
reconnectIfNotConnected = () => {
    console.log('connection state: ', this.api?.connection?.readyState);
    
    if (this.api?.connection?.readyState && this.api?.connection?.readyState > 1) {
        console.log('Info: Connection to the server was closed, trying to reconnect.');
        
        this.reconnection_attempts += 1;
        
        // After 5 failed attempts, reset session
        if (this.reconnection_attempts >= this.MAX_RECONNECTION_ATTEMPTS) {
            this.reconnection_attempts = 0;
            
            // Clear auth data
            setIsAuthorized(false);
            setAccountList([]);
            setAuthData(null);
            
            // Clear storage
            localStorage.removeItem('active_loginid');
            localStorage.removeItem('account_type');
            localStorage.removeItem('accountsList');
            localStorage.removeItem('clientAccounts');
        }
        
        // Attempt reconnection
        this.init(true);
    }
};
```

---

## Key Files and Functions

### Core Files

| File | Purpose |
|------|---------|
| `src/external/bot-skeleton/services/api/appId.js` | WebSocket connection creation |
| `src/external/bot-skeleton/services/api/api-base.ts` | API initialization and management |
| `src/services/oauth-token-exchange.service.ts` | OAuth token exchange |
| `src/components/shared/utils/config/config.ts` | PKCE and OAuth URL generation |
| `src/stores/client-store.ts` | Client state and WebSocket regeneration |

### Key Functions

#### WebSocket Creation
- `generateDerivApiInstance()` - Creates WebSocket connection
- `getSocketURL()` - Gets WebSocket server URL
- `getAccountId()` - Retrieves account_id from localStorage
- `getAccountType()` - Determines account type (real/demo/public)

#### Connection Management
- `api_base.init(force_create_connection)` - Initialize/regenerate connection
- `api_base.authorizeAndSubscribe()` - Authorize and subscribe to streams
- `api_base.reconnectIfNotConnected()` - Handle reconnection
- `client_store.regenerateWebSocket()` - Regenerate on account switch

#### OAuth Integration
- `generateOAuthURL()` - Generate OAuth URL with PKCE
- `OAuthTokenExchangeService.exchangeCodeForToken()` - Exchange code for token
- `handleTokenExchangeIfNeeded()` - Handle OAuth callback

---

## WebSocket States

### Connection States

```typescript
const socket_state = {
    [WebSocket.CONNECTING]: 'Connecting',  // 0
    [WebSocket.OPEN]: 'Connected',         // 1
    [WebSocket.CLOSING]: 'Closing',        // 2
    [WebSocket.CLOSED]: 'Closed',          // 3
};
```

### Application States

```typescript
enum CONNECTION_STATUS {
    OPENED = 'opened',
    CLOSED = 'closed',
}
```

---

## Best Practices

### 1. Always Force Regenerate After OAuth

After successful OAuth authentication, always regenerate the WebSocket:

```typescript
// Store account_id
localStorage.setItem('active_loginid', account_id);

// Force regenerate WebSocket with authenticated endpoint
await api_base.init(true);

// Then authorize
await api_base.authorizeAndSubscribe();
```

### 2. Clean Up Old Connections

Before creating a new connection, always clean up the old one:

```typescript
if (this.api?.connection) {
    ApiHelpers.disposeInstance();
    this.api.disconnect();
    this.api.connection.removeEventListener('open', this.onsocketopen);
    this.api.connection.removeEventListener('close', this.onsocketclose);
}
```

### 3. Handle Reconnection Gracefully

Implement exponential backoff and maximum retry limits:

```typescript
if (this.reconnection_attempts >= this.MAX_RECONNECTION_ATTEMPTS) {
    // Reset session after too many failures
    this.clearAuthData();
}
```

### 4. Track WebSocket Login ID

Always track which account the WebSocket is connected with:

```typescript
currentClientStore.setWebSocketLoginId(active_login_id);
```

This prevents issues when switching accounts or tabs.

---

## Debugging

### Check Current WebSocket URL

```javascript
// In browser console
console.log(api_base.api?.connection?.url);
```

### Check Connection State

```javascript
// In browser console
console.log(api_base.getConnectionStatus());
```

### Check Account Information

```javascript
// In browser console
console.log('Account ID:', localStorage.getItem('active_loginid'));
console.log('Account Type:', localStorage.getItem('account_type'));
console.log('Auth Info:', sessionStorage.getItem('auth_info'));
```

### Monitor WebSocket Messages

```javascript
// Add in api-base.ts for debugging
this.api?.onMessage().subscribe((message) => {
    console.log('WS Message:', message);
});
```

---

## Security Considerations

1. **PKCE Protection**: Code verifier is stored in sessionStorage and cleared after use
2. **CSRF Protection**: State parameter validates OAuth callback
3. **Token Expiration**: auth_info includes expires_at timestamp
4. **Secure WebSocket**: Always use WSS (WebSocket Secure) protocol
5. **Account Validation**: Server validates account_id in WebSocket URL

---

## References

- [Deriv API Documentation](https://api.deriv.com/)
- [WebSocket API Specification](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [OAuth 2.0 with PKCE](https://tools.ietf.org/html/rfc7636)
- [PKCE Implementation Documentation](./PKCE_IMPLEMENTATION.md)
