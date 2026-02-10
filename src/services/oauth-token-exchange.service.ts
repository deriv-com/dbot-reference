import { clearCodeVerifier, getCodeVerifier, isProduction } from '@/components/shared';
import { ErrorLogger } from '@/utils/error-logger';
import brandConfig from '../../brand.config.json';

/**
 * Response from OAuth2 token exchange endpoint
 */
interface TokenExchangeResponse {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    error?: string;
    error_description?: string;
}

/**
 * Authentication information stored in sessionStorage
 */
interface AuthInfo {
    access_token: string;
    token_type: string;
    expires_in: number;
    expires_at: number; // Timestamp when token expires
    scope?: string;
    refresh_token?: string;
}

/**
 * Service for handling OAuth2 token exchange operations
 */
export class OAuthTokenExchangeService {
    /**
     * Get the OAuth2 base URL based on environment
     * @returns OAuth2 base URL (staging or production)
     */
    private static getOAuth2BaseURL(): string {
        const environment = isProduction() ? 'production' : 'staging';
        return brandConfig.platform.auth2_url[environment];
    }

    /**
     * Get stored authentication info from sessionStorage
     * @returns AuthInfo object or null if not found or expired
     */
    static getAuthInfo(): AuthInfo | null {
        try {
            const authInfoStr = sessionStorage.getItem('auth_info');
            if (!authInfoStr) {
                return null;
            }

            const authInfo: AuthInfo = JSON.parse(authInfoStr);

            // Check if token is expired
            if (authInfo.expires_at && Date.now() >= authInfo.expires_at) {
                this.clearAuthInfo();
                return null;
            }

            return authInfo;
        } catch (error) {
            ErrorLogger.error('OAuth', 'Error parsing auth_info', error);
            return null;
        }
    }

    /**
     * Clear authentication info from sessionStorage
     */
    static clearAuthInfo(): void {
        sessionStorage.removeItem('auth_info');
    }

    /**
     * Check if user is authenticated (has valid access token)
     * @returns true if authenticated with valid token
     */
    static isAuthenticated(): boolean {
        const authInfo = this.getAuthInfo();
        return authInfo !== null && !!authInfo.access_token;
    }

    /**
     * Get the current access token
     * @returns Access token string or null
     */
    static getAccessToken(): string | null {
        const authInfo = this.getAuthInfo();
        return authInfo?.access_token || null;
    }

