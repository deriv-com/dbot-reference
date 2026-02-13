/**
 * Type declarations for @deriv/stores/types
 *
 * This module was originally part of the Deriv internal monorepo.
 * These type definitions provide the minimal interface needed by this project.
 */

import { ProposalOpenContract } from '@deriv/api-types';

export type TStores = {
    client: {
        loginid: string;
        is_logged_in: boolean;
        is_virtual: boolean;
        currency: string;
        account_list: Array<{
            balance: number;
            currency: string;
            is_virtual: number;
            loginid: string;
        }>;
        balance: string;
        accounts: Record<string, unknown>;
        is_bot_allowed: boolean;
    };
    ui: {
        is_mobile: boolean;
        is_desktop: boolean;
        is_dark_mode_on: boolean;
        setPromptHandler: (should_show: boolean) => void;
        setAccountSwitcherDisabledMessage: (message?: string) => void;
    };
    common: {
        is_socket_opened: boolean;
        server_time: unknown;
    };
};

export type TPortfolioPosition = {
    id: number;
    contract_info: ProposalOpenContract;
};

export type TNotificationMessage = {
    key: string;
    header: string;
    message?: string;
    type: string;
    platform?: string;
    is_persistent?: boolean;
    is_disposable?: boolean;
    action?: {
        text: string;
        onClick: () => void;
    };
};
