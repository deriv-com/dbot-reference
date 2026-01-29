import brandConfig from '../../../../../brand.config.json';

// =============================================================================
// Constants - Domain & Server Configuration (from brand.config.json)
// =============================================================================

// Production app domains
export const PRODUCTION_DOMAINS = {
    COM: brandConfig.platform.hostname.production.com,
    BE: brandConfig.platform.hostname.production.be,
    ME: brandConfig.platform.hostname.production.me,
} as const;

// Staging app domains
export const STAGING_DOMAINS = {
    COM: brandConfig.platform.hostname.staging.com,
    BE: brandConfig.platform.hostname.staging.be,
    ME: brandConfig.platform.hostname.staging.me,
} as const;

// WebSocket server URLs
export const WS_SERVERS = {
    STAGING: brandConfig.platform.websocket_servers.staging,
    PRODUCTION: brandConfig.platform.websocket_servers.production,
} as const;
// who am i  server URLs - Production
export const WHO_AM_I_SERVERS = {
    STAGING: brandConfig.platform.whoami_endpoint.staging,
    PRODUCTION: brandConfig.platform.whoami_endpoint.production,
} as const;

// Logout  server URLs - Production
export const LOGOUT_SERVERS = {
    STAGING: brandConfig.platform.logout_endpoint.staging,
    PRODUCTION: brandConfig.platform.logout_endpoint.production,
} as const;

// OAuth/Auth URLs
export const AUTH_URLS = {
    PRODUCTION: {
        LOGIN: brandConfig.platform.auth_urls.production.login,
        SIGNUP: brandConfig.platform.auth_urls.production.signup,
    },
    STAGING: {
        LOGIN: brandConfig.platform.auth_urls.staging.login,
        SIGNUP: brandConfig.platform.auth_urls.staging.signup,
    },
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

/**
 * Gets the whoami endpoint URL
 * @param isProductionEnv - Whether the current environment is production
 * @returns Whoami endpoint URL (e.g., "https://auth.deriv.com/sessions/whoami")
 */
export const getWhoAmIURL = (isProductionEnv: boolean): string => {
    return isProductionEnv ? WHO_AM_I_SERVERS.PRODUCTION : WHO_AM_I_SERVERS.STAGING;
};

/**
 * Gets the logout endpoint URL
 * @param isProductionEnv - Whether the current environment is production
 * @returns Logout endpoint URL (e.g., "https://auth.deriv.com/self-service/logout/browser")
 */
export const getLogoutURL = (isProductionEnv: boolean): string => {
    return isProductionEnv ? LOGOUT_SERVERS.PRODUCTION : LOGOUT_SERVERS.STAGING;
};

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

export const getSocketURL = () => {
    const local_storage_server_url = window.localStorage.getItem('config.server_url');

    if (local_storage_server_url) {
        // Validate it's a reasonable hostname (not a full URL, no protocol)
        if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(local_storage_server_url)) {
            return local_storage_server_url;
        }
        // Clear invalid value
        window.localStorage.removeItem('config.server_url');
    }

    const server_url = getDefaultServerURL();

    return server_url;
};

export const getDebugServiceWorker = () => {
    const debug_service_worker_flag = window.localStorage.getItem('debug_service_worker');
    if (debug_service_worker_flag) return !!parseInt(debug_service_worker_flag);

    return false;
};

export const generateOAuthURL = () => {
    try {
        // Use brand config for login URLs
        const environment = getCurrentEnvironment();
        const hostname = brandConfig?.brand_hostname?.[environment];

        if (hostname) {
            // Use the current host as redirect URL (no replacement needed)
            const currentHost = window.location.host; // includes port
            const redirectUrl = currentHost;

            return `https://${hostname}/login?redirect=${redirectUrl}`;
        }
    } catch (error) {
        console.error('Error accessing brand config:', error);
    }

    // Fallback to hardcoded URLs if brand config fails
    const currentHost = window.location.host; // includes port
    const redirectUrl = currentHost;

    const loginUrl = currentHost.includes('staging') ? AUTH_URLS.STAGING.LOGIN : AUTH_URLS.PRODUCTION.LOGIN;
    return `${loginUrl}?redirect=${redirectUrl}`;
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

    // Fallback to hardcoded URLs if brand config fails
    const currentHost = window.location.host; // includes port

    return currentHost.includes('staging') ? AUTH_URLS.STAGING.SIGNUP : AUTH_URLS.PRODUCTION.SIGNUP;
};
