import { STRATEGIES } from '../pages/bot-builder/quick-strategy/config';
import { ACCOUNT_TYPE_KEY, MAX_MOBILE_WIDTH, STORED_ITEM_NOT_FOUND, TFormStrategy } from './constants';

export const rudderstack_text_error = 'Rudderstack: unable to get dropdown text';

export const getRsDropdownTextFromLocalStorage = () => {
    try {
        return JSON.parse(localStorage?.getItem('qs-analytics') ?? '{}');
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(rudderstack_text_error);
        return {};
    }
};

const hasStoredText = (parameter: string) => parameter && parameter !== STORED_ITEM_NOT_FOUND;

export const getRsStrategyType = (selected_strategy: string) => STRATEGIES()[selected_strategy]?.rs_strategy_name;

export const getQsActiveTabString = (tab: string) => (tab === 'TRADE_PARAMETERS' ? 'trade parameters' : 'learn more');

enum LOAD_MODAL_TABS_VALUE {
    recent = 'recent',
    local = 'local',
    google_drive = 'google drive',
}
export const LOAD_MODAL_TABS = Object.values(LOAD_MODAL_TABS_VALUE);

export const getTradeParameterData = ({ form_values }: TFormStrategy) => {
    if (!form_values) return;

    const { symbol, tradetype, type, stake } = form_values;
    const stored_texts = getRsDropdownTextFromLocalStorage();

    return {
        asset_type: hasStoredText(stored_texts?.symbol) ? stored_texts.symbol : symbol,
        trade_type: hasStoredText(stored_texts?.tradetype) ? stored_texts?.tradetype : tradetype,
        purchase_condition: hasStoredText(stored_texts?.type) ? stored_texts?.type : type,
        initial_stake: hasStoredText(stored_texts?.stake) ? stored_texts?.stake : stake,
    };
};

export const getStrategyType = (block_string: string | ArrayBuffer) => {
    try {
        const xmlDoc = new DOMParser().parseFromString(block_string.toString(), 'application/xml');
        if (xmlDoc.getElementsByTagName('xml').length) {
            const root = xmlDoc.documentElement;
            const isDbotValue = root.getAttribute('is_dbot');
            return isDbotValue === 'true' ? 'new' : 'old';
        }
        return 'old';
    } catch (e) {
        return 'old';
    }
};

/**
 * Check if a loginid represents a demo account
 * Demo accounts have specific prefixes:
 * - VRTC: Classic demo accounts
 * - VRW: Demo wallet accounts
 * -Starts with DEM: Demo accounts with DEM prefix
 *
 * @param loginid - The account loginid to check
 * @returns true if demo account, false otherwise
 */
export const isDemoAccount = (loginid: string): boolean => {
    if (!loginid) return false;
    // Demo accounts: VRTC (classic), VRW (wallets), or DEM prefix
    return (
        loginid.startsWith('VRTC') ||
        loginid.startsWith('VRW') ||
        loginid.startsWith('DEM') ||
        loginid.startsWith('DOT')
    );
};

/**
 * Get account type based on loginid and localStorage
 * This is the centralized function for determining account type
 * Loginid is the primary source of truth when provided
 *
 * @param loginid - Optional loginid to check (if not provided, uses localStorage only)
 * @returns 'demo' or 'real' or public if cannot determine
 */
export const getAccountType = (loginid?: string): string | undefined => {
    try {
        // If loginid is provided, use it as the source of truth
        if (loginid) {
            return isDemoAccount(loginid) ? 'demo' : 'real';
        }

        // Only fallback to public when loginid is not available
        return 'public';
    } catch (error) {
        // Handle cases where localStorage is not available (SSR, private browsing, etc.)
        return 'public';
    }
};

/**
 * Gets account_id with priority: URL parameter > localStorage > null
 * @returns account_id string or null
 */
export const getAccountId = (): string | null => {
    // 1. Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const accountIdFromUrl = urlParams.get('account_id');

    const tokenFromUrl = urlParams.get('token');
    // Remove token from URL if present
    // Note: We don't return after removing token because it's not needed for further processing
    if (tokenFromUrl) {
        removeUrlParameter('token');
    }

    if (accountIdFromUrl) {
        // Store account ID in localStorage for future use
        localStorage.setItem('active_loginid', accountIdFromUrl);
        // Remove from URL after storing
        removeUrlParameter('account_id');
        // Return the account ID immediately as it takes precedence over localStorage
        return accountIdFromUrl;
    }

    // 2. Check localStorage
    return localStorage.getItem('active_loginid');
};

/**
 * Check if current account is virtual/demo
 * Loginid is the primary source of truth - if provided and valid, it takes precedence
 * Only falls back to localStorage when loginid is not available or empty
 *
 * @param loginid - The account loginid to check
 * @returns true if demo/virtual account, false otherwise
 */
export const isVirtualAccount = (loginid: string): boolean => {
    // If loginid is provided and valid, use it as the source of truth
    if (loginid) {
        return isDemoAccount(loginid);
    }

    // Only fallback to localStorage when loginid is not available
    try {
        const savedAccountType = localStorage.getItem(ACCOUNT_TYPE_KEY);
        return savedAccountType === 'demo';
    } catch (error) {
        return false;
    }
};

/**
 * Get device type based on screen width
 * @returns 'mobile' or 'desktop'
 */
export const getDeviceType = () => {
    // SSR safety check and use constant for breakpoint
    if (typeof window === 'undefined') return 'desktop';
    return window.innerWidth <= MAX_MOBILE_WIDTH ? 'mobile' : 'desktop';
};

/**
 * Removes a parameter from the current URL without page reload
 * @param paramName - The name of the parameter to remove
 */
export const removeUrlParameter = (paramName: string): void => {
    const url = new URL(window.location.href);
    url.searchParams.delete(paramName);
    window.history.replaceState({}, document.title, url.toString());
};
