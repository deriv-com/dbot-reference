/**
 * SmartCharts Champion Adapter
 * Provides the adapter pattern implementation for migrating from derivatives-charts to smartcharts-champion
 * Based on docs/adapter-design-smartcharts-champion.md
 */

import { ActiveSymbol } from '@deriv-com/smartcharts-champion';
import type {
    ActiveSymbols,
    AdapterConfig,
    SmartchartsChampionAdapter,
    TGetQuotesRequest,
    TGetQuotesResult,
    TGranularity,
    TQuote,
    TradingTimesMap,
    TServices,
    TSubscriptionCallback,
    TTransport,
    TUnsubscribeFunction,
} from './types';

// Transformation utilities
const transformations = {
    /**
     * Transform Deriv API ticks_history response to TGetQuotesResult
     */
    toTGetQuotesResult(response: any, granularity: TGranularity): TGetQuotesResult {
        const quotes: TQuote[] = [];

        if (!response) {
            return { quotes, meta: { symbol: '', granularity } };
        }

        const { history, candles, prices, times } = response;
        const symbol = response.echo_req?.ticks_history || '';

        // Handle ticks (granularity = 0)
        if (granularity === 0 && history) {
            const { prices: tick_prices, times: tick_times } = history;
            if (tick_prices && tick_times) {
                for (let i = 0; i < tick_prices.length; i++) {
                    quotes.push({
                        Date: String(tick_times[i]),
                        Close: tick_prices[i],
                        DT: new Date(tick_times[i] * 1000),
                    });
                }
            }
        }
        // Handle candles (granularity > 0)
        else if (granularity > 0 && candles) {
            candles.forEach((candle: any) => {
                quotes.push({
                    Date: String(candle.epoch),
                    Open: candle.open,
                    High: candle.high,
                    Low: candle.low,
                    Close: candle.close,
                    DT: new Date(candle.epoch * 1000),
                });
            });
        }
        // Fallback for direct prices/times arrays
        else if (prices && times) {
            for (let i = 0; i < prices.length; i++) {
                quotes.push({
                    Date: String(times[i]),
                    Close: prices[i],
                    DT: new Date(times[i] * 1000),
                });
            }
        }

        return {
            quotes,
            meta: {
                symbol,
                granularity,
                delay_amount: response.pip_size || 0,
            },
        };
    },

    /**
     * Transform streaming tick/candle message to TQuote
     */
    toTQuoteFromStream(message: any, granularity: TGranularity): TQuote {
        if (granularity === 0 && message.tick) {
            const { tick } = message;
            return {
                Date: String(tick.epoch),
                Close: tick.quote,
                tick,
                DT: new Date(tick.epoch * 1000),
            };
        } else if (granularity > 0 && message.ohlc) {
            const { ohlc } = message;
            return {
                Date: String(ohlc.epoch),
                Open: ohlc.open,
                High: ohlc.high,
                Low: ohlc.low,
                Close: ohlc.close,
                ohlc,
                DT: new Date(ohlc.epoch * 1000),
            };
        }

        // Fallback for direct tick data
        return {
            Date: String(message.epoch || Date.now() / 1000),
            Close: message.quote || message.price || 0,
            DT: new Date((message.epoch || Date.now() / 1000) * 1000),
        };
    },

    /**
     * Transform active symbols response to ActiveSymbols format
     */
    toActiveSymbols(activeSymbolsData: any[]): ActiveSymbol[] {
        const symbols: ActiveSymbol[] = [];

        if (!Array.isArray(activeSymbolsData)) {
            return symbols;
        }

        for (const symbol of activeSymbolsData) {
            const symbolCode = symbol.underlying_symbol || symbol.symbol;
            symbols.push({
                display_name: symbol.display_name || symbolCode,
                market: symbol.market,
                market_display_name: symbol.market_display_name,
                subgroup: symbol.subgroup, // Map submarket to subgroup
                subgroup_display_name: symbol.subgroup_display_name, // Map submarket_display_name to subgroup_display_name
                submarket: symbol.submarket,
                submarket_display_name: symbol.submarket_display_name,
                symbol: symbolCode,
                symbol_type: symbol.symbol_type || '',
                pip: symbol.pip || symbol.pip_size || 0.01,
                exchange_is_open: symbol.exchange_is_open || 0,
                is_trading_suspended: symbol.is_trading_suspended || 0,
                delay_amount: symbol.delay_amount,
            });
        }

        return symbols;
    },

    /**
     * Transform trading times data to SmartChart expected format
     * SmartChart expects: Record<string, { isOpen: boolean; openTime: string; closeTime: string }>
     */
    toTradingTimesMap(tradingTimesData: any): TradingTimesMap {
        const tradingTimes: TradingTimesMap = {};

        if (!tradingTimesData || typeof tradingTimesData !== 'object') {
            return tradingTimes;
        }

        Object.keys(tradingTimesData).forEach(symbol => {
            const symbolData = tradingTimesData[symbol];

            if (symbolData) {
                // Handle the format from services layer (with open/close arrays)
                if (symbolData.open && symbolData.close) {
                    const openTimes = Array.isArray(symbolData.open) ? symbolData.open : [symbolData.open];
                    const closeTimes = Array.isArray(symbolData.close) ? symbolData.close : [symbolData.close];

                    tradingTimes[symbol] = {
                        isOpen: openTimes.length > 0 && openTimes[0] !== '--',
                        openTime: openTimes[0] || '',
                        closeTime: closeTimes[0] || '',
                    };
                }
                // Handle legacy format with times array
                else if (symbolData.times && Array.isArray(symbolData.times)) {
                    const firstSession = symbolData.times[0];
                    if (firstSession && firstSession.open && firstSession.close) {
                        const openTime = new Date(firstSession.open).toISOString().substr(11, 8);
                        const closeTime = new Date(firstSession.close).toISOString().substr(11, 8);

                        tradingTimes[symbol] = {
                            isOpen: true,
                            openTime,
                            closeTime,
                        };
                    }
                }
                // Handle direct isOpen/openTime/closeTime format (if already in correct format)
                else if ('isOpen' in symbolData && 'openTime' in symbolData && 'closeTime' in symbolData) {
                    tradingTimes[symbol] = {
                        isOpen: symbolData.isOpen,
                        openTime: symbolData.openTime,
                        closeTime: symbolData.closeTime,
                    };
                }
            }
        });

        return tradingTimes;
    },
};

