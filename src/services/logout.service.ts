import { getLogoutURL, isProduction } from '@/components/shared';

/**
 * Service for handling logout operations
 */
export class LogoutService {
    /**
     * Request logout via REST API endpoint
     * @returns Promise with logout response
     */
    static async requestRestLogout(): Promise<{ logout: number }> {
        try {
            const logoutUrl = getLogoutURL(isProduction());

            // Step 1: Get logout URL and token
            const response = await fetch(logoutUrl, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();

                // Step 2: Call the logout_url to complete logout
                if (data.logout_url) {
                    await fetch(data.logout_url, {
                        method: 'GET',
                        credentials: 'include',
                        redirect: 'manual',
                    });
                }
            }

            // Return success response - cleanup is handled by client-store.js
            return { logout: 1 };
        } catch (error: unknown) {
            // Ignore CORS errors
            console.warn('[Logout Notice]:', error);
            // Still return success for client cleanup, but at least track the error
            // Consider: Analytics.trackError('logout_failed', error);
            return { logout: 1 };
        }
    }
}
