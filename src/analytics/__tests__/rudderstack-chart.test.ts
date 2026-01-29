import { Analytics } from '@deriv-com/analytics';
import { CHART_ACTION, rudderStackChartAnalyticsData, STATE_TYPES } from '../rudderstack-chart';
import * as utils from '../utils';

// Mock dependencies
jest.mock('@deriv-com/analytics');
jest.mock('../utils', () => ({
    getAccountType: jest.fn().mockReturnValue('real'),
    getDeviceType: jest.fn().mockReturnValue('desktop'),
}));

describe('rudderstack-chart.ts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('rudderStackChartAnalyticsData', () => {
        it('should call trackEvent with correct parameters for chart type change', () => {
            const options = {
                chart_type_name: 'candle',
                time_interval_name: '1m',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.CHART_TYPE_CHANGE, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_chart_types_form_v2', {
                action: CHART_ACTION.CHOOSE_CHART_TYPE,
                chart_type_name: 'candle',
                time_interval_name: '1m',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_chart_types_form_v2',
                data: {
                    action: CHART_ACTION.CHOOSE_CHART_TYPE,
                    chart_type_name: 'candle',
                    time_interval_name: '1m',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for chart interval change', () => {
            const options = {
                chart_type_name: 'area',
                time_interval_name: '5m',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.CHART_INTERVAL_CHANGE, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_chart_types_form_v2', {
                action: CHART_ACTION.CHOOSE_TIME_INTERVAL,
                chart_type_name: 'area',
                time_interval_name: '5m',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_chart_types_form_v2',
                data: {
                    action: CHART_ACTION.CHOOSE_TIME_INTERVAL,
                    chart_type_name: 'area',
                    time_interval_name: '5m',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for chart mode modal open', () => {
            const result = rudderStackChartAnalyticsData(STATE_TYPES.CHART_MODE_MODAL_OPEN, {});

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_chart_types_form_v2', {
                action: CHART_ACTION.OPEN,
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_chart_types_form_v2',
                data: {
                    action: CHART_ACTION.OPEN,
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for chart switch toggle', () => {
            const options = {
                chart_type_name: 'line',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.CHART_SWITCH_TOGGLE, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_chart_types_form_v2', {
                action: CHART_ACTION.CHART_SMOOTHING_TOGGLE,
                chart_type_name: 'line',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_chart_types_form_v2',
                data: {
                    action: CHART_ACTION.CHART_SMOOTHING_TOGGLE,
                    chart_type_name: 'line',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for indicator added', () => {
            const options = {
                indicator_type_name: 'bollinger_bands',
                indicators_category_name: 'oscillators',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.INDICATOR_ADDED, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_indicators_types_form_v2', {
                action: CHART_ACTION.ADD_ACTIVE,
                indicator_type_name: 'bollinger_bands',
                indicators_category_name: 'oscillators',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_indicators_types_form_v2',
                data: {
                    action: CHART_ACTION.ADD_ACTIVE,
                    indicator_type_name: 'bollinger_bands',
                    indicators_category_name: 'oscillators',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for indicator deleted', () => {
            const options = {
                indicator_type_name: 'rsi',
                indicators_category_name: 'oscillators',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.INDICATOR_DELETED, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_indicators_types_form_v2', {
                action: CHART_ACTION.DELETE_ACTIVE,
                indicator_type_name: 'rsi',
                indicators_category_name: 'oscillators',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_indicators_types_form_v2',
                data: {
                    action: CHART_ACTION.DELETE_ACTIVE,
                    indicator_type_name: 'rsi',
                    indicators_category_name: 'oscillators',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for indicator edited', () => {
            const options = {
                indicator_type_name: 'macd',
                indicators_category_name: 'oscillators',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.INDICATOR_EDITED, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_indicators_types_form_v2', {
                action: CHART_ACTION.EDIT_ACTIVE,
                indicator_type_name: 'macd',
                indicators_category_name: 'oscillators',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_indicators_types_form_v2',
                data: {
                    action: CHART_ACTION.EDIT_ACTIVE,
                    indicator_type_name: 'macd',
                    indicators_category_name: 'oscillators',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for indicator info toggle (open)', () => {
            const options = {
                indicator_type_name: 'sma',
                indicators_category_name: 'moving_averages',
                is_info_open: true,
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.INDICATOR_INFO_TOGGLE, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_indicators_types_form_v2', {
                action: CHART_ACTION.INFO_OPEN,
                indicator_type_name: 'sma',
                indicators_category_name: 'moving_averages',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_indicators_types_form_v2',
                data: {
                    action: CHART_ACTION.INFO_OPEN,
                    indicator_type_name: 'sma',
                    indicators_category_name: 'moving_averages',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for indicator info toggle (close)', () => {
            const options = {
                indicator_type_name: 'sma',
                indicators_category_name: 'moving_averages',
                is_info_open: false,
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.INDICATOR_INFO_TOGGLE, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_indicators_types_form_v2', {
                action: CHART_ACTION.INFO_CLOSE,
                indicator_type_name: 'sma',
                indicators_category_name: 'moving_averages',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_indicators_types_form_v2',
                data: {
                    action: CHART_ACTION.INFO_CLOSE,
                    indicator_type_name: 'sma',
                    indicators_category_name: 'moving_averages',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for indicator search', () => {
            const options = {
                search_string: 'bollinger',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.INDICATOR_SEARCH, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_indicators_types_form_v2', {
                action: CHART_ACTION.SEARCH,
                search_string: 'bollinger',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_indicators_types_form_v2',
                data: {
                    action: CHART_ACTION.SEARCH,
                    search_string: 'bollinger',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for indicator settings open', () => {
            const options = {
                indicator_type_name: 'ema',
                indicators_category_name: 'moving_averages',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.INDICATOR_SETTINGS_OPEN, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_indicators_types_form_v2', {
                action: CHART_ACTION.EDIT_ACTIVE,
                indicator_type_name: 'ema',
                indicators_category_name: 'moving_averages',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_indicators_types_form_v2',
                data: {
                    action: CHART_ACTION.EDIT_ACTIVE,
                    indicator_type_name: 'ema',
                    indicators_category_name: 'moving_averages',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for indicators modal open', () => {
            const result = rudderStackChartAnalyticsData(STATE_TYPES.INDICATORS_MODAL_OPEN, {});

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_indicators_types_form_v2', {
                action: CHART_ACTION.OPEN,
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_indicators_types_form_v2',
                data: {
                    action: CHART_ACTION.OPEN,
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for indicators clear all', () => {
            const result = rudderStackChartAnalyticsData(STATE_TYPES.INDICATORS_CLEAR_ALL, {});

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_indicators_types_form_v2', {
                action: CHART_ACTION.CLEAN_ALL_ACTIVE,
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_indicators_types_form_v2',
                data: {
                    action: CHART_ACTION.CLEAN_ALL_ACTIVE,
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for market menu modal toggle (open)', () => {
            const options = {
                is_open: true,
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.MARKET_MENU_MODAL_TOGGLE, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_market_types_form_v2', {
                action: CHART_ACTION.OPEN,
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_market_types_form_v2',
                data: {
                    action: CHART_ACTION.OPEN,
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for market menu modal toggle (close)', () => {
            const options = {
                is_open: false,
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.MARKET_MENU_MODAL_TOGGLE, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_market_types_form_v2', {
                action: CHART_ACTION.CLOSE,
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_market_types_form_v2',
                data: {
                    action: CHART_ACTION.CLOSE,
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for favorite markets toggle (add)', () => {
            const options = {
                is_favorite: true,
                symbol: 'R_100',
                symbol_category: 'synthetic_index',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.FAVORITE_MARKETS_TOGGLE, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_market_types_form_v2', {
                action: CHART_ACTION.ADD_TO_FAVORITES,
                market_type_name: 'R_100',
                tab_market_name: 'synthetic_index',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_market_types_form_v2',
                data: {
                    action: CHART_ACTION.ADD_TO_FAVORITES,
                    market_type_name: 'R_100',
                    tab_market_name: 'synthetic_index',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for favorite markets toggle (remove)', () => {
            const options = {
                is_favorite: false,
                symbol: 'R_100',
                symbol_category: 'synthetic_index',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.FAVORITE_MARKETS_TOGGLE, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_market_types_form_v2', {
                action: CHART_ACTION.DELETE_FROM_FAVORITES,
                market_type_name: 'R_100',
                tab_market_name: 'synthetic_index',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_market_types_form_v2',
                data: {
                    action: CHART_ACTION.DELETE_FROM_FAVORITES,
                    market_type_name: 'R_100',
                    tab_market_name: 'synthetic_index',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for market search', () => {
            const options = {
                search_string: 'volatility',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.MARKET_SEARCH, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_market_types_form_v2', {
                action: CHART_ACTION.SEARCH,
                search_string: 'volatility',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_market_types_form_v2',
                data: {
                    action: CHART_ACTION.SEARCH,
                    search_string: 'volatility',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for symbol change', () => {
            const options = {
                symbol: 'EURUSD',
                symbol_category: 'forex',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.SYMBOL_CHANGE, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_market_types_form_v2', {
                action: CHART_ACTION.CHOOSE_MARKET_TYPE,
                market_type_name: 'EURUSD',
                tab_market_name: 'forex',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_market_types_form_v2',
                data: {
                    action: CHART_ACTION.CHOOSE_MARKET_TYPE,
                    market_type_name: 'EURUSD',
                    tab_market_name: 'forex',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for drawing tools modal open', () => {
            const result = rudderStackChartAnalyticsData(STATE_TYPES.DRAWING_TOOLS_MODAL_OPEN, {});

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_drawing_tools_form_v2', {
                action: CHART_ACTION.OPEN,
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_drawing_tools_form_v2',
                data: {
                    action: CHART_ACTION.OPEN,
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for drawing tools add', () => {
            const options = {
                drawing_tool_name: 'horizontal_line',
                pxthickness: '2',
                color_name: 'red',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.DRAWING_TOOLS_ADD, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_drawing_tools_form_v2', {
                action: CHART_ACTION.ADD_DRAWING_TOOL,
                drawing_tool_name: 'horizontal_line',
                pxthickness: '2',
                color_name: 'red',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_drawing_tools_form_v2',
                data: {
                    action: CHART_ACTION.ADD_DRAWING_TOOL,
                    drawing_tool_name: 'horizontal_line',
                    pxthickness: '2',
                    color_name: 'red',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for drawing tools delete', () => {
            const options = {
                drawing_tool_name: 'vertical_line',
                pxthickness: '1',
                color_name: 'blue',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.DRAWING_TOOLS_DELETE, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_drawing_tools_form_v2', {
                action: CHART_ACTION.DELETE_DRAWING_TOOL,
                drawing_tool_name: 'vertical_line',
                pxthickness: '1',
                color_name: 'blue',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_drawing_tools_form_v2',
                data: {
                    action: CHART_ACTION.DELETE_DRAWING_TOOL,
                    drawing_tool_name: 'vertical_line',
                    pxthickness: '1',
                    color_name: 'blue',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for drawing tools edit px', () => {
            const options = {
                drawing_tool_name: 'trend_line',
                pxthickness: '3',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.DRAWING_TOOLS_EDIT_PX, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_drawing_tools_form_v2', {
                action: CHART_ACTION.EDIT_DRAWING_TOOL_PX,
                drawing_tool_name: 'trend_line',
                pxthickness: '3',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_drawing_tools_form_v2',
                data: {
                    action: CHART_ACTION.EDIT_DRAWING_TOOL_PX,
                    drawing_tool_name: 'trend_line',
                    pxthickness: '3',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for drawing tools edit color', () => {
            const options = {
                drawing_tool_name: 'rectangle',
                color_name: 'green',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.DRAWING_TOOLS_EDIT_COLOR, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_drawing_tools_form_v2', {
                action: CHART_ACTION.EDIT_DRAWING_TOOL_COLOR,
                drawing_tool_name: 'rectangle',
                color_name: 'green',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_drawing_tools_form_v2',
                data: {
                    action: CHART_ACTION.EDIT_DRAWING_TOOL_COLOR,
                    drawing_tool_name: 'rectangle',
                    color_name: 'green',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should call trackEvent with correct parameters for crosshair click', () => {
            const options = {
                cta_name: 'crosshair_button',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.CROSSHAIR_CLICK, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_crosshair_v2', {
                action: CHART_ACTION.CROSSHAIR_CLICK,
                cta_name: 'crosshair_button',
                account_type: 'real',
                device_type: 'desktop',
            });

            expect(result).toEqual({
                event_type: 'ce_crosshair_v2',
                data: {
                    action: CHART_ACTION.CROSSHAIR_CLICK,
                    cta_name: 'crosshair_button',
                    account_type: 'real',
                    device_type: 'desktop',
                },
            });
        });

        it('should not call trackEvent for unsupported state types', () => {
            const result = rudderStackChartAnalyticsData(STATE_TYPES.INITIAL, {});

            expect(Analytics.trackEvent).not.toHaveBeenCalled();
            expect(result).toEqual({ event_type: '', data: {} });
        });

        it('should not call trackEvent when required parameters are missing', () => {
            // Missing chart_type_name for CHART_TYPE_CHANGE
            const result1 = rudderStackChartAnalyticsData(STATE_TYPES.CHART_TYPE_CHANGE, {});
            expect(Analytics.trackEvent).not.toHaveBeenCalled();
            expect(result1).toEqual({ event_type: '', data: {} });

            // Missing indicator_type_name for INDICATOR_ADDED
            const result2 = rudderStackChartAnalyticsData(STATE_TYPES.INDICATOR_ADDED, {});
            expect(Analytics.trackEvent).not.toHaveBeenCalled();
            expect(result2).toEqual({ event_type: '', data: {} });

            // Missing search_string for MARKET_SEARCH
            const result3 = rudderStackChartAnalyticsData(STATE_TYPES.MARKET_SEARCH, {});
            expect(Analytics.trackEvent).not.toHaveBeenCalled();
            expect(result3).toEqual({ event_type: '', data: {} });
        });

        it('should use the correct account type and device type from utils', () => {
            (utils.getAccountType as jest.Mock).mockReturnValueOnce('demo');
            (utils.getDeviceType as jest.Mock).mockReturnValueOnce('mobile');

            const options = {
                chart_type_name: 'line',
            };

            const result = rudderStackChartAnalyticsData(STATE_TYPES.CHART_TYPE_CHANGE, options);

            expect(Analytics.trackEvent).toHaveBeenCalledWith('ce_chart_types_form_v2', {
                action: CHART_ACTION.CHOOSE_CHART_TYPE,
                chart_type_name: 'line',
                account_type: 'demo',
                device_type: 'mobile',
            });

            expect(result).toEqual({
                event_type: 'ce_chart_types_form_v2',
                data: {
                    action: CHART_ACTION.CHOOSE_CHART_TYPE,
                    chart_type_name: 'line',
                    account_type: 'demo',
                    device_type: 'mobile',
                },
            });
        });
    });
});
