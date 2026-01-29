import { TFormValues } from '../pages/bot-builder/quick-strategy/types';

export const form_name = 'ce_bot_form';
export const form_name_v2 = 'ce_bot_form_v2';
export const STORED_ITEM_NOT_FOUND = 'No results found';

export enum ACTION {
    OPEN = 'open',
    CLOSE = 'close',
    RUN_BOT = 'run_bot',
    RUN_QUICK_STRATEGY = 'run_quick_strategy',
    EDIT_QUICK_STRATEGY = 'edit_quick_strategy',
    SELECT_QUICK_STRATEGY_GUIDE = 'select_quick_strategy_guide',
    SELECT_GUIDE = 'select_guide',
    OPEN_QUICK_STRATEGY_GUIDE = 'open_quick_strategy_guide',
    SWITCH_QUICK_STRATEGY_TAB = 'switch_quick_strategy_tab',
    DASHBOARD_CLICK = 'dashboard_click',
    UPLOAD_STRATEGY_START = 'upload_strategy_start',
    UPLOAD_STRATEGY_COMPLETED = 'upload_strategy_completed',
    UPLOAD_STRATEGY_FAILED = 'upload_strategy_failed',
    GOOGLE_DRIVE_CONNECT = 'google_drive_connect',
    GOOGLE_DRIVE_DISCONNECT = 'google_drive_disconnect',
    SWITCH_LOAD_STRATEGY_TAB = 'switch_load_strategy_tab',
    ANNOUNCEMENT_CLICK = 'announcement_click',
    ANNOUNCEMENT_ACTION = 'announcement_action',
}

export type TFormStrategy = {
    form_values: TFormValues;
} & TSelectedStrategy;

export type TSelectedStrategy = {
    selected_strategy: string;
};

// V2 Event Types for ce_bot_form_v2
export interface TBotFormV2BaseEvent {
    form_name: string;
    subpage_name?: string;
    subform_name?: string;
    subform_source?: string;
    account_type?: string;
    device_type?: string;
}

export interface TDashboardClickEvent extends TBotFormV2BaseEvent {
    dashboard_click_name: string;
}

export interface TAnnouncementEvent extends TBotFormV2BaseEvent {
    announcement_name: string;
    announcement_action?: string;
}

export interface TUploadStrategyEvent extends TBotFormV2BaseEvent {
    upload_provider: string;
    upload_id: string;
    upload_type?: string;
    strategy_name?: string;
    asset?: string;
    trade_type?: string;
    error_message?: string;
    error_code?: string;
}

export interface TQuickStrategyEvent extends TBotFormV2BaseEvent {
    strategy_name?: string;
    asset?: string;
    trade_type?: string;
    quick_strategy_tab?: string;
}

export interface TGuideEvent extends TBotFormV2BaseEvent {
    guide_tab_name?: 'step_by_step_guides' | 'videos_on_dbot';
    guide_name?: string;
}

export interface TLoadStrategyEvent extends TBotFormV2BaseEvent {
    load_strategy_tab?: string;
}

export interface TSearchEvent extends TBotFormV2BaseEvent {
    search_term: string;
}

// Analytics type definitions
export interface AnalyticsTracker {
    trackEvent: (eventName: string, properties: Record<string, unknown>) => void;
}

// Constants for localStorage keys
export const ACCOUNT_TYPE_KEY = 'account_type';
export const MAX_MOBILE_WIDTH = 600;
