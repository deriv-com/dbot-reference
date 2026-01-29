import { Analytics } from '@deriv-com/analytics';
import { TChartStateChangeOption } from '@deriv-com/smartcharts-champion';
import { AnalyticsTracker, TBotFormV2BaseEvent } from './constants';
import { getAccountType, getDeviceType } from './utils';

// Define STATE_TYPES constants
export const STATE_TYPES = {
    CHART_MODE_MODAL_OPEN: 'CHART_MODE_MODAL_OPEN',
    CHART_INTERVAL_CHANGE: 'CHART_INTERVAL_CHANGE',
    CHART_TYPE_CHANGE: 'CHART_TYPE_CHANGE',
    CHART_SWITCH_TOGGLE: 'CHART_SWITCH_TOGGLE',
    MARKET_MENU_MODAL_TOGGLE: 'MARKET_MENU_MODAL_TOGGLE',
    FAVORITE_MARKETS_TOGGLE: 'FAVORITE_MARKETS_TOGGLE',
    INDICATOR_ADDED: 'INDICATOR_ADDED',
    INDICATOR_DELETED: 'INDICATOR_DELETED',
    INDICATOR_EDITED: 'INDICATOR_EDITED',
    INDICATOR_INFO_TOGGLE: 'INDICATOR_INFO_TOGGLE',
    INDICATOR_SEARCH: 'INDICATOR_SEARCH',
    INDICATOR_SETTINGS_OPEN: 'INDICATOR_SETTINGS_OPEN',
    INDICATORS_CLEAR_ALL: 'INDICATORS_CLEAR_ALL',
    INDICATORS_MODAL_OPEN: 'INDICATORS_MODAL_OPEN',
    INITIAL: 'INITIAL',
    MARKET_SEARCH: 'MARKET_SEARCH',
    MARKET_STATE_CHANGE: 'MARKET_STATE_CHANGE',
    READY: 'READY',
    SCROLL_TO_LEFT: 'SCROLL_TO_LEFT',
    SET_CHART_MODE: 'SET_CHART_MODE',
    SYMBOL_CHANGE: 'SYMBOL_CHANGE',
    DRAWING_TOOLS_OPEN: 'DRAWING_TOOLS_OPEN',
    DRAWING_TOOLS_ADD: 'DRAWING_TOOLS_ADD',
    DRAWING_TOOLS_DELETE: 'DRAWING_TOOLS_DELETE',
    DRAWING_TOOLS_EDIT_PX: 'DRAWING_TOOLS_EDIT_PX',
    DRAWING_TOOLS_EDIT_COLOR: 'DRAWING_TOOLS_EDIT_COLOR',
    DRAWING_TOOLS_MODAL_OPEN: 'DRAWING_TOOLS_MODAL_OPEN',
    CROSSHAIR_CLICK: 'CROSSHAIR_CLICK',
} as const;

const tracker = Analytics as AnalyticsTracker;

export const CHART_ACTION = {
    ADD_ACTIVE: 'add_active',
    ADD_TO_FAVORITES: 'add_to_favorites',
    CHOOSE_CHART_TYPE: 'choose_chart_type',
    CHOOSE_MARKET_TYPE: 'choose_market_type',
    CHOOSE_TIME_INTERVAL: 'choose_time_interval',
    CLEAN_ALL_ACTIVE: 'clean_all_active',
    CLOSE: 'close',
    DELETE_ACTIVE: 'delete_active',
    DELETE_FROM_FAVORITES: 'delete_from_favorites',
    EDIT_ACTIVE: 'edit_active',
    INFO_OPEN: 'info_open',
    INFO_CLOSE: 'info_close',
    INFO_REDIRECT: 'info_redirect',
    OPEN: 'open',
    SEARCH: 'search',
    ADD_DRAWING_TOOL: 'add',
    DELETE_DRAWING_TOOL: 'delete',
    EDIT_DRAWING_TOOL_PX: 'edit_px',
    EDIT_DRAWING_TOOL_COLOR: 'edit_color',
    CROSSHAIR_CLICK: 'click',
    CHART_SMOOTHING_TOGGLE: 'switch_toggle',
} as const;

