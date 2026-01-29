/**
 * Type definitions for @deriv-com/smartcharts-champion integration
 * Based on the adapter design and migration documentation
 */

import { ActiveSymbol } from '@deriv-com/smartcharts-champion';

// Core granularity type - 0 for ticks, >0 for candle intervals in seconds
export type TGranularity = 0 | 60 | 120 | 180 | 300 | 600 | 900 | 1800 | 3600 | 7200 | 14400 | 28800 | 86400;

// Quote data structure used internally by SmartChart
export interface TQuote {
    Date: string; // epoch or ISO as string
    Close: number;
    Open?: number;
    High?: number;
    Low?: number;
    Volume?: number;
    tick?: any; // for tick streams
    ohlc?: any; // for candle streams
    DT?: Date;
    prevClose?: number;
}

// Request parameters for getQuotes function
export interface TGetQuotesRequest {
    symbol: string;
    granularity: TGranularity;
    start?: number; // epoch timestamp
    end?: number | 'latest';
    count?: number;
}

// Response from getQuotes function
export interface TGetQuotesResult {
    quotes: TQuote[];
    meta?: {
        symbol: string;
        granularity: TGranularity;
        delay_amount?: number;
    };
}

// Trading times structure - SmartChart expected format
export interface TradingTimesMap {
    [symbol: string]: {
        isOpen: boolean;
        openTime: string;
        closeTime: string;
    };
}

// Subscription callback type
export type TSubscriptionCallback = (quote: TQuote) => void;

// Unsubscribe function type
export type TUnsubscribeFunction = () => void;

// Core adapter function types
export interface SmartchartsChampionFunctions {
    getQuotes: (request: TGetQuotesRequest) => Promise<TGetQuotesResult>;
    subscribeQuotes: (request: TGetQuotesRequest, callback: TSubscriptionCallback) => TUnsubscribeFunction;
    unsubscribeQuotes: (request: TGetQuotesRequest) => void;
    getChartData: () => Promise<{
        activeSymbols: ActiveSymbol[];
        tradingTimes: TradingTimesMap;
    }>;
}

// Transport layer interface (wraps existing chart_api.api)
export interface TTransport {
    send: (request: any) => Promise<any>;
    subscribe: (request: any, callback: (response: any) => void) => string; // returns subscription_id
    unsubscribe: (subscription_id: string) => void;
    unsubscribeAll: (msg_type?: string) => void;
}

// Services interface (wraps existing ApiHelpers and trading-times)
export interface TServices {
    getActiveSymbols: () => Promise<any>;
    getTradingTimes: () => Promise<any>;
}

// Main adapter interface
export interface SmartchartsChampionAdapter extends SmartchartsChampionFunctions {
    transport: TTransport;
    services: TServices;
}
