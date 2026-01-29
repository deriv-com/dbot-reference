import { getWhoAmIURL, isProduction } from '@/components/shared';

/**
 * Service for handling WhoAmI session validation operations
 */
export class WhoAmIService {
    /**
     * Check session validity via REST API whoami endpoint
     * @returns Promise with response data: { success: true } or { error: { code: 401, status: 'Unauthorized' } }
     */
    static async checkWhoAmI(): Promise<{
        success?: boolean;
        data?: any;
        error?: { code?: number; status?: string; message?: string };
    }> {
        try {
            const whoamiUrl = getWhoAmIURL(isProduction());

            const response = await fetch(whoamiUrl, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            // Check for 401 Unauthorized error in response body
            if (data.error && (data.error.code === 401 || data.error.status === 'Unauthorized')) {
                return { error: { code: 401, status: 'Unauthorized' } };
            }

            // Return success response
            return { success: true, data };
        } catch (error: unknown) {
            // eslint-disable-next-line no-console
            console.error('[WhoAmI Error]', error);
            // Return error but don't trigger cleanup for network errors
            return { error: { message: error instanceof Error ? error.message : 'Unknown error' } };
        }
    }
}