interface TChartAnalyticsBaseEvent {
    action: string;
    chart_type_name?: string;
    time_interval_name?: string;
    indicator_type_name?: string;
    indicators_category_name?: string;
    market_type_name?: string;
    tab_market_name?: string;
    search_string?: string;
    drawing_tool_name?: string;
    pxthickness?: string;
    color_name?: string;
    cta_name?: string;
    account_type: TBotFormV2BaseEvent['account_type'];
    device_type: TBotFormV2BaseEvent['device_type'];
}

const getChartTypeFormAnalyticsData = (state: keyof typeof STATE_TYPES, option: TChartStateChangeOption = {}) => {
    const { chart_type_name = '', time_interval_name } = option;
    const chart_event_type = 'ce_chart_types_form_v2';

    if (state === STATE_TYPES.CHART_MODE_MODAL_OPEN) {
        return {
            event_type: chart_event_type,
            data: {
                action: CHART_ACTION.OPEN,
                account_type: getAccountType(),
                device_type: getDeviceType(),
            },
        };
    }

    const data: TChartAnalyticsBaseEvent = {
        action: '',
        chart_type_name,
        time_interval_name,
        account_type: getAccountType(),
        device_type: getDeviceType(),
    };

    if (!chart_type_name) return { event_type: '', data: {} };

    switch (state) {
        case STATE_TYPES.CHART_INTERVAL_CHANGE:
            data.action = CHART_ACTION.CHOOSE_TIME_INTERVAL;
            break;
        case STATE_TYPES.CHART_TYPE_CHANGE:
            data.action = CHART_ACTION.CHOOSE_CHART_TYPE;
            break;
        case STATE_TYPES.CHART_SWITCH_TOGGLE:
            data.action = CHART_ACTION.CHART_SMOOTHING_TOGGLE;
            break;
        default:
            return { event_type: '', data: {} };
    }
    return { event_type: chart_event_type, data };
};

const getCrossHairAnalyticsData = (state: keyof typeof STATE_TYPES, option: TChartStateChangeOption = {}) => {
    const { cta_name = '' } = option;
    const chart_event_type = 'ce_crosshair_v2';

    const data: TChartAnalyticsBaseEvent = {
        action: '',
        cta_name,
        account_type: getAccountType(),
        device_type: getDeviceType(),
    };

    switch (state) {
        case STATE_TYPES.CROSSHAIR_CLICK:
            data.action = CHART_ACTION.CROSSHAIR_CLICK;
            break;
        default:
            return { event_type: '', data: {} };
    }
    return { event_type: chart_event_type, data };
};

