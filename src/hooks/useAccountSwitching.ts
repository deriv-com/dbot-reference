import { useEffect } from 'react';
import { crypto_currencies_display_order, fiat_currencies_display_order } from '@/components/shared';
import { TAuthData } from '@/types/api-types';

/**
 * Custom hook to handle account switching via URL parameter
 *
 * This hook:
 * 1. Reads 'account' parameter from URL
 * 2. Validates the currency against supported currencies
 * 3. Switches to the specified account (demo or real)
 * 4. Updates localStorage with the selected account's token and loginid
 *
 * @example
 * ```tsx
 * // In your component
 * useAccountSwitching();
 *
 * // URL: ?account=USD - switches to USD account
 * // URL: ?account=DEMO - switches to demo account
 * ```
 */
export const useAccountSwitching = () => {
    useEffect(() => {
        const accounts_list = localStorage.getItem('accountsList');
        const client_accounts = localStorage.getItem('clientAccounts');
        const url_params = new URLSearchParams(window.location.search);
        const account_currency = url_params.get('account');
        const validCurrencies = [...fiat_currencies_display_order, ...crypto_currencies_display_order];

        const is_valid_currency = account_currency && validCurrencies.includes(account_currency?.toUpperCase());

        // Early return if required data is not available
        if (!accounts_list || !client_accounts) return;

        try {
            const parsed_accounts = JSON.parse(accounts_list);
            const parsed_client_accounts = JSON.parse(client_accounts) as TAuthData['account_list'];

            const updateLocalStorage = (token: string, loginid: string) => {
                localStorage.setItem('authToken', token);
                localStorage.setItem('active_loginid', loginid);
            };

            // Handle demo account switching
            if (account_currency?.toUpperCase() === 'DEMO') {
                const demo_account = Object.entries(parsed_accounts).find(([key]) => key.startsWith('VR'));

                if (demo_account) {
                    const [loginid, token] = demo_account;
                    updateLocalStorage(String(token), loginid);
                    return;
                }
            }

            // Handle real account switching with valid currency
            if (account_currency?.toUpperCase() !== 'DEMO' && is_valid_currency) {
                const real_account = Object.entries(parsed_client_accounts).find(
                    ([loginid, account]) =>
                        !loginid.startsWith('VR') && account.currency.toUpperCase() === account_currency?.toUpperCase()
                );

                if (real_account) {
                    const [loginid, account] = real_account;
                    if ('token' in account) {
                        updateLocalStorage(String(account?.token), loginid);
                    }
                    return;
                }
            }
        } catch (e) {
            console.warn('Error switching account:', e);
        }
    }, []); // Run only once on mount
};
