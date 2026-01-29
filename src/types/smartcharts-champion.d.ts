declare module '@deriv-com/smartcharts-champion' {
    import { ComponentType } from 'react';

    // Core types from SmartChart.md
    export type TGranularity = 0 | 60 | 120 | 180 | 300 | 600 | 900 | 1800 | 3600 | 7200 | 14400 | 28800 | 86400;

    export interface TQuote {
        Date: string; // ISO-like, SmartChart will parse with 'Z' as UTC
        Open?: number;
        High?: number;
        Low?: number;
        Close: number;
        tick?: any; // TicksStreamResponse['tick'] for ticks
        ohlc?: any; // OHLCStreamResponse['ohlc'] for candles
        DT?: Date;
        prevClose?: number;
        Volume?: number;
    }

    export interface TGetQuotesResult {
        candles?: Array<{
            open: number;
            high: number;
            low: number;
            close: number;
            epoch: number;
        }>;
        history?: {
            prices: number[];
            times: number[]; // epoch in seconds
        };
    }

    export type TGetQuotes = (params: {
        symbol: string;
        granularity: number; // 0 for ticks, >0 for candles in seconds
        count: number;
        start?: number;
        end?: number;
        style?: string; // 'ticks' or 'candles' (optional)
    }) => Promise<TGetQuotesResult>;

    export type TSubscribeQuotes = (
        params: { symbol: string; granularity: TGranularity },
        callback: (quote: TQuote) => void
    ) => () => void; // returns unsubscribe function

    export type TUnsubscribeQuotes = (request?: any, callback?: any) => void;

    export interface ActiveSymbol {
        display_name: string;
        market: string;
        market_display_name: string;
        subgroup: string;
        subgroup_display_name: string;
        submarket: string;
        submarket_display_name: string;
        symbol: string;
        symbol_type: string;
        pip: number;
        exchange_is_open: 0 | 1;
        is_trading_suspended: 0 | 1;
        delay_amount?: number;
    }

    export type ActiveSymbols = ActiveSymbol[];

    export type TradingTimesMap = Record<
        string,
        {
            isOpen: boolean;
            openTime: string;
            closeTime: string;
        }
    >;

    export interface TSettings {
        countdown?: boolean;
        historical?: boolean;
        lang?: string;
        language?: string;
        minimumLeftBars?: number;
        position?: string;
        enabledNavigationWidget?: boolean;
        isAutoScale?: boolean;
        isHighestLowestMarkerEnabled?: boolean;
        isSmoothChartEnabled?: boolean;
        theme?: string;
        activeLanguages?: Array<string | any> | null;
        whitespace?: number;
    }
    // STATE_TYPES has been moved to rudderstack-chart.ts

    export type TChartStateChangeOption = {
        indicator_type_name?: string;
        indicators_category_name?: string;
        isClosed?: boolean;
        is_favorite?: boolean;
        is_info_open?: boolean;
        is_open?: boolean;
        chart_type_name?: string;
        search_string?: string;
        symbol?: string;
        symbol_category?: string;
        time_interval_name?: string;
        drawing_tool_name?: string;
        pxthickness?: string;
        color_name?: string;
        cta_name?: string;
    };

    export type TStateChangeListener = (state: string, option: TChartStateChangeOption) => void;
    export type TChartControlsWidgets = (props: { isMobile?: boolean }) => React.ReactElement | null;

    export interface TNetworkConfig {
        class: string;
        tooltip: string;
    }

    export interface TNotification {
        [key: string]: any;
    }

    // Main SmartChart Props interface based on TChartProps from SmartChart.md
    export interface SmartChartProps {
        // Essential data providers
        unsubscribeQuotes: TUnsubscribeQuotes;
        getQuotes?: TGetQuotes;
        subscribeQuotes?: TSubscribeQuotes;

        // Data context
        symbol?: string;
        granularity?: TGranularity;
        chartType?: string;

        // Initial data
        chartData?: {
            activeSymbols?: ActiveSymbols;
            tradingTimes?: TradingTimesMap;
        };

        // Lifecycle and behavior
        isLive?: boolean;
        startEpoch?: number;
        endEpoch?: number;
        isStaticChart?: boolean;
        anchorChartToLeft?: boolean;
        scrollToEpoch?: number | null;
        enableRouting?: boolean;

        // User settings/state
        settings?: TSettings;
        onSettingsChange?: (newSettings: Omit<TSettings, 'activeLanguages'>) => void;
        stateChangeListener?: TStateChangeListener;
        chartStatusListener?: (isChartReady: boolean) => boolean;

        // Layout/appearance
        isMobile?: boolean;
        enabledChartFooter?: boolean;
        enabledNavigationWidget?: boolean;
        yAxisMargin?: { top: number; bottom: number };
        leftMargin?: number;
        crosshairState?: number | null;
        crosshairTooltipLeftAllow?: number | null;
        startWithDataFitMode?: boolean;
        isAnimationEnabled?: boolean;

        // Widgets (render props)
        topWidgets?: () => React.ReactElement;
        bottomWidgets?: () => React.ReactElement;
        toolbarWidget?: () => React.ReactElement;
        chartControlsWidgets?: TChartControlsWidgets | null;

        // Other props
        id?: string;
        feedCall?: { activeSymbols?: boolean; tradingTimes?: boolean };
        onMessage?: (message: TNotification) => void;
        networkStatus?: TNetworkConfig;
        clearChart?: () => void;
        shouldGetQuotes?: boolean;
        allowTickChartTypeOnly?: boolean;
        shouldFetchTradingTimes?: boolean;
        shouldDrawTicksFromContractInfo?: boolean;
        allTicks?: any;
        contractInfo?: any;
        maxTick?: number | null;
        zoom?: number;
        enableZoom?: boolean | null;
        enableScroll?: boolean | null;
        historical?: boolean;
        contracts_array?: any[];
        children?: React.ReactNode;
        barriers?: any[];
        showLastDigitStats?: boolean;
        getMarketsOrder?: (active_symbols: any) => any;
        isConnectionOpened?: boolean;

        // Legacy props for compatibility
        requestAPI?: (req: any) => Promise<any>;
        requestForget?: () => void;
        requestForgetStream?: () => void;
        requestSubscribe?: (req: any, callback: (data: any) => void) => Promise<void>;

        drawingToolFloatingMenuPosition?: { x: number; y: number };
    }

    export interface ChartTitleProps {
        onChange?: (symbol: string) => void;
        [key: string]: any;
    }

    // Component exports
    export const SmartChart: ComponentType<SmartChartProps>;
    export const ChartTitle: ComponentType<ChartTitleProps>;
    export const ChartMode: ComponentType<any>;
    export const StudyLegend: ComponentType<any>;
    export const Views: ComponentType<any>;
    export const DrawTools: ComponentType<any>;
    export const Share: ComponentType<any>;
    export const ToolbarWidget: ComponentType<{ children?: React.ReactNode }>;
    export const ChartSetting: ComponentType<any>;
}
