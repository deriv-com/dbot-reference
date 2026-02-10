# DerivWS Authenticated WebSocket URL Flow

## Overview

This document describes the implementation of the authenticated WebSocket URL flow using the DerivWS API. This flow replaces the previous static WebSocket server configuration with a dynamic, account-specific WebSocket URL obtained through OAuth authentication.

## Architecture

### Service Layer

The implementation follows a service-oriented architecture pattern:

- **[`DerivWSAccountsService`](../src/services/derivws-accounts.service.ts)**: Centralized service for all DerivWS account and WebSocket URL operations
- **[`OAuthTokenExchangeService`](../src/services/oauth-token-exchange.service.ts)**: Manages OAuth token exchange and auth_info storage
- **[`config.ts`](../src/components/shared/utils/config/config.ts)**: Configuration utilities that orchestrate the services

### Data Flow

```
User Authentication (OAuth)
    ↓
Access Token stored in auth_info (sessionStorage)
    ↓
DerivWSAccountsService.getAuthenticatedWebSocketURL()
    ↓
1. Fetch accounts list (derivatives/accounts)
    ↓
2. Store accounts in sessionStorage
    ↓
3. Select default account (first in list)
    ↓
4. Fetch OTP & WebSocket URL (options/accounts/{accountId}/otp)
    ↓
5. Parse nested JSON response
    ↓
6. Clean and return WebSocket URL
    ↓
WebSocket connection established with authenticated URL
```

## Implementation Details

### 1. Service File Structure

**File**: [`src/services/derivws-accounts.service.ts`](../src/services/derivws-accounts.service.ts)

This service encapsulates all DerivWS-related functionality:

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

### 2. API Endpoints

#### Accounts List Endpoint

- **URL**: `{baseURL}derivatives/accounts`
- **Method**: GET
- **Headers**:
    - `Authorization: Bearer {accessToken}`
    - `Content-Type: application/json`
- **Response Format**:

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

#### OTP WebSocket URL Endpoint

- **URL**: `{baseURL}options/accounts/{accountId}/otp`
- **Method**: POST
- **Headers**:
    - `Authorization: Bearer {accessToken}`
    - `Content-Type: application/json`
- **Response Format** (nested JSON string):

```json
{
    "data": "{\"data\":{\"url\":\"wss://staging-api.derivws.com/trading/v1/options/ws/demo?otp=xxx\"},\"meta\":{...}}"
}
```

### 3. Configuration

**File**: [`brand.config.json`](../brand.config.json)

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

### 4. WebSocket URL Flow

**File**: [`src/components/shared/utils/config/config.ts`](../src/components/shared/utils/config/config.ts)

The [`getSocketURL()`](../src/components/shared/utils/config/config.ts:166) function orchestrates the complete flow:

```typescript
export const getSocketURL = async (): Promise<string> => {
    try {
        // 1. Check authentication
        const authInfo = OAuthTokenExchangeService.getAuthInfo();
        if (!authInfo || !authInfo.access_token) {
            return getDefaultServerURL();
        }

        // 2. Get authenticated WebSocket URL via service
        const wsUrl = await DerivWSAccountsService.getAuthenticatedWebSocketURL(authInfo.access_token);

        return wsUrl;
    } catch (error) {
        console.error('[DerivWS] Error in getSocketURL:', error);
        return getDefaultServerURL();
    }
};
```

### 5. WebSocket Connection

**File**: [`src/external/bot-skeleton/services/api/appId.js`](../src/external/bot-skeleton/services/api/appId.js)

The WebSocket connection is established using the authenticated URL:

```javascript
export const generateDerivApiInstance = async (useAuthenticatedFlow = true) => {
    let cleanedServer;
    if (useAuthenticatedFlow) {
        cleanedServer = await getSocketURL(); // Async call to get authenticated URL
    } else {
        cleanedServer = getSocketURLSync(); // Fallback for legacy code
    }

    const deriv_api = new DerivAPIBasic({
        endpoint: cleanedServer,
        app_id: getAppId(),
        lang: 'EN',
        brand: 'deriv',
    });

    return deriv_api;
};
```

## Data Storage

### SessionStorage Keys

1. **`auth_info`**: OAuth authentication information

    ```typescript
    {
      access_token: string;
      token_type: string;
      expires_in: number;
      expires_at: number;
      scope?: string;
      refresh_token?: string;
    }
    ```

2. **`deriv_accounts`**: List of user's trading accounts

    ```typescript
    [
      {
        account_id: string;
        balance: string;
        currency: string;
        group: string;
        status: string;
        account_type: 'demo' | 'real';
      }
    ]
    ```

3. **`cached_websocket_url`**: Cached WebSocket URL (for sync fallback)

## Error Handling

The implementation includes comprehensive error handling:

1. **Missing Authentication**: Falls back to default server URL
2. **Expired Token**: Falls back to default server URL
3. **API Errors**: Catches and logs errors, returns default server URL
4. **Network Failures**: Graceful degradation to default server
5. **Invalid Response Format**: Validates and handles malformed responses

### Fallback Strategy

