import { action, computed, makeObservable, observable } from 'mobx';
import { getAccountId } from '@/analytics/utils';
import { isEmptyObject } from '@/components/shared';
import { isMultipliersOnly, isOptionsBlocked } from '@/components/shared/common/utility';
import { removeCookies } from '@/components/shared/utils/storage/storage';
import { observer as globalObserver, observer } from '@/external/bot-skeleton';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import type { Balance } from '@deriv/api-types';
import { Analytics } from '@deriv-com/analytics';
import {
    authData$,
    setAccountList,
    setAuthData,
    setIsAuthorized,
} from '../external/bot-skeleton/services/api/observables/connection-status-stream';
import { LogoutService } from '../services/logout.service';
import { WhoAmIService } from '../services/whoami.service';
import type { TAuthData } from '../types/api-types';
import type RootStore from './root-store';

export default class ClientStore {
    loginid = '';
    account_list: TAuthData['account_list'] = [];
    balance = '0';
    currency = 'AUD';
    is_logged_in = false;
    is_account_regenerating = false;

    accounts: Record<string, TAuthData['account_list'][number]> = {};
    all_accounts_balance: Balance | null = null;
    is_logging_out = false;

    private authDataSubscription: { unsubscribe: () => void } | null = null;
    private root_store: RootStore;
    private tab_visibility_handler: ((event: Event) => void) | null = null;
    private focus_handler: ((event: FocusEvent) => void) | null = null;
    private whoami_in_progress = false;
    private ws_login_id: string | null = null;
    private is_regenerating = false;
    private instance_id: string = '';

    // TODO: fix with self exclusion

    onAuthorizeEvent = (data: {
        account_list?: TAuthData['account_list'];
        current_account?: { loginid: string; currency: string; is_virtual: number; balance?: number };
    }) => {
        if (data?.account_list) {
            this.setAccountList(data.account_list);
        }

        // Update current account details from new API structure
        if (data?.current_account) {
            this.setLoginId(data.current_account.loginid);
            this.setCurrency(data.current_account.currency);
            this.setIsLoggedIn(true);
            localStorage.setItem('active_loginid', data.current_account.loginid);

            // Store the login ID used for WebSocket connection
            this.setWebSocketLoginId(data.current_account.loginid);

            if (typeof data.current_account.balance === 'number') {
                this.setBalance(data.current_account.balance.toString());
            }

            // Check session validity after successful authorization
            this.checkWhoAmI();
        }
    };

