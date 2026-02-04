import { useCallback } from 'react';
import { useStore } from '@/hooks/useStore';
import { Analytics } from '@deriv-com/analytics';

/**
 * Custom hook to handle logout functionality
 * Clears all session and local storage to reset the session
 * @returns {Function} handleLogout - Function to trigger the logout process
 */
export const useLogout = () => {
    const { client } = useStore() ?? {};

    return useCallback(async () => {
        try {
            // Call the client store logout method which clears all storage
            await client?.logout();
            Analytics.reset();
        } catch (error) {
            console.error('Logout failed:', error);
            // Even if logout fails, try to clear storage manually
            try {
                sessionStorage.clear();
                localStorage.clear();
            } catch (storageError) {
                console.error('Failed to clear storage:', storageError);
            }
        }
    }, [client]);
};
