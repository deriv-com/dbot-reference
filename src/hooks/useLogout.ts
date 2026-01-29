import { useCallback } from 'react';
import { useOauth2 } from '@/hooks/auth/useOauth2';
import { useStore } from '@/hooks/useStore';

/**
 * Custom hook to handle logout functionality
 * Provides a consistent logout method with error handling and retry logic
 * @returns {Function} handleLogout - Function to trigger the logout process
 */
export const useLogout = () => {
    const { client } = useStore() ?? {};
    const { oAuthLogout } = useOauth2({ handleLogout: async () => client?.logout(), client });

    return useCallback(async () => {
        try {
            await oAuthLogout();
        } catch (error) {
            console.error('Logout failed:', error);
            // Still try to logout even if there's an error
            await oAuthLogout();
        }
    }, [oAuthLogout]);
};
