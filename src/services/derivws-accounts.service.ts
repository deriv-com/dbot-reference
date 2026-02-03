// [AI]
import { isProduction } from '@/components/shared';
import brandConfig from '../../brand.config.json';

/**
 * Account information from derivatives/accounts endpoint
 */
export interface DerivAccount {
    account_id: string;
    balance: string;
    currency: string;
    group: string;
    status: string;
    account_type: 'demo' | 'real';
}

/**
 * Response from derivatives/accounts endpoint
 */
interface AccountsResponse {
    data: {
        data: DerivAccount[];
    };
}

/**
 * OTP response data (nested JSON string)
 */
interface OTPResponseData {
    url: string;
}

/**
 * Response from options/accounts/{accountId}/otp endpoint
 */
interface OTPResponse {
    data: string; // JSON string containing OTPResponseData
}

/**
 * Service for handling DerivWS account operations and WebSocket URL retrieval
 *
 * This service manages:
 * - Fetching account list from derivatives/accounts endpoint
 * - Storing accounts in sessionStorage
 * - Fetching OTP and WebSocket URL for specific accounts
 * - Managing default account selection
 */
export class DerivWSAccountsService {
    /**
     * Gets the DerivWS base URL based on environment
     * @returns DerivWS base URL (e.g., "https://api.derivws.com/trading/v1/")
     */
    private static getDerivWSBaseURL(): string {
        const environment = isProduction() ? 'production' : 'staging';
        return brandConfig.platform.derivws.url[environment];
    }

    /**
     * Stores accounts list in sessionStorage
     * @param accounts Array of DerivAccount objects
     */
    static storeAccounts(accounts: DerivAccount[]): void {
        sessionStorage.setItem('deriv_accounts', JSON.stringify(accounts));
        console.log('[DerivWS] Stored accounts in sessionStorage:', accounts.length);
    }

    /**
     * Retrieves accounts list from sessionStorage
     * @returns Array of DerivAccount objects or null if not found
     */
    static getStoredAccounts(): DerivAccount[] | null {
        try {
            const accountsStr = sessionStorage.getItem('deriv_accounts');
            if (!accountsStr) {
                return null;
            }
            return JSON.parse(accountsStr) as DerivAccount[];
        } catch (error) {
            console.error('[DerivWS] Error parsing stored accounts:', error);
            return null;
        }
    }

    /**
     * Gets the default account (first account from the list)
     * @returns DerivAccount object or null if no accounts available
     */
    static getDefaultAccount(): DerivAccount | null {
        const accounts = this.getStoredAccounts();
        if (!accounts || accounts.length === 0) {
            return null;
        }
        return accounts[0];
    }

    /**
     * Clears stored accounts from sessionStorage
     */
    static clearStoredAccounts(): void {
        sessionStorage.removeItem('deriv_accounts');
        console.log('[DerivWS] Cleared stored accounts');
    }

    /**
     * Fetches accounts list from derivatives/accounts endpoint
     * @param accessToken Bearer token from OAuth authentication
     * @returns Promise with array of DerivAccount objects
     */
    static async fetchAccountsList(accessToken: string): Promise<DerivAccount[]> {
        try {
            const baseURL = this.getDerivWSBaseURL();
            const OptionsDir = brandConfig.platform.derivws.directories.options;
            const endpoint = `${baseURL}${OptionsDir}accounts`;

            console.log('[DerivWS] Fetching accounts from:', endpoint);

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch accounts: ${response.status} ${response.statusText}`);
            }

            const data: AccountsResponse = await response.json();

            console.log('[DerivWS] Accounts response:', data);

            // Extract accounts array from nested data structure
            const accounts = data.data?.data || [];

            if (accounts.length === 0) {
                console.warn('[DerivWS] No accounts found in response');
            } else {
                console.log('[DerivWS] ✅ Fetched accounts:', accounts.length);
            }

            return accounts;
        } catch (error) {
            console.error('[DerivWS] Error fetching accounts:', error);
            throw error;
        }
    }

    /**
     * Fetches OTP and WebSocket URL for a specific account
     * @param accessToken Bearer token from OAuth authentication
     * @param accountId Account ID to get OTP for
     * @returns Promise with WebSocket URL
     */
    static async fetchOTPWebSocketURL(accessToken: string, accountId: string): Promise<string> {
        try {
            const baseURL = this.getDerivWSBaseURL();
            const optionsDir = brandConfig.platform.derivws.directories.options;
            const endpoint = `${baseURL}${optionsDir}accounts/${accountId}/otp`;

            console.log('[DerivWS] Fetching OTP for account:', accountId);
            console.log('[DerivWS] OTP endpoint:', endpoint);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch OTP: ${response.status} ${response.statusText}`);
            }

            const otpResponse: OTPResponse = await response.json();

            console.log('[DerivWS] OTP response received');

            // Parse the nested JSON string
            const parsedData = JSON.parse(otpResponse.data) as { data: OTPResponseData };
            const websocketURL = parsedData.data.url;

            if (!websocketURL) {
                throw new Error('WebSocket URL not found in OTP response');
            }

            console.log('[DerivWS] ✅ WebSocket URL obtained');

            return websocketURL;
        } catch (error) {
            console.error('[DerivWS] Error fetching OTP:', error);
            throw error;
        }
    }

    /**
     * Complete flow to get authenticated WebSocket URL
     * 1. Fetch accounts list
     * 2. Store accounts in sessionStorage
     * 3. Get default account (first from list)
     * 4. Fetch OTP and WebSocket URL for that account
     *
     * @param accessToken Bearer token from OAuth authentication
     * @returns Promise with WebSocket URL
     */
    static async getAuthenticatedWebSocketURL(accessToken: string): Promise<string> {
        try {
            console.log('[DerivWS] Starting authenticated WebSocket URL flow');

            // Step 1: Fetch accounts list
            const accounts = await this.fetchAccountsList(accessToken);

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts available');
            }

            // Step 2: Store accounts in sessionStorage
            this.storeAccounts(accounts);

            // Step 3: Get default account (first from list)
            const defaultAccount = accounts[0];
            console.log('[DerivWS] Using default account:', defaultAccount.account_id);

            // Step 4: Fetch OTP and WebSocket URL
            const websocketURL = await this.fetchOTPWebSocketURL(accessToken, defaultAccount.account_id);

            // Extract just the hostname and path from the WebSocket URL
            // URL format: wss://staging-api.derivws.com/trading/v1/options/ws/demo?otp=xxx
            // We need: staging-api.derivws.com/trading/v1/options/ws
            const urlObj = new URL(websocketURL);
            const hostname = urlObj.hostname;
            const pathname = urlObj.pathname.replace(/\/(demo|real)$/, ''); // Remove /demo or /real suffix

            const cleanURL = `${hostname}${pathname}`;

            console.log('[DerivWS] ✅ Authenticated WebSocket URL obtained:', cleanURL);

            return cleanURL;
        } catch (error) {
            console.error('[DerivWS] Error in authenticated WebSocket URL flow:', error);
            throw error;
        }
    }
}
// [/AI]
