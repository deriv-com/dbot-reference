// [AI]
import { isProduction, getCodeVerifier, clearCodeVerifier } from '@/components/shared';
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

            console.log('[OAuth Token Exchange] Starting token exchange...');
            console.log('[OAuth Token Exchange] Endpoint:', tokenEndpoint);
            console.log('[OAuth Token Exchange] Authorization code:', code);

            // Retrieve the PKCE code verifier from session storage
            const codeVerifier = getCodeVerifier();
            
            if (!codeVerifier) {
                console.error('[OAuth Token Exchange] PKCE code verifier not found or expired');
                return {
                    error: 'invalid_request',
                    error_description: 'PKCE code verifier not found or expired. Please restart the authentication flow.',
                };
            }

            console.log('[OAuth Token Exchange] PKCE code verifier retrieved');

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

            // Log the response for debugging
            console.log('[OAuth Token Exchange] Response status:', response.status);
            console.log('[OAuth Token Exchange] Response data:', data);

            // Check for errors in response
            if (data.error) {
                console.error('[OAuth Token Exchange] Error:', data.error);
                console.error('[OAuth Token Exchange] Error description:', data.error_description);
                return {
                    error: data.error,
                    error_description: data.error_description,
                };
            }

            // Success - log token info (without exposing the actual token)
            if (data.access_token) {
                console.log('[OAuth Token Exchange] ✅ Token exchange successful');
                console.log('[OAuth Token Exchange] Token type:', data.token_type);
                console.log('[OAuth Token Exchange] Expires in:', data.expires_in, 'seconds');
                console.log('[OAuth Token Exchange] Scope:', data.scope);

                // Clear the code verifier after successful exchange
                clearCodeVerifier();
                console.log('[OAuth Token Exchange] PKCE code verifier cleared');

                // TODO: Store in sessionStorage
                // sessionStorage.setItem('access_token', data.access_token);
                // if (data.refresh_token) {
                //     sessionStorage.setItem('refresh_token', data.refresh_token);
                // }
            }

            return data;
        } catch (error: unknown) {
            console.error('[OAuth Token Exchange] Network or parsing error:', error);
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

            console.log('[OAuth Token Refresh] Starting token refresh...');

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

            console.log('[OAuth Token Refresh] Response:', data);

            if (data.error) {
                console.error('[OAuth Token Refresh] Error:', data.error);
                return {
                    error: data.error,
                    error_description: data.error_description,
                };
            }

            if (data.access_token) {
                console.log('[OAuth Token Refresh] ✅ Token refresh successful');
                // TODO: Update sessionStorage
                // sessionStorage.setItem('access_token', data.access_token);
            }

            return data;
        } catch (error: unknown) {
            console.error('[OAuth Token Refresh] Error:', error);
            return {
                error: 'network_error',
                error_description: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
}
// [/AI]
