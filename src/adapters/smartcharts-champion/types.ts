/**
 * Internal types for the SmartCharts Champion adapter
 * Re-exports from main types and adds adapter-specific interfaces
 */

import type {
    ActiveSymbol,
    ActiveSymbols,
    SmartchartsChampionAdapter,
    SmartchartsChampionFunctions,
    TGetQuotesRequest,
    TGetQuotesResult,
    TGranularity,
    TQuote,
    TradingTimesMap,
    TServices,
    TSubscriptionCallback,
    TTransport,
    TUnsubscribeFunction,
} from '@/types/smartchart.types';

export type {
    ActiveSymbol,
    ActiveSymbols,
    SmartchartsChampionAdapter,
    SmartchartsChampionFunctions,
    TGetQuotesRequest,
    TGetQuotesResult,
    TGranularity,
    TQuote,
    TradingTimesMap,
    TServices,
    TSubscriptionCallback,
    TTransport,
    TUnsubscribeFunction,
};

// Internal subscription management
export interface SubscriptionInfo {
    id: string;
    request: TGetQuotesRequest;
    callback: TSubscriptionCallback;
    unsubscribe: () => void;
}

// Internal transformation utilities
export interface TransformationUtils {
    toTGetQuotesResult: (response: any, granularity: TGranularity) => TGetQuotesResult;
    toTQuoteFromStream: (message: any, granularity: TGranularity) => TQuote;
    toTradingTimesMap: (source: any) => TradingTimesMap;
    toActiveSymbols: (source: any) => ActiveSymbols;
}

// Adapter configuration options
export interface AdapterConfig {
    debug?: boolean;
    subscriptionTimeout?: number;
    maxRetries?: number;
}
