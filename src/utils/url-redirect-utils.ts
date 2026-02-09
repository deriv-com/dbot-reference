/* [AI] - Analytics removed - utility functions moved to @/utils/account-helpers */
import { isDemoAccount } from '@/utils/account-helpers';
/* [/AI] */
import { getInitialLanguage } from '@deriv-com/translations';

/**
 * Generate URL with redirect parameter back to current page, account_id, account_type, and language if available
 * @param baseUrl - The base URL to add parameters to
 * @returns URL with redirect parameter to current page, account_id, account_type, and lang parameters (excluding query params)
 */
export const generateUrlWithRedirect = (baseUrl: string): string => {
    try {
        // Use origin + pathname to exclude query parameters
        const currentUrl = window.location.origin + window.location.pathname;
        const url = new URL(baseUrl);

        // Always add redirect parameter
        url.searchParams.set('redirect', currentUrl);

        // Priority 1: Check URL parameters for account_id
        const urlParams = new URLSearchParams(window.location.search);
        const urlAccountId = urlParams.get('account_id');

        // Priority 2: Fallback to localStorage
        const localStorageLoginId = localStorage.getItem('active_loginid');

        // Use the first available account ID based on priority
        const loginId = urlAccountId || localStorageLoginId;

        if (loginId) {
            url.searchParams.set('account_id', loginId);
            url.searchParams.set('account_type', isDemoAccount(loginId) ? 'demo' : 'real');
        }

        // Add lang parameter with current language
        const currentLanguage = getInitialLanguage();
        if (currentLanguage) {
            url.searchParams.set('lang', currentLanguage);
        }

        return url.toString();
    } catch (error) {
        console.error('Error generating URL with redirect:', error);
        // Fallback to base URL
        return baseUrl;
    }
};