```typescript
try {
    // Attempt authenticated flow
    return await DerivWSAccountsService.getAuthenticatedWebSocketURL(accessToken);
} catch (error) {
    // Fallback to default server
    console.error('[DerivWS] Error, falling back to default server:', error);
    return getDefaultServerURL();
}
```

## Response Parsing

### Nested JSON Handling

The OTP endpoint returns a nested JSON string that requires special parsing:

```typescript
// Response structure
const otpResponse: OTPResponse = await response.json();
// otpResponse.data is a JSON string: "{\"data\":{\"url\":\"wss://...\"}}"

// Parse the nested JSON
const parsedData = JSON.parse(otpResponse.data) as { data: OTPResponseData };
const websocketURL = parsedData.data.url;
```

### URL Cleaning

The WebSocket URL is cleaned to match the expected format:

```typescript
// Input: wss://staging-api.derivws.com/trading/v1/options/ws/demo?otp=xxx
// Output: staging-api.derivws.com/trading/v1/options/ws

const urlObj = new URL(websocketURL);
const hostname = urlObj.hostname;
const pathname = urlObj.pathname.replace(/\/(demo|real)$/, '');
const cleanURL = `${hostname}${pathname}`;
```

## Integration Points

### 1. OAuth Token Exchange

- **Service**: [`OAuthTokenExchangeService`](../src/services/oauth-token-exchange.service.ts)
- **Method**: [`exchangeCodeForToken()`](../src/services/oauth-token-exchange.service.ts:124)
- **Storage**: Stores `auth_info` in sessionStorage with access_token

### 2. API Base Initialization

- **File**: [`src/external/bot-skeleton/services/api/api-base.ts`](../src/external/bot-skeleton/services/api/api-base.ts)
- **Method**: [`init()`](../src/external/bot-skeleton/services/api/api-base.ts:125)
- **Flow**: Checks for auth_info → calls async [`generateDerivApiInstance()`](../src/external/bot-skeleton/services/api/appId.js:13)

### 3. Header Component

- **File**: [`src/components/layout/header/header.tsx`](../src/components/layout/header/header.tsx)
- **Method**: [`handleLogin()`](../src/components/layout/header/header.tsx:76)
- **Flow**: Generates OAuth URL with PKCE → redirects to auth

## Testing Checklist

- [ ] Verify OAuth token exchange stores auth_info correctly
- [ ] Test accounts list API call with valid Bearer token
- [ ] Verify accounts are stored in sessionStorage
- [ ] Test default account selection (first account)
- [ ] Verify OTP API call returns WebSocket URL
- [ ] Test nested JSON parsing of OTP response
- [ ] Verify URL cleaning removes protocol and query params
- [ ] Test fallback to default server on authentication failure
- [ ] Test fallback to default server on API errors
- [ ] Verify WebSocket connection uses authenticated URL
- [ ] Test token expiration handling
- [ ] Test with both demo and real accounts

## Environment Detection

The service automatically detects the environment and uses the appropriate base URL:

- **Staging**: `https://staging-api.derivws.com/trading/v1/`
- **Production**: `https://api.derivws.com/trading/v1/`

Detection is based on:

1. Current hostname (localhost → staging)
2. Staging domain patterns
3. Production domain patterns

## Security Considerations

1. **Bearer Token**: Access token is passed in Authorization header
2. **SessionStorage**: Temporary storage, cleared on tab close
3. **Token Expiration**: Checked before making API calls
4. **HTTPS Only**: All API calls use HTTPS
5. **OTP**: One-time password included in WebSocket URL for additional security

## Related Documentation

- [PKCE Implementation](./PKCE_IMPLEMENTATION.md)
- [WebSocket Connection Flow](./WEBSOCKET_CONNECTION_FLOW.md)
- [Authentication Flow](../migrate-docs/AUTHENTICATION_FLOW.md)

## Troubleshooting

### Common Issues

1. **"No auth_info found"**
    - User not authenticated
    - Solution: Redirect to login

2. **"No accounts found"**
    - User has no trading accounts
    - Solution: Fallback to default server

3. **"Failed to fetch OTP"**
    - Invalid account ID or expired token
    - Solution: Refresh token or re-authenticate

4. **WebSocket connection fails**
    - Invalid URL format
    - Solution: Check URL cleaning logic

### Debug Logging

Enable debug logging by checking console for `[DerivWS]` prefixed messages:

```javascript
console.log('[DerivWS] Starting authenticated WebSocket URL flow');
console.log('[DerivWS] Fetching accounts from:', endpoint);
console.log('[DerivWS] ✅ Fetched accounts:', accounts.length);
console.log('[DerivWS] Using default account:', accountId);
console.log('[DerivWS] ✅ WebSocket URL obtained');
```

## Future Enhancements

1. **Account Selection**: Allow user to select specific account
2. **Account Caching**: Cache accounts with TTL
3. **Token Refresh**: Automatic token refresh before expiration
4. **Retry Logic**: Implement exponential backoff for API failures
5. **WebSocket Reconnection**: Handle reconnection with new OTP
6. **Multi-Account Support**: Support switching between accounts
