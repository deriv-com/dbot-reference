import { Analytics } from '@deriv-com/analytics';
import { ACTION, AnalyticsTracker, form_name_v2, TSearchEvent, TSelectedStrategy } from './constants';
import { getRsStrategyType } from './utils';

const tracker = Analytics as unknown as AnalyticsTracker;

export const rudderStackSendSelectQsStrategyGuideEvent = ({ selected_strategy }: TSelectedStrategy) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.SELECT_QUICK_STRATEGY_GUIDE,
        form_name: form_name_v2,
        subpage_name: 'tutorials',
        strategy_name: getRsStrategyType(selected_strategy),
    });
};

export const rudderStackSendTutorialSearchEvent = ({ search_term }: TSearchEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: 'search',
        form_name: form_name_v2,
        subpage_name: 'tutorials',
        search_term,
    });
};

// New event: select_guide - when user clicks on Guide tab from Tutorials
export const rudderStackSendSelectGuideEvent = ({
    guide_tab_name,
    guide_name,
    account_type,
    device_type,
}: {
    guide_tab_name?: 'step_by_step_guides' | 'videos_on_dbot';
    guide_name?: string;
    account_type?: string;
    device_type?: string;
}) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.SELECT_GUIDE,
        form_name: form_name_v2,
        subpage_name: 'tutorials',
        guide_tab_name,
        guide_name,
        account_type,
        device_type,
    });
};

// New event: open_quick_strategy_guide - when user clicks on strategy tutorials
export const rudderStackSendOpenQuickStrategyGuideEvent = ({
    account_type,
    device_type,
}: {
    account_type?: string;
    device_type?: string;
}) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.OPEN_QUICK_STRATEGY_GUIDE,
        form_name: form_name_v2,
        subpage_name: 'tutorials',
        subform_name: 'quick_strategy',
        account_type,
        device_type,
    });
};
