import { DerivWSAccountsService } from '@/services/derivws-accounts.service';
import { OAuthTokenExchangeService } from '@/services/oauth-token-exchange.service';
import brandConfig from '../../../../../brand.config.json';

// =============================================================================
// Constants - Domain & Server Configuration (from brand.config.json)
// =============================================================================

// Production app domains
export const PRODUCTION_DOMAINS = {
    COM: brandConfig.platform.hostname.production.com,
} as const;

// Staging app domains
export const STAGING_DOMAINS = {
    COM: brandConfig.platform.hostname.staging.com,
} as const;

// WebSocket server URLs
export const WS_SERVERS = {
    STAGING: `${brandConfig.platform.derivws.url.staging}options/ws/public`,
    PRODUCTION: `${brandConfig.platform.derivws.url.production}options/ws/public`,
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

// Simple environment detection based on hostname
const getCurrentEnvironment = (): 'staging' | 'production' => {
    try {
        const hostname = window.location.hostname;
        // Check if hostname is localhost or matches any staging domain
        const isStagingDomain = Object.values(STAGING_DOMAINS).some(domain =>
            hostname.startsWith(domain.split('.')[0])
        );

        if (hostname.startsWith('localhost') || isStagingDomain) {
            return 'staging';
        }
        return 'production';
    } catch (error) {
        console.error('Error detecting environment:', error);
        return 'production'; // Safe fallback
    }
};

// Helper to check if we're on production domains
export const isProduction = () => {
    const hostname = window.location.hostname;
    const productionDomains = Object.values(PRODUCTION_DOMAINS) as string[];
    return productionDomains.includes(hostname);
};

export const isLocal = () => /localhost(:\d+)?$/i.test(window.location.hostname);

const getDefaultServerURL = () => {
    const isProductionEnv = isProduction();

    try {
        return isProductionEnv ? WS_SERVERS.PRODUCTION : WS_SERVERS.STAGING;
    } catch (error) {
        console.error('Error in getDefaultServerURL:', error);
    }

    // Production defaults to demov2, staging/preview defaults to qa194 (demo)
    return isProductionEnv ? WS_SERVERS.PRODUCTION : WS_SERVERS.STAGING;
};

/**
 * Gets the WebSocket URL using the new authenticated flow
 * This function orchestrates the complete flow:
 * 1. Get access token from auth_info
 * 2. Fetch accounts list from derivatives/accounts
 * 3. Store accounts in sessionStorage
 * 4. Get default account (first from list)
 * 5. Fetch OTP and WebSocket URL for that account
 *
 * @returns Promise with WebSocket URL or fallback to default server
 */
export const getSocketURL = async (): Promise<string> => {
    try {
        // Check if user is authenticated
        const authInfo = OAuthTokenExchangeService.getAuthInfo();
        if (!authInfo || !authInfo.access_token) {
            return getDefaultServerURL();
        }

        // Use the DerivWSAccountsService to get authenticated WebSocket URL
        const wsUrl = await DerivWSAccountsService.getAuthenticatedWebSocketURL(authInfo.access_token);
        return wsUrl;
    } catch (error) {
        console.error('[DerivWS] Error in getSocketURL:', error);
        return getDefaultServerURL();
    }
};

export const getDebugServiceWorker = () => {
    const debug_service_worker_flag = window.localStorage.getItem('debug_service_worker');
    if (debug_service_worker_flag) return !!parseInt(debug_service_worker_flag);

    return false;
};

/**
 * Generates a cryptographically secure CSRF token
 * @returns A random base64url-encoded string
 */
const generateCSRFToken = (): string => {
    // Generate 32 random bytes (256 bits) for strong security
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);

    // Convert to base64url encoding (URL-safe)
    const base64 = btoa(String.fromCharCode(...array));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

/**
 * Generates a PKCE code verifier (random string)
 * @returns A cryptographically random base64url-encoded string (43-128 characters)
 */
const generateCodeVerifier = (): string => {
    // Generate 32 random bytes (will result in 43 characters after base64url encoding)
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);

    // Convert to base64url encoding (URL-safe, no padding)
    const base64 = btoa(String.fromCharCode(...array));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

/**
 * Generates a PKCE code challenge from a code verifier using SHA-256
 * @param verifier The code verifier string
 * @returns Promise that resolves to the base64url-encoded SHA-256 hash
 */
const generateCodeChallenge = async (verifier: string): Promise<string> => {
    // Encode the verifier as UTF-8
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);

    // Hash with SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert to base64url encoding
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const base64 = btoa(String.fromCharCode(...hashArray));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

/**
 * Stores PKCE code verifier in sessionStorage for token exchange
 * @param verifier The code verifier to store
 */
const storeCodeVerifier = (verifier: string): void => {
    sessionStorage.setItem('oauth_code_verifier', verifier);
    // Also store timestamp for verifier expiration (e.g., 10 minutes)
    sessionStorage.setItem('oauth_code_verifier_timestamp', Date.now().toString());
};

/**
 * Retrieves and validates the stored PKCE code verifier
 * @returns The code verifier if valid and not expired, null otherwise
 */
export const getCodeVerifier = (): string | null => {
    const verifier = sessionStorage.getItem('oauth_code_verifier');
    const timestamp = sessionStorage.getItem('oauth_code_verifier_timestamp');

    if (!verifier || !timestamp) {
        return null;
    }

    // Check if verifier is expired (10 minutes = 600000ms)
    const verifierAge = Date.now() - parseInt(timestamp, 10);
    if (verifierAge > 600000) {
        // Clean up expired verifier
        sessionStorage.removeItem('oauth_code_verifier');
        sessionStorage.removeItem('oauth_code_verifier_timestamp');
        return null;
    }

    return verifier;
};

/**
 * Clears PKCE code verifier from sessionStorage after successful token exchange
 */
export const clearCodeVerifier = (): void => {
    sessionStorage.removeItem('oauth_code_verifier');
    sessionStorage.removeItem('oauth_code_verifier_timestamp');
};

/**
 * Stores CSRF token in sessionStorage for validation after OAuth callback
 * @param token The CSRF token to store
 */
const storeCSRFToken = (token: string): void => {
    sessionStorage.setItem('oauth_csrf_token', token);
    // Also store timestamp for token expiration (e.g., 10 minutes)
    sessionStorage.setItem('oauth_csrf_token_timestamp', Date.now().toString());
};

/**
 * Validates CSRF token from OAuth callback
 * @param token The token to validate
 * @returns true if token is valid and not expired
 */
export const validateCSRFToken = (token: string): boolean => {
    const storedToken = sessionStorage.getItem('oauth_csrf_token');
    const timestamp = sessionStorage.getItem('oauth_csrf_token_timestamp');

    if (!storedToken || !timestamp) {
        return false;
    }

    // Check if token matches
    if (storedToken !== token) {
        return false;
    }

    // Check if token is expired (10 minutes = 600000ms)
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    if (tokenAge > 600000) {
        // Clean up expired token
        sessionStorage.removeItem('oauth_csrf_token');
        sessionStorage.removeItem('oauth_csrf_token_timestamp');
        return false;
    }

    return true;
};

/**
 * Clears CSRF token from sessionStorage after successful validation
 */
export const clearCSRFToken = (): void => {
    sessionStorage.removeItem('oauth_csrf_token');
    sessionStorage.removeItem('oauth_csrf_token_timestamp');
};

export const generateOAuthURL = async () => {
    try {
        // Use brand config for login URLs
        const environment = isProduction() ? 'production' : 'staging';
        const hostname = brandConfig?.platform.auth2_url?.[environment];
        const clientId = process.env.CLIENT_ID || '32izC2lBT4MmiSNWuxq2l';

        if (hostname && clientId) {
            // Generate CSRF token for security
            const csrfToken = generateCSRFToken();

            // Store token for validation after callback
            storeCSRFToken(csrfToken);

            // Generate PKCE parameters
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);

            // Store code verifier for token exchange
            storeCodeVerifier(codeVerifier);

            // Build redirect URL
            const protocol = window.location.protocol;
            const host = window.location.host;
            const redirectUrl = `${protocol}//${host}`;
            const scopes = 'trade%20account_manage';

            // Build OAuth URL with PKCE parameters
            // - state: CSRF token for security
            // - code_challenge: SHA-256 hash of code_verifier
            // - code_challenge_method: S256 (SHA-256)
            const oauthUrl = `${hostname}auth?scope=${scopes}&response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&state=${csrfToken}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

            return oauthUrl;
        }
    } catch (error) {
        console.error('Error generating OAuth URL:', error);
    }

    // Fallback to hardcoded URLs if brand config fails
    return ``;
};

export const generateSignupURL = () => {
    try {
        // Use brand config for signup URLs
        const environment = getCurrentEnvironment();
        const hostname = brandConfig?.brand_hostname?.[environment];

        if (hostname) {
            return `https://${hostname}/signup`;
        }
    } catch (error) {
        console.error('Error accessing brand config:', error);
    }

    return '';
};
