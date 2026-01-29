import { Analytics } from '@deriv-com/analytics';
import { ACTION, AnalyticsTracker, form_name_v2, TLoadStrategyEvent } from './constants';

const tracker = Analytics as unknown as AnalyticsTracker;

export const rudderStackSendSwitchLoadStrategyTabEvent = ({ load_strategy_tab }: TLoadStrategyEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.SWITCH_LOAD_STRATEGY_TAB,
        form_name: form_name_v2,
        load_strategy_tab,
        subform_name: 'load_strategy',
        subpage_name: 'bot_builder',
    });
};