const getIndicatorTypeFormAnalyticsData = (state: keyof typeof STATE_TYPES, option: TChartStateChangeOption = {}) => {
    const { indicator_type_name = '', indicators_category_name = '', is_info_open, search_string } = option;
    const indicators_event_type = 'ce_indicators_types_form_v2';
    const info_open_close_action = is_info_open ? CHART_ACTION.INFO_OPEN : CHART_ACTION.INFO_CLOSE;

    const data: TChartAnalyticsBaseEvent = {
        action: '',
        account_type: getAccountType(),
        device_type: getDeviceType(),
    };

    if (
        (state === STATE_TYPES.INDICATOR_SEARCH && !option.search_string) ||
        ((state === STATE_TYPES.INDICATOR_ADDED ||
            state === STATE_TYPES.INDICATOR_DELETED ||
            state === STATE_TYPES.INDICATOR_EDITED ||
            state === STATE_TYPES.INDICATOR_INFO_TOGGLE ||
            state === STATE_TYPES.INDICATOR_SETTINGS_OPEN) &&
            !indicator_type_name)
    ) {
        return { event_type: '', data: {} };
    }

    switch (state) {
        case STATE_TYPES.INDICATOR_ADDED:
            data.action = CHART_ACTION.ADD_ACTIVE;
            data.indicator_type_name = indicator_type_name;
            data.indicators_category_name = indicators_category_name;
            break;
        case STATE_TYPES.INDICATOR_DELETED:
            data.action = CHART_ACTION.DELETE_ACTIVE;
            data.indicator_type_name = indicator_type_name;
            data.indicators_category_name = indicators_category_name;
            break;
        case STATE_TYPES.INDICATOR_EDITED:
            data.action = CHART_ACTION.EDIT_ACTIVE;
            data.indicator_type_name = indicator_type_name;
            data.indicators_category_name = indicators_category_name;
            break;
        case STATE_TYPES.INDICATOR_INFO_TOGGLE:
            data.action = info_open_close_action;
            data.indicator_type_name = indicator_type_name;
            data.indicators_category_name = indicators_category_name;
            break;
        case STATE_TYPES.INDICATOR_SEARCH:
            data.action = CHART_ACTION.SEARCH;
            data.search_string = search_string;
            break;
        case STATE_TYPES.INDICATOR_SETTINGS_OPEN:
            data.action = CHART_ACTION.EDIT_ACTIVE;
            data.indicator_type_name = indicator_type_name;
            data.indicators_category_name = indicators_category_name;
            break;
        case STATE_TYPES.INDICATORS_MODAL_OPEN:
            data.action = CHART_ACTION.OPEN;
            break;
        case STATE_TYPES.INDICATORS_CLEAR_ALL:
            data.action = CHART_ACTION.CLEAN_ALL_ACTIVE;
            break;
        default:
            return { event_type: '', data: {} };
    }
    return { event_type: indicators_event_type, data };
};

const getMarketTypeFormAnalyticsData = (state: keyof typeof STATE_TYPES, option: TChartStateChangeOption = {}) => {
    const { is_favorite, symbol_category: tab_market_name = '', search_string, symbol: market_type_name = '' } = option;
    const market_event_type = 'ce_market_types_form_v2';
    const favorites_action = is_favorite ? CHART_ACTION.ADD_TO_FAVORITES : CHART_ACTION.DELETE_FROM_FAVORITES;

    const data: TChartAnalyticsBaseEvent = {
        action: '',
        account_type: getAccountType(),
        device_type: getDeviceType(),
    };

    if (
        (state === STATE_TYPES.MARKET_SEARCH && !option.search_string) ||
        (state === STATE_TYPES.FAVORITE_MARKETS_TOGGLE && !market_type_name)
    ) {
        return { event_type: '', data: {} };
    }

    switch (state) {
        case STATE_TYPES.MARKET_MENU_MODAL_TOGGLE:
            data.action = option.is_open ? CHART_ACTION.OPEN : CHART_ACTION.CLOSE;
            break;
        case STATE_TYPES.FAVORITE_MARKETS_TOGGLE:
            data.action = favorites_action;
            data.market_type_name = market_type_name;
            data.tab_market_name = tab_market_name;
            break;
        case STATE_TYPES.MARKET_SEARCH:
            data.action = CHART_ACTION.SEARCH;
            data.search_string = search_string;
            break;
        case STATE_TYPES.SYMBOL_CHANGE:
            data.action = CHART_ACTION.CHOOSE_MARKET_TYPE;
            data.market_type_name = market_type_name;
            data.tab_market_name = tab_market_name;
            break;
        default:
            return { event_type: '', data: {} };
    }
    return { event_type: market_event_type, data };
};

