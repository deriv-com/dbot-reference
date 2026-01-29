import { Analytics } from '@deriv-com/analytics';
import { ACTION, AnalyticsTracker, form_name_v2, TBotFormV2BaseEvent, TUploadStrategyEvent } from './constants';

const tracker = Analytics as unknown as AnalyticsTracker;

export const rudderStackSendOpenEvent = ({
    subpage_name,
    subform_source,
    subform_name,
    load_strategy_tab,
}: TBotFormV2BaseEvent & { load_strategy_tab?: string }) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.OPEN,
        form_name: form_name_v2,
        subpage_name,
        subform_name,
        subform_source,
        load_strategy_tab,
    });
};

// Removed rudderStackSendCloseEvent as per requirements - no close events needed in V2

export const rudderStackSendRunBotEvent = ({ subpage_name }: TBotFormV2BaseEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.RUN_BOT,
        form_name: form_name_v2,
        subpage_name,
    });
};

export const rudderStackSendUploadStrategyStartEvent = ({ upload_provider, upload_id }: TUploadStrategyEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.UPLOAD_STRATEGY_START,
        form_name: form_name_v2,
        subform_name: 'load_strategy',
        subpage_name: 'bot_builder',
        upload_provider,
        upload_id,
    });
};

export const rudderStackSendUploadStrategyCompletedEvent = ({
    upload_provider,
    upload_id,
    upload_type,
    strategy_name,
    asset,
    trade_type,
    account_type,
    device_type,
}: TUploadStrategyEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.UPLOAD_STRATEGY_COMPLETED,
        form_name: form_name_v2,
        subform_name: 'load_strategy',
        subpage_name: 'bot_builder',
        upload_provider,
        upload_id,
        upload_type,
        strategy_name,
        asset,
        trade_type,
        account_type,
        device_type,
    });
};

export const rudderStackSendUploadStrategyFailedEvent = ({
    upload_provider,
    upload_id,
    upload_type,
    error_message,
    error_code,
}: TUploadStrategyEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.UPLOAD_STRATEGY_FAILED,
        form_name: form_name_v2,
        subform_name: 'load_strategy',
        subpage_name: 'bot_builder',
        upload_provider,
        upload_id,
        upload_type,
        error_message,
        error_code,
    });
};

export const rudderStackSendGoogleDriveConnectEvent = () => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.GOOGLE_DRIVE_CONNECT,
        form_name: form_name_v2,
        subpage_name: 'bot_builder',
    });
};

export const rudderStackSendGoogleDriveDisconnectEvent = () => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.GOOGLE_DRIVE_DISCONNECT,
        form_name: form_name_v2,
        subpage_name: 'bot_builder',
    });
};
