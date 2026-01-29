import { Analytics } from '@deriv-com/analytics';
import { ACTION, AnalyticsTracker, form_name_v2, TAnnouncementEvent, TDashboardClickEvent } from './constants';

const tracker = Analytics as unknown as AnalyticsTracker;

export const rudderStackSendDashboardClickEvent = ({ dashboard_click_name, subpage_name }: TDashboardClickEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.DASHBOARD_CLICK,
        form_name: form_name_v2,
        subpage_name,
        dashboard_click_name,
    });
};

export const rudderStackSendAnnouncementClickEvent = ({ announcement_name }: TAnnouncementEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.ANNOUNCEMENT_CLICK,
        form_name: form_name_v2,
        subform_name: 'announcements',
        subform_source: 'dashboard',
        announcement_name,
    });
};

export const rudderStackSendAnnouncementActionEvent = ({
    announcement_name,
    announcement_action,
}: TAnnouncementEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.ANNOUNCEMENT_ACTION,
        form_name: form_name_v2,
        subform_name: 'announcements',
        subform_source: 'dashboard',
        announcement_name,
        announcement_action,
    });
};
