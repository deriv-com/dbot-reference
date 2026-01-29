import { Analytics } from '@deriv-com/analytics';
import { ACTION, AnalyticsTracker, form_name_v2, type TFormStrategy, TQuickStrategyEvent } from './constants';
import { getRsStrategyType, getTradeParameterData } from './utils';

const tracker = Analytics as unknown as AnalyticsTracker;

export const rudderStackSendQsRunStrategyEvent = ({
    form_values,
    selected_strategy,
    account_type,
    device_type,
}: TFormStrategy & {
    account_type?: string;
    device_type?: string;
}) => {
    const tradeData = getTradeParameterData({ form_values, selected_strategy });
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.RUN_QUICK_STRATEGY,
        form_name: form_name_v2,
        subform_name: 'quick_strategy',
        strategy_name: getRsStrategyType(selected_strategy),
        asset: tradeData?.asset_type,
        trade_type: tradeData?.trade_type,
        account_type,
        device_type,
    });
};

export const rudderStackSendQsEditStrategyEvent = ({ form_values, selected_strategy }: TFormStrategy) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.EDIT_QUICK_STRATEGY,
        form_name: form_name_v2,
        subform_name: 'quick_strategy',
        strategy_name: getRsStrategyType(selected_strategy),
        ...getTradeParameterData({ form_values, selected_strategy }),
    });
};

export const rudderStackSendQsSelectedTabEvent = ({ quick_strategy_tab }: TQuickStrategyEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.SWITCH_QUICK_STRATEGY_TAB,
        form_name: form_name_v2,
        subform_name: 'quick_strategy',
        quick_strategy_tab,
    });
};