    constructor(root_store: RootStore) {
        this.root_store = root_store;
        // Subscribe to auth data changes
        this.authDataSubscription = authData$.subscribe(() => {});

        observer.register('api.authorize', this.onAuthorizeEvent);

        // Clean up any existing instance before registering new one to prevent memory leaks
        const existingId = globalObserver.getState('client.store.id');
        if (existingId) {
            globalObserver.setState({ 'client.store': null, 'client.store.id': null });
        }

        // Register this instance with the global observer so api-base can access it
        // Store a reference to this instance with a cryptographically secure unique ID to prevent memory leaks
        // Use crypto.getRandomValues for better uniqueness and security than Math.random()
        this.instance_id = `client_store_${Date.now()}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;
        globalObserver.setState({ 'client.store': this, 'client.store.id': this.instance_id });

        // Set up visibility change listener to check whoami when tab becomes visible
        this.setupVisibilityListener();

        // Set up focus listener to check whoami when window gets focus
        this.setupFocusListener();

        makeObservable(this, {
            accounts: observable,
            account_list: observable,

            all_accounts_balance: observable,
            balance: observable,
            currency: observable,

            is_logged_in: observable,
            is_account_regenerating: observable,
            loginid: observable,
            is_logging_out: observable,
            active_accounts: computed,
            is_bot_allowed: computed,

            is_eu_or_multipliers_only: computed,
            is_low_risk: computed,
            is_multipliers_only: computed,
            is_options_blocked: computed,
            is_virtual: computed,

            residence: computed,

            logout: action,
            onAuthorizeEvent: action,
            setAccountList: action,

            setAllAccountsBalance: action,
            setIsAccountRegenerating: action,
            setBalance: action,
            setCurrency: action,
            setIsLoggedIn: action,
            setIsLoggingOut: action,
            setLoginId: action,

            is_trading_experience_incomplete: computed,
            is_cr_account: computed,
            account_open_date: computed,
        });
    }

    get active_accounts() {
        return this.accounts instanceof Object
            ? Object.values(this.accounts).filter(account => !account.is_disabled)
            : [];
    }

    get is_bot_allowed() {
        return this.isBotAllowed();
    }
    get is_trading_experience_incomplete() {
        return false;
    }

    get is_low_risk() {
        return false;
    }

    get residence() {
        return '';
    }

    get is_options_blocked() {
        return isOptionsBlocked(this.residence);
    }

    get is_multipliers_only() {
        return isMultipliersOnly(this.residence);
    }

    get is_eu_or_multipliers_only() {
        // Always return false - EU restrictions now handled by backend
        return false;
    }

    get is_virtual() {
        return !isEmptyObject(this.accounts) && this.accounts[this.loginid] && !!this.accounts[this.loginid].is_virtual;
    }

    get all_loginids() {
        return !isEmptyObject(this.accounts) ? Object.keys(this.accounts) : [];
    }

    get virtual_account_loginid() {
        return this.all_loginids.find(loginid => !!this.accounts[loginid].is_virtual);
    }

    get is_cr_account() {
        return this.loginid?.startsWith('CR');
    }

    get should_hide_header() {
        return false;
    }

    get account_open_date() {
        if (isEmptyObject(this.accounts) || !this.accounts[this.loginid]) return undefined;
        return Object.keys(this.accounts[this.loginid]).includes('created_at')
            ? this.accounts[this.loginid].created_at
            : undefined;
    }

    isBotAllowed = () => {
        return this.is_virtual ? this.is_eu_or_multipliers_only : !this.is_options_blocked;
    };

    setLoginId = (loginid: string) => {
        this.loginid = loginid;
    };

    setAccountList = (account_list?: TAuthData['account_list']) => {
        this.accounts = {};
        account_list?.forEach(account => {
            this.accounts[account.loginid] = account;
        });
        if (account_list) this.account_list = account_list;

        // Check session validity after account list is set
        if (this.is_logged_in) {
            this.checkWhoAmI();
        }
    };

    setBalance = (balance: string) => {
        this.balance = balance;
    };

    setCurrency = (currency: string) => {
        this.currency = currency;
    };

    setIsLoggedIn = (is_logged_in: boolean) => {
        this.is_logged_in = is_logged_in;
    };

    getCurrency = () => {
        const clientAccounts = JSON.parse(localStorage.getItem('clientAccounts') ?? '{}');
        return clientAccounts[this.loginid]?.currency ?? '';
    };

    getToken = () => {
        const accountList = JSON.parse(localStorage.getItem('accountsList') ?? '{}');
        return accountList[this.loginid] ?? '';
    };

    setAllAccountsBalance = (all_accounts_balance: Balance | undefined) => {
        this.all_accounts_balance = all_accounts_balance ?? null;
    };
    setIsAccountRegenerating = (is_loading: boolean) => {
        this.is_account_regenerating = is_loading;
    };

    setIsLoggingOut = (is_logging_out: boolean) => {
        this.is_logging_out = is_logging_out;
    };

    /**
     * Request logout via WebSocket (legacy method for backward compatibility)
     * @returns Promise with logout response
     */

    logout = async () => {
        if (localStorage.getItem('active_loginid')) {
            const response = await LogoutService.requestRestLogout();

            if (response?.logout === 1) {
                // reset all the states
                this.account_list = [];

                this.accounts = {};
                this.is_logged_in = false;
                this.loginid = '';
                this.balance = '0';
                this.currency = 'USD';

                this.all_accounts_balance = null;

                localStorage.removeItem('active_loginid');
                localStorage.removeItem('accountsList');
                localStorage.removeItem('authToken');
                localStorage.removeItem('clientAccounts');
                localStorage.removeItem('account_type'); // Clear account type on logout
                removeCookies('client_information');

                setIsAuthorized(false);
                setAccountList([]);
                setAuthData(null);

                this.setIsLoggingOut(false);

                Analytics.reset();

                // disable livechat
                window.LC_API?.close_chat?.();
                window.LiveChatWidget?.call('hide');

                // shutdown and initialize intercom
                if (window.Intercom) {
                    window.Intercom('shutdown');
                    window.DerivInterCom.initialize({
                        hideLauncher: true,
                        token: null,
                    });
                }
            }
        }
    };

    /**
     * Checks session validity via whoami service and handles cleanup if needed
     */
    async checkWhoAmI() {
        if (!this.is_logged_in || this.whoami_in_progress) return; // Only check if logged in and not already checking

        this.whoami_in_progress = true;
        try {
            const result = await WhoAmIService.checkWhoAmI();

            // If we get 401 error, user's session is invalid - log them out
            if (result.error?.code === 401) {
                await this.logout();
            }
        } finally {
            this.whoami_in_progress = false;
        }
    }

    /**
     * Sets up visibility change listener to check whoami when tab becomes visible
     */
    setupVisibilityListener() {
        //need to call check who am i rest api in every tab switch
        // Remove existing listener if any
        this.removeVisibilityListener();

        // Create handler function - make it async to properly coordinate operations
        this.tab_visibility_handler = async () => {
            if (document.visibilityState === 'visible' && !this.is_regenerating) {
                // Tab became visible - check whoami first and await its completion
                await this.checkWhoAmI();

                // Only regenerate if still logged in after whoami check
                if (this.is_logged_in && !this.whoami_in_progress) {
                    this.checkAndRegenerateWebSocket();
                }
            }
        };

        // Add listener
        document.addEventListener('visibilitychange', this.tab_visibility_handler);
    }

    /**
     * Set the current WebSocket login ID
     * @param login_id The login ID used for the WebSocket connection
     */
    setWebSocketLoginId(login_id: string) {
        this.ws_login_id = login_id;
    }

    /**
     * Check if WebSocket needs to be regenerated based on login ID comparison
     * @returns True if WebSocket needs regeneration, false otherwise
     */
    needsWebSocketRegeneration(): boolean {
        const active_login_id = getAccountId();
        return (
            !this.is_regenerating &&
            !!active_login_id &&
            !!this.ws_login_id &&
            active_login_id !== this.ws_login_id &&
            !api_base.is_running
        );
    }

    /**
     * Check if WebSocket needs regeneration and regenerate if needed
     */
    checkAndRegenerateWebSocket() {
        if (this.needsWebSocketRegeneration()) {
            this.regenerateWebSocket();
        }
    }

    /**
     * Regenerate WebSocket connection with the new login ID
     * This method clears all data and creates a new connection with the current active login ID
     * Protected against race conditions with the is_regenerating flag
     * Includes error handling to prevent users from being stuck in loading state
     */
    async regenerateWebSocket() {
        if (this.is_regenerating) return;

        this.is_regenerating = true;
        this.setIsAccountRegenerating(true);

        try {
            const active_login_id = getAccountId();

            if (active_login_id) {
                this.account_list = [];

                this.accounts = {};
                this.setIsLoggedIn(false);

                this.balance = '0';
                this.currency = 'USD';

                this.all_accounts_balance = null;

                localStorage.removeItem('accountsList');
                localStorage.removeItem('authToken');
                localStorage.removeItem('clientAccounts');
                localStorage.removeItem('account_type'); // Clear account type on logout
                removeCookies('client_information');

                setIsAuthorized(false);
                setAccountList([]);
                setAuthData(null);

                this.setIsLoggingOut(false);

                Analytics.reset();

                // disable livechat
                window.LC_API?.close_chat?.();
                window.LiveChatWidget?.call('hide');

                // Force create a new connection with the current active login ID
                // Wrap the potentially failing init call in a try-catch
                try {
                    await api_base.init(true); // ✅ Await the async call
                } catch (initError) {
                    console.error('WebSocket initialization failed:', initError);
                    this.setIsAccountRegenerating(false);
                    throw initError; // Re-throw to be caught by outer catch if needed
                }

                // Update the tracked WebSocket login ID
                this.setWebSocketLoginId(active_login_id);
            }
        } catch (error) {
            console.error('WebSocket regeneration failed:', error);
            this.setIsAccountRegenerating(false);
            // Consider showing user-facing error notification here
            // or dispatching an event that UI components can listen to
        } finally {
            this.is_regenerating = false;
        }
    }

    /**
     * Sets up focus listener to check whoami when window gets focus
     */
    setupFocusListener() {
        // Remove existing listener if any
        this.removeFocusListener();

        // Create handler function - make it async to properly coordinate operations
        this.focus_handler = async () => {
            if (!this.is_regenerating) {
                await this.checkWhoAmI();
            }
        };

        // Add listener
        window.addEventListener('focus', this.focus_handler);
    }

    /**
     * Removes the focus listener
     */
    removeFocusListener() {
        if (this.focus_handler) {
            window.removeEventListener('focus', this.focus_handler);
            this.focus_handler = null;
        }
    }

    /**
     * Removes the visibility change listener
     */
    removeVisibilityListener() {
        if (this.tab_visibility_handler) {
            document.removeEventListener('visibilitychange', this.tab_visibility_handler);
            this.tab_visibility_handler = null;
        }
    }

    destroy() {
        this.authDataSubscription?.unsubscribe();
        observer.unregister('api.authorize', this.onAuthorizeEvent);
        this.removeVisibilityListener();
        this.removeFocusListener();
        // Cancel any in-flight whoami checks
        this.whoami_in_progress = false;

        // Properly clean up the global observer reference
        // Only clear if this instance is the one referenced by checking the instance ID
        const storedId = globalObserver.getState('client.store.id');
        if (storedId === this.instance_id) {
            globalObserver.setState({ 'client.store': null, 'client.store.id': null });
        }
    }
}
