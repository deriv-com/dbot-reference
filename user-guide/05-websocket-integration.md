# WebSocket Integration Guide

Complete documentation for the WebSocket connection system, including public and authenticated endpoints, the DerivWS API flow, connection management, and real-time data subscriptions.

## Table of Contents

- [Overview](#overview)
- [Connection Architecture](#connection-architecture)
- [Connection Establishment](#connection-establishment)
- [Public vs Authenticated Endpoints](#public-vs-authenticated-endpoints)
- [Authenticated WebSocket URL Flow (DerivWS)](#authenticated-websocket-url-flow-derivws)
- [OAuth to WebSocket Flow](#oauth-to-websocket-flow)
- [Connection Management](#connection-management)
- [Observable Streams](#observable-streams)
- [Configuration](#configuration)
- [Debugging](#debugging)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

---

## Overview

The application uses WebSocket connections to communicate with the Deriv API for real-time trading data and operations. The connection operates in two modes:

| Mode              | Purpose                                | How URL Is Obtained                              |
| ----------------- | -------------------------------------- | ------------------------------------------------ |
| **Public**        | Market data, active symbols            | Static URL from `brand.config.json` derivws config |
| **Authenticated** | Balance, trades, account operations    | Dynamic URL fetched from DerivWS OTP API endpoint  |

When a user logs in, the system fetches a dynamic authenticated WebSocket URL from the DerivWS API (with OTP) and creates a new connection, replacing the public one.

> **Important:** The `derivws` URLs in `brand.config.json` must remain pointed at Deriv's servers. See the [Configuration](#configuration) section.

---

## Connection Architecture

### Key Files

| File                                                 | Purpose                                 |
| ---------------------------------------------------- | --------------------------------------- |
| `src/external/bot-skeleton/services/api/appId.js`    | Async singleton WebSocket instance creation |
| `src/external/bot-skeleton/services/api/api-base.ts` | Connection management and authorization |
| `src/services/derivws-accounts.service.ts`           | Fetches authenticated WebSocket URL via OTP |
| `src/components/shared/utils/config/config.ts`       | `getSocketURL()` — orchestrates URL resolution |
| `src/stores/client-store.ts`                         | Account switching and WebSocket regeneration |

### Connection URL Format

**Public (Unauthenticated):**

Constructed from `brand.config.json` derivws config:

```
{derivws.url.staging}options/ws/public
→ e.g. https://staging-api.derivws.com/trading/v1/options/ws/public
```

**Authenticated:**

Fetched dynamically from the OTP API endpoint. The URL includes a one-time password:

```
wss://staging-api.derivws.com/trading/v1/options/ws/demo?otp=xxx
```

The application does **not** manually build authenticated URLs with `account_type` and `account_id` query params. Instead, `DerivWSAccountsService` fetches the full URL from the server.

---

## Connection Establishment

### Step 1: URL Resolution (`getSocketURL`)

**File:** `src/components/shared/utils/config/config.ts`

The connection process starts with resolving the WebSocket URL. This is an **async** operation:

```typescript
export const getSocketURL = async (): Promise<string> => {
    try {
        // Check if user is authenticated
        const authInfo = OAuthTokenExchangeService.getAuthInfo();
        if (!authInfo || !authInfo.access_token) {
            return getDefaultServerURL(); // Public endpoint
        }

        // Fetch dynamic authenticated URL via DerivWS OTP API
        const wsUrl = await DerivWSAccountsService.getAuthenticatedWebSocketURL(authInfo.access_token);
        return wsUrl;
    } catch (error) {
        console.error('[DerivWS] Error in getSocketURL:', error);
        return getDefaultServerURL(); // Fallback to public
    }
};
```

Key behavior:
- If **not authenticated** → returns static public URL from `brand.config.json` (e.g., `https://staging-api.derivws.com/trading/v1/options/ws/public`)
- If **authenticated** → calls `DerivWSAccountsService.getAuthenticatedWebSocketURL()` which fetches accounts, gets an OTP, and returns a dynamic URL with one-time password
- If **anything fails** → falls back to the default public server URL

### Step 2: WebSocket Instance Creation (Async Singleton)

**File:** `src/external/bot-skeleton/services/api/appId.js`

The instance creator uses a **singleton pattern** to prevent duplicate connections:

```javascript
export const generateDerivApiInstance = async (forceNew = false) => {
    // If forcing new instance, clear existing one
    if (forceNew) {
        clearDerivApiInstance();
    }

    // Reuse existing instance if connection is open/connecting
    if (derivApiInstance) {
        const readyState = derivApiInstance.connection?.readyState;
        if (readyState === WebSocket.CONNECTING || readyState === WebSocket.OPEN) {
            return derivApiInstance;
        }
        clearDerivApiInstance();
    }

    // If creation already in progress, return that promise (prevents race conditions)
    if (derivApiPromise) {
        return derivApiPromise;
    }

    // Create new instance
    derivApiPromise = (async () => {
        const wsURL = await getSocketURL(); // Async URL resolution

        const deriv_socket = new WebSocket(wsURL);
        const deriv_api = new DerivAPIBasic({
            connection: deriv_socket,
            middleware: new APIMiddleware({}),
        });

        derivApiInstance = deriv_api;
        return deriv_api;
    })();

    return derivApiPromise;
};
```

Key behavior:
- **Async** — calls `await getSocketURL()` which may fetch from the OTP API
- **Singleton** — reuses existing instance if the connection is open or connecting
- **Race-safe** — if multiple callers request an instance concurrently, they share the same creation promise
- **URL change detection** — if the URL changes (account switch), clears old instance
- `clearDerivApiInstance()` is used during logout to close the WebSocket and reset the singleton

### Step 3: API Base Initialization

**File:** `src/external/bot-skeleton/services/api/api-base.ts`

```typescript
async init(force_create_connection = false) {
    this.toggleRunButton(true);

    if (this.api) {
        this.unsubscribeAllSubscriptions();
    }

    if (!this.api || this.api?.connection.readyState !== 1 || force_create_connection) {
        // Clean up old connection
        if (this.api?.connection) {
            ApiHelpers.disposeInstance();
            setConnectionStatus(CONNECTION_STATUS.CLOSED);
            this.api.disconnect();
            this.api.connection.removeEventListener('open', this.onsocketopen);
            this.api.connection.removeEventListener('close', this.onsocketclose);
        }

        // Create new instance (async — awaits URL resolution)
        this.api = await generateDerivApiInstance();

        this.api?.connection.addEventListener('open', this.onsocketopen);
        this.api?.connection.addEventListener('close', this.onsocketclose);

        // Track which account this WebSocket is connected for
        const currentClientStore = globalObserver.getState('client.store');
        if (currentClientStore) {
            const active_login_id = getAccountId();
            if (active_login_id) {
                currentClientStore.setWebSocketLoginId(active_login_id);
            }
        }
    }

    chart_api.init(force_create_connection);
}
```

Note: `this.api = await generateDerivApiInstance()` is now async. The URL resolution and authenticated flow happen before the WebSocket is created.

### Step 4: Socket Open Handler

When the WebSocket opens, the handler checks for account info and initiates authorization:

```typescript
onsocketopen() {
    setConnectionStatus(CONNECTION_STATUS.OPENED);
    this.reconnection_attempts = 0;
    this.handleTokenExchangeIfNeeded();
}

private async handleTokenExchangeIfNeeded() {
    // Check URL params for account_id (from OAuth redirect)
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

    // Also check sessionStorage for accounts (from token exchange)
    let activeAccountId = getAccountId();
    if (!activeAccountId) {
        const storedAccounts = sessionStorage.getItem('deriv_accounts');
        if (storedAccounts) {
            const accounts = JSON.parse(storedAccounts);
            if (accounts?.length > 0) {
                activeAccountId = accounts[0].account_id;
                localStorage.setItem('active_loginid', activeAccountId);
                localStorage.setItem('account_type',
                    activeAccountId.startsWith('VRT') ? 'demo' : 'real');
            }
        }
    }

    if (activeAccountId) {
        setIsAuthorizing(true);
        await this.authorizeAndSubscribe();
    }
}
```

### Step 5: Authorization and Subscription

```typescript
async authorizeAndSubscribe() {
    // 1. Verify authentication via balance API call
    const { balance, error } = await this.api.balance();

    // 2. Set account info
    this.account_info = { balance: balance?.balance, currency: balance?.currency, loginid: balance?.loginid };

    // 3. Update observable streams
    setAccountList(accountList);
    setAuthData(authData);
    setIsAuthorized(true);

    // 4. Store account details
    localStorage.setItem('active_loginid', balance.loginid);
    localStorage.setItem('account_type', isDemoAccount(balance.loginid) ? 'demo' : 'real');

    // 5. Subscribe to real-time streams
    this.subscribe(); // balance, transaction, proposal_open_contract
}
```

---

## Public vs Authenticated Endpoints

### How Endpoint Selection Works

The endpoint is determined by `getSocketURL()` based on authentication state:

| Condition                             | URL Source                      | Example URL                                                        |
| ------------------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| Not authenticated (no `auth_info`)    | Static from `brand.config.json` | `https://staging-api.derivws.com/trading/v1/options/ws/public`     |
| Authenticated (valid `auth_info`)     | Dynamic from OTP API            | `wss://staging-api.derivws.com/trading/v1/options/ws/demo?otp=xxx` |
| Auth flow fails (error/timeout)       | Fallback to static default      | `https://staging-api.derivws.com/trading/v1/options/ws/public`     |

### Account Type Determination (for local state)

Account type is still determined from the login ID prefix for local state management:

```typescript
export const getAccountType = (loginid?: string): 'real' | 'demo' | 'public' => {
    if (!loginid) return 'public';
    if (loginid.startsWith('VRT') || loginid.startsWith('VRTC')) return 'demo';
    return 'real';
};
```

This is used for setting `account_type` in localStorage and determining UI behavior — but it is **not** used for building the WebSocket URL (that comes from the OTP API).

---

## Authenticated WebSocket URL Flow (DerivWS)

For authenticated connections, the application fetches a dynamic WebSocket URL from the DerivWS API instead of using a static server URL.

### Service Architecture

**File:** `src/services/derivws-accounts.service.ts`

```typescript
export class DerivWSAccountsService {
    // API Methods
    static async fetchAccountsList(accessToken: string): Promise<DerivAccount[]>;
    static async fetchOTPWebSocketURL(accessToken: string, accountId: string): Promise<string>;
    static async getAuthenticatedWebSocketURL(accessToken: string): Promise<string>;

    // Storage Methods
    static storeAccounts(accounts: DerivAccount[]): void;
    static getStoredAccounts(): DerivAccount[] | null;
    static getDefaultAccount(): DerivAccount | null;
    static clearStoredAccounts(): void;
}
```

### Data Flow

```
User Authentication (OAuth)
    ↓
Access Token stored in sessionStorage
    ↓
DerivWSAccountsService.getAuthenticatedWebSocketURL()
    ↓
1. GET /derivatives/accounts (fetch accounts list)
    ↓
2. Store accounts in sessionStorage
    ↓
3. Select default account (first in list)
    ↓
4. POST /options/accounts/{accountId}/otp (get WebSocket URL)
    ↓
5. Parse nested JSON response
    ↓
6. Clean and return WebSocket URL
    ↓
WebSocket connection established
```

### API Endpoints

#### Accounts List

- **URL:** `{baseURL}derivatives/accounts`
- **Method:** GET
- **Headers:** `Authorization: Bearer {accessToken}`
- **Response:**

```json
{
    "data": {
        "data": [
            {
                "account_id": "VRTC12345",
                "balance": "10000.00",
                "currency": "USD",
                "group": "demo",
                "status": "active",
                "account_type": "demo"
            }
        ]
    }
}
```

#### OTP WebSocket URL

- **URL:** `{baseURL}options/accounts/{accountId}/otp`
- **Method:** POST
- **Headers:** `Authorization: Bearer {accessToken}`
- **Response:** (nested JSON string)

```json
{
    "data": "{\"data\":{\"url\":\"wss://staging-api.derivws.com/trading/v1/options/ws/demo?otp=xxx\"}}"
}
```

The nested JSON response requires special parsing:

```typescript
const otpResponse = await response.json();
const parsedData = JSON.parse(otpResponse.data);
const websocketURL = parsedData.data.url;
```

### URL Cleaning

The raw WebSocket URL is cleaned before use:

```typescript
// Input:  wss://staging-api.derivws.com/trading/v1/options/ws/demo?otp=xxx
// Output: staging-api.derivws.com/trading/v1/options/ws

const urlObj = new URL(websocketURL);
const hostname = urlObj.hostname;
const pathname = urlObj.pathname.replace(/\/(demo|real)$/, '');
const cleanURL = `${hostname}${pathname}`;
```

### Fallback Strategy

If the authenticated flow fails for any reason, the system falls back to the default server URL:

```typescript
export const getSocketURL = async (): Promise<string> => {
    try {
        const authInfo = OAuthTokenExchangeService.getAuthInfo();
        if (!authInfo?.access_token) return getDefaultServerURL();

        return await DerivWSAccountsService.getAuthenticatedWebSocketURL(authInfo.access_token);
    } catch (error) {
        console.error('[DerivWS] Error, falling back to default:', error);
        return getDefaultServerURL();
    }
};
```

---

## OAuth to WebSocket Flow

The complete flow from login to authenticated WebSocket:

```
Step 1: User clicks "Login"
  └── Generate OAuth URL with PKCE → Redirect to Deriv OAuth server

Step 2: User authenticates → OAuth redirects back to root URL (/?code=xxx&state=yyy)

Step 3: Token Exchange (App.tsx + useOAuthCallback)
  └── Exchange code for access_token → Store auth_info in sessionStorage

Step 4: Account Initialization (auto-triggered by token exchange service)
  └── Fetch accounts via DerivWS API → Store in sessionStorage
  └── Set active_loginid in localStorage

Step 5: WebSocket Switch
  BEFORE: wss://...derivws.com/trading/v1/options/ws/public   (static default)
  └── Call api_base.init(true) to force new connection
  └── generateDerivApiInstance() calls await getSocketURL()
  └── getSocketURL() detects auth_info → calls DerivWSAccountsService
  └── Service fetches OTP → returns dynamic authenticated URL
  AFTER:  wss://...derivws.com/trading/v1/options/ws/demo?otp=xxx   (dynamic)

Step 6: Authorization
  └── api_base.authorizeAndSubscribe()
  └── Balance API call verifies authentication
  └── Subscribe to: balance, transaction, proposal_open_contract

Step 7: Fully Authenticated
  └── All API calls use authenticated WebSocket
  └── User can trade, check balance, view history
```

---

## Connection Management

### WebSocket States

```typescript
const socket_state = {
    [WebSocket.CONNECTING]: 'Connecting', // 0
    [WebSocket.OPEN]:       'Connected',  // 1
    [WebSocket.CLOSING]:    'Closing',    // 2
    [WebSocket.CLOSED]:     'Closed',     // 3
};

enum CONNECTION_STATUS {
    OPENED = 'opened',
    CLOSED = 'closed',
}
```

### Connection Regeneration Triggers

| Trigger              | Action                                            |
| -------------------- | ------------------------------------------------- |
| Account switch       | New WebSocket with different `account_id`         |
| Tab focus change     | Check if account changed, regenerate if needed    |
| Connection lost      | Reconnect with current account                    |
| OAuth login          | Switch from public to authenticated endpoint      |
| Manual refresh       | Re-establish connection from localStorage state   |

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
            this.clearAccountData();
            await api_base.init(true); // Force new connection
            this.setWebSocketLoginId(active_login_id);
        }
    } catch (error) {
        console.error('WebSocket regeneration failed:', error);
    } finally {
        this.setIsAccountRegenerating(false);
        this.is_regenerating = false;
    }
}
```

### Reconnection Logic

Maximum of **5 reconnection attempts** before resetting the session:

```typescript
reconnectIfNotConnected = () => {
    if (this.api?.connection?.readyState > 1) { // CLOSING or CLOSED
        this.reconnection_attempts += 1;

        if (this.reconnection_attempts >= this.MAX_RECONNECTION_ATTEMPTS) {
            // Reset session
            this.reconnection_attempts = 0;
            setIsAuthorized(false);
            setAccountList([]);
            setAuthData(null);
            localStorage.removeItem('active_loginid');
            localStorage.removeItem('account_type');
            localStorage.removeItem('accountsList');
            localStorage.removeItem('clientAccounts');
        }

        this.init(true); // Attempt reconnection
    }
};
```

Network event listeners trigger reconnection automatically:

```typescript
window.addEventListener('online', this.reconnectIfNotConnected);
window.addEventListener('focus', this.reconnectIfNotConnected);
```

---

## Observable Streams

**File:** `src/external/bot-skeleton/services/api/observables/connection-status-stream.ts`

RxJS BehaviorSubjects provide reactive state for WebSocket events:

| Stream               | Type                        | Description                    | Setter                   |
| -------------------- | --------------------------- | ------------------------------ | ------------------------ |
| `connectionStatus$`  | `BehaviorSubject<string>`   | Connection state               | `setConnectionStatus()`  |
| `isAuthorizing$`     | `BehaviorSubject<boolean>`  | Auth in progress               | `setIsAuthorizing()`     |
| `isAuthorized$`      | `BehaviorSubject<boolean>`  | Auth complete                  | `setIsAuthorized()`      |
| `account_list$`      | `BehaviorSubject<array>`    | User account list              | `setAccountList()`       |
| `authData$`          | `BehaviorSubject<object>`   | Full auth data                 | `setAuthData()`          |

These streams are consumed by `CoreStoreProvider.tsx` which syncs the data into MobX stores for component access.

---

## Configuration

### WebSocket Endpoints in brand.config.json

> **Do not change these values.** The `derivws` URLs must remain pointed at Deriv's WebSocket API servers. The platform depends on the DerivWS API for all trading functionality.

```json
{
    "platform": {
        "derivws": {
            "url": {
                "staging": "https://staging-api.derivws.com/trading/v1/",
                "production": "https://api.derivws.com/trading/v1/"
            },
            "directories": {
                "options": "options/",
                "derivatives": "derivatives/"
            }
        }
    }
}
```

The default public WebSocket URLs are constructed as:
- **Staging:** `{derivws.url.staging}options/ws/public` → `https://staging-api.derivws.com/trading/v1/options/ws/public`
- **Production:** `{derivws.url.production}options/ws/public` → `https://api.derivws.com/trading/v1/options/ws/public`

### Environment Detection

The service automatically selects the appropriate base URL:

| Environment  | Base URL                                     | Detection                       |
| ------------ | -------------------------------------------- | ------------------------------- |
| Staging      | `https://staging-api.derivws.com/trading/v1/`| `localhost` or staging domain   |
| Production   | `https://api.derivws.com/trading/v1/`        | Production domain patterns      |

---

## Debugging

### Check Current WebSocket State

```javascript
// In browser console
console.log('URL:', api_base.api?.connection?.url);
console.log('State:', api_base.api?.connection?.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED

console.log('Account ID:', localStorage.getItem('active_loginid'));
console.log('Account Type:', localStorage.getItem('account_type'));
console.log('Auth Info:', JSON.parse(sessionStorage.getItem('auth_info')));
```

### Monitor WebSocket Messages

```javascript
// Add in api-base.ts for debugging
this.api?.onMessage().subscribe(message => {
    console.log('WS Message:', message);
});
```

### Debug Logging

Look for `[DerivWS]` prefixed messages in the console:

```
[DerivWS] Starting authenticated WebSocket URL flow
[DerivWS] Fetching accounts from: .../derivatives/accounts
[DerivWS] Fetched accounts: 3
[DerivWS] Using default account: CR1234567
[DerivWS] WebSocket URL obtained
```

---

## Security Considerations

| Feature               | Description                                         |
| --------------------- | --------------------------------------------------- |
| PKCE protection       | Code verifier stored in sessionStorage, cleared after use |
| CSRF protection       | State parameter validates OAuth callback            |
| Token expiration      | `auth_info` includes `expires_at` timestamp         |
| WSS protocol          | Always uses WebSocket Secure (encrypted)            |
| Account validation    | Server validates `account_id` in WebSocket URL      |
| OTP in URL            | One-time password for additional WebSocket security  |
| Bearer token in header| Access token sent via Authorization header (not URL) |

---

## Troubleshooting

### Common Issues

| Problem                      | Cause                         | Solution                           |
| ---------------------------- | ----------------------------- | ---------------------------------- |
| "No auth_info found"         | User not authenticated        | Redirect to login                  |
| "No accounts found"          | No trading accounts on server | Fallback to default server         |
| "Failed to fetch OTP"        | Invalid account or expired token | Refresh token or re-authenticate |
| WebSocket won't connect      | Invalid URL format            | Check URL cleaning logic           |
| Connection drops repeatedly  | Network instability           | Check reconnection attempts limit  |
| Auth state not updating      | Observable not subscribed     | Verify CoreStoreProvider listeners |
| Wrong endpoint after login   | account_id not in localStorage| Check OAuth callback parameter handling |

### Best Practices

1. **Always force regenerate after OAuth:** Call `api_base.init(true)` after storing the new account_id
2. **Clean up old connections:** Remove event listeners and disconnect before creating new WebSocket
3. **Track WebSocket login ID:** Always update `ws_login_id` to prevent issues when switching accounts
4. **Handle reconnection gracefully:** Implement max retry limits and session reset on failure