const getDrawingToolsFormAnalyticsData = (state: keyof typeof STATE_TYPES, option: TChartStateChangeOption = {}) => {
    const { drawing_tool_name = '', pxthickness = '', color_name = '' } = option;
    const drawing_tools_event_type = 'ce_drawing_tools_form_v2';

    const data: TChartAnalyticsBaseEvent = {
        action: '',
        account_type: getAccountType(),
        device_type: getDeviceType(),
    };

    switch (state) {
        case STATE_TYPES.DRAWING_TOOLS_MODAL_OPEN:
            data.action = CHART_ACTION.OPEN;
            break;
        case STATE_TYPES.DRAWING_TOOLS_ADD:
            data.action = CHART_ACTION.ADD_DRAWING_TOOL;
            data.drawing_tool_name = drawing_tool_name;
            data.pxthickness = pxthickness;
            data.color_name = color_name;
            break;
        case STATE_TYPES.DRAWING_TOOLS_DELETE:
            data.action = CHART_ACTION.DELETE_DRAWING_TOOL;
            data.drawing_tool_name = drawing_tool_name;
            data.pxthickness = pxthickness;
            data.color_name = color_name;
            break;
        case STATE_TYPES.DRAWING_TOOLS_EDIT_PX:
            data.action = CHART_ACTION.EDIT_DRAWING_TOOL_PX;
            data.drawing_tool_name = drawing_tool_name;
            data.pxthickness = pxthickness;
            break;
        case STATE_TYPES.DRAWING_TOOLS_EDIT_COLOR:
            data.action = CHART_ACTION.EDIT_DRAWING_TOOL_COLOR;
            data.drawing_tool_name = drawing_tool_name;
            data.color_name = color_name;
            break;
        default:
            return { event_type: '', data: {} };
    }
    return { event_type: drawing_tools_event_type, data };
};

export const rudderStackChartAnalyticsData = (
    state: keyof typeof STATE_TYPES,
    option: TChartStateChangeOption = {}
) => {
    const chart_type_form_events: string[] = [
        STATE_TYPES.CHART_INTERVAL_CHANGE,
        STATE_TYPES.CHART_TYPE_CHANGE,
        STATE_TYPES.CHART_MODE_MODAL_OPEN,
        STATE_TYPES.CHART_SWITCH_TOGGLE,
    ];
    const indicator_type_form_events: string[] = [
        STATE_TYPES.INDICATOR_ADDED,
        STATE_TYPES.INDICATOR_DELETED,
        STATE_TYPES.INDICATOR_EDITED,
        STATE_TYPES.INDICATOR_INFO_TOGGLE,
        STATE_TYPES.INDICATOR_SEARCH,
        STATE_TYPES.INDICATOR_SETTINGS_OPEN,
        STATE_TYPES.INDICATORS_CLEAR_ALL,
        STATE_TYPES.INDICATORS_MODAL_OPEN,
    ];
    const market_type_form_events: string[] = [
        STATE_TYPES.FAVORITE_MARKETS_TOGGLE,
        STATE_TYPES.MARKET_SEARCH,
        STATE_TYPES.SYMBOL_CHANGE,
        STATE_TYPES.MARKET_MENU_MODAL_TOGGLE,
    ];
    const drawing_tools_form_events: string[] = [
        STATE_TYPES.DRAWING_TOOLS_MODAL_OPEN,
        STATE_TYPES.DRAWING_TOOLS_ADD,
        STATE_TYPES.DRAWING_TOOLS_DELETE,
        STATE_TYPES.DRAWING_TOOLS_EDIT_PX,
        STATE_TYPES.DRAWING_TOOLS_EDIT_COLOR,
    ];
    const crosshair_events: string[] = [STATE_TYPES.CROSSHAIR_CLICK];

    let result = { event_type: '', data: {} };

    if (crosshair_events.includes(state)) {
        result = getCrossHairAnalyticsData(state, option);
    } else if (chart_type_form_events.includes(state)) {
        result = getChartTypeFormAnalyticsData(state, option);
    } else if (indicator_type_form_events.includes(state)) {
        result = getIndicatorTypeFormAnalyticsData(state, option);
    } else if (market_type_form_events.includes(state)) {
        result = getMarketTypeFormAnalyticsData(state, option);
    } else if (drawing_tools_form_events.includes(state)) {
        result = getDrawingToolsFormAnalyticsData(state, option);
    }

    if (result.event_type && result.data && Object.keys(result.data).length > 0) {
        tracker.trackEvent(result.event_type, result.data);
    }

    return result;
};