    /**
     * Exchange authorization code for access token
     *
     * This method exchanges the authorization code received from OAuth callback
     * for an access token that can be used to authenticate API requests.
     *
     * @param code - The authorization code from OAuth callback
     * @returns Promise with token exchange response
     *
     * @example
     * ```typescript
     * const result = await OAuthTokenExchangeService.exchangeCodeForToken('ory_ac_...');
     * if (result.access_token) {
     *   // Store token in session storage
     *   sessionStorage.setItem('access_token', result.access_token);
     * }
     * ```
     */
    static async exchangeCodeForToken(code: string): Promise<TokenExchangeResponse> {
        try {
            const baseURL = this.getOAuth2BaseURL();
            const tokenEndpoint = `${baseURL}token`;

            // Retrieve the PKCE code verifier from session storage
            const codeVerifier = getCodeVerifier();

            if (!codeVerifier) {
                ErrorLogger.error('OAuth', 'PKCE code verifier not found or expired');
                return {
                    error: 'invalid_request',
                    error_description:
                        'PKCE code verifier not found or expired. Please restart the authentication flow.',
                };
            }
            // Prepare the request body
            // OAuth2 token exchange with PKCE requires:
            // - grant_type: 'authorization_code'
            // - code: the authorization code
            // - redirect_uri: must match the one used in authorization request
            // - client_id: your OAuth2 client ID
            // - code_verifier: the PKCE code verifier (proves we initiated the auth flow)

            const clientId = process.env.CLIENT_ID || '32izC2lBT4MmiSNWuxq2l';
            const protocol = window.location.protocol;
            const host = window.location.host;
            const redirectUrl = `${protocol}//${host}`;

            const requestBody = new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                client_id: clientId,
                redirect_uri: redirectUrl,
                code_verifier: codeVerifier, // PKCE: Include code verifier
            });

            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                credentials: 'include', // Include cookies for session-based auth
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: requestBody.toString(),
            });

            // Parse response
            const data: TokenExchangeResponse = await response.json();

            // Check for errors in response
            if (data.error) {
                ErrorLogger.error('OAuth', `Token exchange error: ${data.error}`, {
                    error: data.error,
                    description: data.error_description,
                });
                return {
                    error: data.error,
                    error_description: data.error_description,
                };
            }

            // Success - log token info (without exposing the actual token)
            if (data.access_token) {
                // Clear the code verifier after successful exchange
                clearCodeVerifier();
                // Store authentication info in sessionStorage
                const authInfo: AuthInfo = {
                    access_token: data.access_token,
                    token_type: data.token_type || 'bearer',
                    expires_in: data.expires_in || 3600,
                    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
                    scope: data.scope,
                };

                // Include refresh token if provided
                if (data.refresh_token) {
                    authInfo.refresh_token = data.refresh_token;
                }

                // Store as JSON string
                sessionStorage.setItem('auth_info', JSON.stringify(authInfo));

                // Immediately fetch accounts and initialize WebSocket after token exchange
                try {
                    const { DerivWSAccountsService } = await import('./derivws-accounts.service');

                    // Fetch accounts and store in sessionStorage
                    const accounts = await DerivWSAccountsService.fetchAccountsList(data.access_token);

                    if (accounts && accounts.length > 0) {
                        // Store accounts
                        DerivWSAccountsService.storeAccounts(accounts);

                        // Set the first account as active in localStorage
                        const firstAccount = accounts[0];
                        localStorage.setItem('active_loginid', firstAccount.account_id);

                        // Set account type
                        const isDemo =
                            firstAccount.account_id.startsWith('VRT') || firstAccount.account_id.startsWith('VRTC');
                        localStorage.setItem('account_type', isDemo ? 'demo' : 'real');

                        ErrorLogger.info('OAuth', 'Accounts fetched and stored', {
                            loginid: firstAccount.account_id,
                        });

                        // Trigger WebSocket initialization by reloading or reinitializing api_base
                        // The api_base will pick up the active_loginid and authorize
                        const { api_base } = await import('@/external/bot-skeleton');
                        await api_base.init(true); // Force new connection with the account
                    } else {
                        // No accounts returned - this is an error condition
                        ErrorLogger.error('OAuth', 'No accounts returned after token exchange');
                        // Clear auth info when no accounts are available to prevent invalid state
                        this.clearAuthInfo();
                        return {
                            error: 'no_accounts',
                            error_description: 'No accounts available after successful authentication',
                        };
                    }
                } catch (error) {
                    ErrorLogger.error('OAuth', 'Error fetching accounts after token exchange', error);
                    // Clear stored auth info to prevent user from being stuck in invalid auth state
                    // This allows retry without manual sessionStorage clearing
                    this.clearAuthInfo();
                    // Return error status to caller for UI feedback
                    return {
                        error: 'account_fetch_failed',
                        error_description:
                            error instanceof Error ? error.message : 'Failed to fetch accounts after authentication',
                    };
                }
            }

            return data;
        } catch (error: unknown) {
            ErrorLogger.error('OAuth', 'Token exchange network or parsing error', error);
            return {
                error: 'network_error',
                error_description: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Refresh access token using refresh token
     *
     * @param refreshToken - The refresh token
     * @returns Promise with token refresh response
     */
    static async refreshAccessToken(refreshToken: string): Promise<TokenExchangeResponse> {
        try {
            const baseURL = this.getOAuth2BaseURL();
            const tokenEndpoint = `${baseURL}token`;

            const requestBody = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            });

            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: requestBody.toString(),
            });

            const data: TokenExchangeResponse = await response.json();

            if (data.error) {
                ErrorLogger.error('OAuth', `Token refresh error: ${data.error}`, {
                    error: data.error,
                    description: data.error_description,
                });
                return {
                    error: data.error,
                    error_description: data.error_description,
                };
            }

            if (data.access_token) {
                // Update authentication info in sessionStorage
                const authInfo: AuthInfo = {
                    access_token: data.access_token,
                    token_type: data.token_type || 'bearer',
                    expires_in: data.expires_in || 3600,
                    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
                    scope: data.scope,
                };

                // Include refresh token if provided (or keep existing one)
                if (data.refresh_token) {
                    authInfo.refresh_token = data.refresh_token;
                } else {
                    // Keep the existing refresh token if new one not provided
                    const existingAuth = this.getAuthInfo();
                    if (existingAuth?.refresh_token) {
                        authInfo.refresh_token = existingAuth.refresh_token;
                    }
                }

                // Store updated auth info
                sessionStorage.setItem('auth_info', JSON.stringify(authInfo));
            }

            return data;
        } catch (error: unknown) {
            ErrorLogger.error('OAuth', 'Token refresh error', error);
            return {
                error: 'network_error',
                error_description: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
}
