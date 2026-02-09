# Authentication Flow & Service Layers Documentation

## Overview

This document explains the authentication flow and service layer architecture in the DBot application. The application uses OAuth2 authentication with WebSocket connections for real-time trading data.

---

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Service Layers](#service-layers)
3. [Key Components](#key-components)
4. [State Management](#state-management)
5. [Session Management](#session-management)
6. [Error Handling](#error-handling)

---

## Authentication Flow

### 1. Initial Application Load

**Entry Point:** [`src/main.tsx`](src/main.tsx:1) → [`src/app/App.tsx`](src/app/App.tsx:1)

```
User visits app
    ↓
App.tsx loads
    ↓
Checks localStorage for existing session
    ↓
Routes to appropriate page
```

### 2. OAuth2 Authentication Flow

#### **Callback Page** ([`src/pages/callback/callback-page.tsx`](src/pages/callback/callback-page.tsx:1))

When users authenticate via OAuth2, they are redirected to the callback page:

```typescript
// OAuth2 callback receives tokens
onSignInSuccess(tokens, state) {
    // 1. Parse account tokens
    accountsList = { loginid: token }
    clientAccounts = { loginid: { loginid, token, currency } }

    // 2. Store in localStorage
    localStorage.setItem('accountsList', JSON.stringify(accountsList))
    localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts))

    // 3. Authorize with API
    api.authorize(tokens.token1)

    // 4. Set active account
    localStorage.setItem('authToken', token)
    localStorage.setItem('active_loginid', loginid)

    // 5. Redirect to main app
    window.location.replace('/?account=currency')
}
```

### 3. WebSocket Connection Initialization

#### **API Base** ([`src/external/bot-skeleton/services/api/api-base.ts`](src/external/bot-skeleton/services/api/api-base.ts:1))

```typescript
// Initialize WebSocket connection
async init(force_create_connection = false) {
    // 1. Generate WebSocket instance
    this.api = generateDerivApiInstance()

    // 2. Set up event listeners
    this.api.connection.addEventListener('open', this.onsocketopen)
    this.api.connection.addEventListener('close', this.onsocketclose)

    // 3. Store WebSocket login ID
    currentClientStore.setWebSocketLoginId(active_login_id)
}

// On socket open
onsocketopen() {
    setConnectionStatus(CONNECTION_STATUS.OPENED)
    this.handleTokenExchangeIfNeeded()
}

// Authorize and subscribe to streams
async authorizeAndSubscribe() {
    // 1. Get balance (authorization check)
    const { balance, error } = await this.api.balance()

    // 2. Set account info
    this.account_info = { balance, currency, loginid }

    // 3. Update observables
    setAccountList(accountList)
    setAuthData(authData)
    setIsAuthorized(true)

    // 4. Subscribe to streams
    this.subscribe() // balance, transaction, proposal_open_contract
}
```

### 4. Core Store Provider Integration

#### **CoreStoreProvider** ([`src/app/CoreStoreProvider.tsx`](src/app/CoreStoreProvider.tsx:1))

Bridges the API layer with the MobX stores:

```typescript
// Listen to authorization state
useEffect(() => {
    if (client && activeAccount && isAuthorized) {
        client.setLoginId(activeLoginid);
        client.setAccountList(accountList);
        client.setIsLoggedIn(true);
    }
}, [accountList, activeAccount, activeLoginid, client, isAuthorized]);

// Handle WebSocket messages
const handleMessages = async res => {
    const { msg_type, error } = data;

    // Handle auth errors
    if (error?.code === 'AuthorizationRequired' || error?.code === 'InvalidToken') {
        clearInvalidTokenParams();
        await oAuthLogout();
    }

    // Update balance
    if (msg_type === 'balance') {
        client.setBalance(balance.toString());
        client.setCurrency(currency);
    }
};
```

---

## Service Layers

### 1. Authentication Services

#### **WhoAmI Service** ([`src/services/whoami.service.ts`](src/services/whoami.service.ts:1))

Validates session via REST API:

```typescript
class WhoAmIService {
    static async checkWhoAmI() {
        const response = await fetch(whoamiUrl, {
            method: 'GET',
            credentials: 'include', // Send cookies
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        // Check for 401 Unauthorized
        if (data.error?.code === 401) {
            return { error: { code: 401, status: 'Unauthorized' } };
        }

        return { success: true, data };
    }
}
```

**Usage:** Called on tab visibility change and window focus to validate session.

#### **Logout Service** ([`src/services/logout.service.ts`](src/services/logout.service.ts:1))

Handles logout via REST API:

```typescript
class LogoutService {
    static async requestRestLogout() {
        // 1. Get logout URL
        const response = await fetch(logoutUrl, {
            method: 'GET',
            credentials: 'include',
        });

        const data = await response.json();

        // 2. Call logout URL to complete logout
        if (data.logout_url) {
            await fetch(data.logout_url, {
                method: 'GET',
                credentials: 'include',
                redirect: 'manual',
            });
        }

        return { logout: 1 };
    }
}
```

### 2. WebSocket API Layer

#### **API Base** ([`src/external/bot-skeleton/services/api/api-base.ts`](src/external/bot-skeleton/services/api/api-base.ts:47))

Core WebSocket management:

```typescript
class APIBase {
    api: TApiBaseApi | null = null;
    token: string = '';
    account_id: string = '';
    is_authorized = false;
    reconnection_attempts: number = 0;

    // Initialize connection
    async init(force_create_connection = false);

    // Authorize and subscribe
    async authorizeAndSubscribe();

    // Subscribe to streams
    async subscribe(); // balance, transaction, proposal_open_contract

    // Reconnect if disconnected
    reconnectIfNotConnected();

    // Get active symbols
    async getActiveSymbols();
}
```

#### **App ID Generator** ([`src/external/bot-skeleton/services/api/appId.js`](src/external/bot-skeleton/services/api/appId.js:6))

Creates WebSocket instances:

```typescript
export const generateDerivApiInstance = () => {
    const cleanedServer = getSocketURL();
    const account_id = getAccountId();
    const account_type = getAccountType(account_id); // 'real' or 'demo'

    // Build WebSocket URL
    let socket_url = `wss://${cleanedServer}/${account_type}`;
    if (account_id) {
        socket_url += `?account_id=${account_id}`;
    }

    // Create WebSocket and API instance
    const deriv_socket = new WebSocket(socket_url);
    const deriv_api = new DerivAPIBasic({
        connection: deriv_socket,
        middleware: new APIMiddleware({}),
    });

    return deriv_api;
};
```

### 3. Observable Streams

#### **Connection Status Stream** ([`src/external/bot-skeleton/services/api/observables/connection-status-stream.ts`](src/external/bot-skeleton/services/api/observables/connection-status-stream.ts:1))

RxJS BehaviorSubjects for reactive state:

```typescript
// Observable streams
export const connectionStatus$ = new BehaviorSubject<string>('unknown')
export const isAuthorizing$ = new BehaviorSubject<boolean>(true)
export const isAuthorized$ = new BehaviorSubject<boolean>(false)
export const account_list$ = new BehaviorSubject<TAuthData['account_list']>([])
export const authData$ = new BehaviorSubject<TAuthData | null>(null)

// Setters
export const setConnectionStatus = (status: CONNECTION_STATUS)
export const setIsAuthorized = (isAuthorized: boolean)
export const setIsAuthorizing = (isAuthorizing: boolean)
export const setAccountList = (accountList: TAuthData['account_list'])
export const setAuthData = (authData: TAuthData | null)
```

---

## Key Components

### 1. Client Store ([`src/stores/client-store.ts`](src/stores/client-store.ts:21))

MobX store managing client state:

```typescript
class ClientStore {
    // Observable state
    @observable loginid = ''
    @observable account_list: TAuthData['account_list'] = []
    @observable balance = '0'
    @observable currency = 'AUD'
    @observable is_logged_in = false
    @observable accounts: Record<string, Account> = {}

    // Actions
    @action setLoginId(loginid: string)
    @action setAccountList(account_list)
    @action setBalance(balance: string)
    @action setCurrency(currency: string)
    @action setIsLoggedIn(is_logged_in: boolean)
    @action async logout()

    // Session validation
    async checkWhoAmI() {
        const result = await WhoAmIService.checkWhoAmI()
        if (result.error?.code === 401) {
            await this.logout()
        }
    }

    // WebSocket regeneration
    async regenerateWebSocket() {
        // Clear state
        this.accounts = {}
        this.setIsLoggedIn(false)

        // Reinitialize connection
        await api_base.init(true)
        this.setWebSocketLoginId(active_login_id)
    }
}
```

### 2. OAuth2 Hook ([`src/hooks/auth/useOauth2.ts`](src/hooks/auth/useOauth2.ts:21))

Manages OAuth2 operations:

```typescript
export const useOauth2 = ({ handleLogout, client }) => {
    const [isSingleLoggingIn, setIsSingleLoggingIn] = useState(false);

    // Logout handler
    const logoutHandler = async () => {
        client?.setIsLoggingOut(true);
        if (handleLogout) await handleLogout();
        await client?.logout();
        Analytics.reset();
    };

    // Retrigger OAuth2 login
    const retriggerOAuth2Login = async () => {
        window.location.reload();
    };

    return { oAuthLogout: logoutHandler, retriggerOAuth2Login, isSingleLoggingIn };
};
```

### 3. Invalid Token Handler ([`src/hooks/useInvalidTokenHandler.ts`](src/hooks/useInvalidTokenHandler.ts:15))

Handles invalid token events:

```typescript
export const useInvalidTokenHandler = () => {
    const { retriggerOAuth2Login } = useOauth2()

    const handleInvalidToken = () => {
        retriggerOAuth2Login()
    }

    useEffect(() => {
        globalObserver.register('InvalidToken', handleInvalidToken)

        return () => {
            globalObserver.unregister('InvalidToken', handleInvalidToken)
        }
    }, [retriggerOAuth2Login])

    return { unregisterHandler: () => {...} }
}
```

---

## State Management

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   App.tsx    │  │ CoreStore    │  │  Components  │      │
│  │              │  │  Provider    │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
└─────────┼─────────────────┼──────────────────┼──────────────┘
          │                 │                  │
┌─────────┼─────────────────┼──────────────────┼──────────────┐
│         │    Store Layer (MobX)              │              │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │ ClientStore  │  │ CommonStore  │  │ DashboardStore│     │
│  │              │  │              │  │              │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
┌─────────┼───────────────────────────────────────────────────┐
│         │    Observable Layer (RxJS)                        │
│  ┌──────▼───────────────────────────────────────────┐      │
│  │  connection-status-stream.ts                     │      │
│  │  - connectionStatus$                             │      │
│  │  - isAuthorizing$                                │      │
│  │  - isAuthorized$                                 │      │
│  │  - account_list$                                 │      │
│  │  - authData$                                     │      │
│  └──────┬───────────────────────────────────────────┘      │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
┌─────────┼───────────────────────────────────────────────────┐
│         │    API Layer                                      │
│  ┌──────▼───────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  api-base.ts │  │ WhoAmI       │  │ Logout       │      │
│  │              │  │ Service      │  │ Service      │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                  Network Layer                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  WebSocket   │  │  REST API    │                        │
│  │  Connection  │  │  (whoami,    │                        │
│  │              │  │   logout)    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication Data Flow:**

    ```
    OAuth2 Callback → localStorage → API Base → Observable Streams → MobX Stores → UI
    ```

2. **Balance Updates:**

    ```
    WebSocket Message → api_base.onMessage → handleMessages → ClientStore.setBalance → UI
    ```

3. **Session Validation:**
    ```
    Tab Visibility Change → ClientStore.checkWhoAmI → WhoAmIService → Logout if invalid
    ```

---

## Session Management

### 1. Session Validation

**Triggers:**

- Tab becomes visible ([`client-store.ts:326`](src/stores/client-store.ts:326))
- Window gains focus ([`client-store.ts:450`](src/stores/client-store.ts:450))
- After account list is set ([`client-store.ts:206`](src/stores/client-store.ts:206))

**Flow:**

```typescript
// On tab visibility change
setupVisibilityListener() {
    this.tab_visibility_handler = async () => {
        if (document.visibilityState === 'visible') {
            // Check session validity
            await this.checkWhoAmI()

            // Regenerate WebSocket if needed
            if (this.is_logged_in) {
                this.checkAndRegenerateWebSocket()
            }
        }
    }
    document.addEventListener('visibilitychange', this.tab_visibility_handler)
}
```

### 2. WebSocket Regeneration

**When to Regenerate:**

- Active login ID changes
- Tab becomes visible with different account
- WebSocket is not running

**Flow:**

```typescript
needsWebSocketRegeneration(): boolean {
    const active_login_id = getAccountId()
    return (
        !this.is_regenerating &&
        !!active_login_id &&
        !!this.ws_login_id &&
        active_login_id !== this.ws_login_id &&
        !api_base.is_running
    )
}

async regenerateWebSocket() {
    // Clear state
    this.accounts = {}
    this.setIsLoggedIn(false)
    localStorage.removeItem('accountsList')
    localStorage.removeItem('authToken')

    // Reinitialize
    await api_base.init(true)
    this.setWebSocketLoginId(active_login_id)
}
```

### 3. Reconnection Strategy

**Max Attempts:** 5 ([`api-base.ts:68`](src/external/bot-skeleton/services/api/api-base.ts:68))

```typescript
reconnectIfNotConnected = () => {
    if (this.api?.connection?.readyState > 1) {
        this.reconnection_attempts += 1;

        if (this.reconnection_attempts >= this.MAX_RECONNECTION_ATTEMPTS) {
            // Reset and logout
            this.reconnection_attempts = 0;
            setIsAuthorized(false);
            setAccountList([]);
            setAuthData(null);
            localStorage.removeItem('active_loginid');
            localStorage.removeItem('accountsList');
        }

        this.init(true);
    }
};
```

---

## Error Handling

### 1. Authentication Errors

**Handled in CoreStoreProvider** ([`CoreStoreProvider.tsx:109`](src/app/CoreStoreProvider.tsx:109)):

```typescript
const handleMessages = async res => {
    const { error } = data;

    if (error?.code === 'AuthorizationRequired' || error?.code === 'DisabledClient' || error?.code === 'InvalidToken') {
        // Clear URL parameters
        clearInvalidTokenParams();

        // Logout user
        await oAuthLogout();
    }
};
```

### 2. Invalid Token Handling

**Global Observer Pattern:**

```typescript
// API Base emits InvalidToken event
if (error.code === 'InvalidToken') {
    globalObserver.emit('InvalidToken');
}

// useInvalidTokenHandler listens and retriggers login
globalObserver.register('InvalidToken', handleInvalidToken);
```

### 3. Network Errors

**Handled in API Base:**

```typescript
onsocketclose() {
    setConnectionStatus(CONNECTION_STATUS.CLOSED)
    this.reconnectIfNotConnected()
}

// Reconnect on network events
window.addEventListener('online', this.reconnectIfNotConnected)
window.addEventListener('focus', this.reconnectIfNotConnected)
```

---

## Summary

### Authentication Flow Summary

1. **OAuth2 Login** → Callback page receives tokens
2. **Token Storage** → Store in localStorage
3. **WebSocket Init** → Create connection with account_id
4. **Authorization** → Call balance API to authorize
5. **Stream Subscription** → Subscribe to balance, transaction, proposal_open_contract
6. **State Updates** → Update observables and MobX stores
7. **UI Rendering** → Components react to state changes

### Service Layer Summary

- **Authentication Services:** WhoAmI, Logout
- **WebSocket Layer:** API Base, Chart API
- **Observable Layer:** RxJS streams for reactive state
- **Store Layer:** MobX stores for component state
- **Hook Layer:** React hooks for component integration

### Key Features

- ✅ OAuth2 authentication
- ✅ WebSocket real-time connections
- ✅ Session validation on tab visibility
- ✅ Automatic reconnection
- ✅ WebSocket regeneration on account switch
- ✅ Invalid token handling
- ✅ Multi-account support
- ✅ Demo/Real account switching

---

## Related Files

### Core Authentication

- [`src/app/App.tsx`](src/app/App.tsx:1) - Main app entry
- [`src/app/CoreStoreProvider.tsx`](src/app/CoreStoreProvider.tsx:1) - Store provider
- [`src/pages/callback/callback-page.tsx`](src/pages/callback/callback-page.tsx:1) - OAuth callback

### Services

- [`src/services/whoami.service.ts`](src/services/whoami.service.ts:1) - Session validation
- [`src/services/logout.service.ts`](src/services/logout.service.ts:1) - Logout handling

### API Layer

- [`src/external/bot-skeleton/services/api/api-base.ts`](src/external/bot-skeleton/services/api/api-base.ts:1) - WebSocket management
- [`src/external/bot-skeleton/services/api/appId.js`](src/external/bot-skeleton/services/api/appId.js:1) - WebSocket instance creation
- [`src/external/bot-skeleton/services/api/observables/connection-status-stream.ts`](src/external/bot-skeleton/services/api/observables/connection-status-stream.ts:1) - Observable streams

### Stores

- [`src/stores/client-store.ts`](src/stores/client-store.ts:1) - Client state management
- [`src/stores/root-store.ts`](src/stores/root-store.ts:1) - Root store

### Hooks

- [`src/hooks/auth/useOauth2.ts`](src/hooks/auth/useOauth2.ts:1) - OAuth2 operations
- [`src/hooks/useInvalidTokenHandler.ts`](src/hooks/useInvalidTokenHandler.ts:1) - Invalid token handling
- [`src/hooks/useApiBase.ts`](src/hooks/useApiBase.ts:1) - API base hook