/**
 * Build the SmartCharts Champion adapter
 * @param transport - Transport layer (wraps chart_api.api)
 * @param services - Services layer (wraps ApiHelpers and trading-times)
 * @param config - Optional configuration
 * @returns SmartchartsChampionAdapter instance
 */
export function buildSmartchartsChampionAdapter(
    transport: TTransport,
    services: TServices,
    config: AdapterConfig = {}
): SmartchartsChampionAdapter {
    // Subscription management
    const subscriptions = new Map<string, () => void>();
    const debug = config.debug || false;

    // Create logger utility
    const logger = {
        log: debug ? console.log.bind(console, '[SmartCharts]') : () => {},
        warn: debug ? console.warn.bind(console, '[SmartCharts]') : () => {},
        error: console.error.bind(console, '[SmartCharts]'), // Always log errors
    };

    const adapter: SmartchartsChampionAdapter = {
        transport,
        services,

        /**
         * Get historical quotes for a symbol and granularity
         */
        async getQuotes(request: TGetQuotesRequest): Promise<TGetQuotesResult> {
            try {
                // Build ticks_history request
                const apiRequest: any = {
                    ticks_history: request.symbol,
                    end: request.end || 'latest',
                    count: request.count || 1000,
                    adjust_start_time: 1,
                };

                // Set style and granularity
                if (request.granularity === 0) {
                    apiRequest.style = 'ticks';
                } else {
                    apiRequest.style = 'candles';
                    apiRequest.granularity = request.granularity;
                }

                // Add start time if provided
                if (request.start) {
                    apiRequest.start = request.start;
                    delete apiRequest.count; // Don't use count when start is specified
                }

                const response = await transport.send(apiRequest);

                return transformations.toTGetQuotesResult(response, request.granularity);
            } catch (error) {
                logger.error('Error in getQuotes:', error);
                return {
                    quotes: [],
                    meta: {
                        symbol: request.symbol,
                        granularity: request.granularity,
                    },
                };
            }
        },

        /**
         * Subscribe to live quote updates
         */
        subscribeQuotes(request: TGetQuotesRequest, callback: TSubscriptionCallback): TUnsubscribeFunction {
            const subscriptionKey = `${request.symbol}-${request.granularity}`;

            // Build subscription request
            const apiRequest: any = {
                ticks_history: request.symbol,
                subscribe: 1,
                end: 'latest',
                count: 1,
            };

            if (request.granularity === 0) {
                apiRequest.style = 'ticks';
            } else {
                apiRequest.style = 'candles';
                apiRequest.granularity = request.granularity;
            }

            try {
                const subscriptionId = transport.subscribe(apiRequest, (response: any) => {
                    // Process all streaming messages for this subscription
                    // The transport layer already filters by subscription ID
                    try {
                        logger.log('Stream message received:', response);
                        const quote = response;
                        callback(quote);
                    } catch (error) {
                        logger.error('Error transforming stream message:', error);
                    }
                });

                // Create unsubscribe function
                const unsubscribe = () => {
                    transport.unsubscribe(subscriptionId);
                    subscriptions.delete(subscriptionKey);
                };

                // Store subscription for cleanup
                subscriptions.set(subscriptionKey, unsubscribe);

                return unsubscribe;
            } catch (error) {
                logger.error('Error in subscribeQuotes:', error);
                return () => {}; // Return no-op function on error
            }
        },

        /**
         * Unsubscribe from quote updates (convenience wrapper)
         */
        unsubscribeQuotes(request: TGetQuotesRequest): void {
            const subscriptionKey = `${request.symbol}-${request.granularity}`;
            const unsubscribe = subscriptions.get(subscriptionKey);

            if (unsubscribe) {
                unsubscribe();
            } else {
                logger.warn('No active subscription found for:', subscriptionKey);
            }
        },

        /**
         * Get chart reference data (active symbols and trading times)
         */
        async getChartData(): Promise<{ activeSymbols: ActiveSymbols; tradingTimes: TradingTimesMap }> {
            try {
                // Get active symbols and trading times in parallel
                const [activeSymbolsData, tradingTimesData] = await Promise.all([
                    services.getActiveSymbols(),
                    services.getTradingTimes(),
                ]);

                const activeSymbols = transformations.toActiveSymbols(activeSymbolsData);
                const tradingTimes = transformations.toTradingTimesMap(tradingTimesData);

                return { activeSymbols, tradingTimes };
            } catch (error) {
                logger.error('Error in getChartData:', error);
                return {
                    activeSymbols: [] as ActiveSymbols,
                    tradingTimes: {} as TradingTimesMap,
                };
            }
        },
    };

    return adapter;
}

// Export types for convenience
export type { SmartchartsChampionAdapter, TGetQuotesRequest, TGetQuotesResult } from './types';
