/**
 * Services layer wrapper for SmartCharts Champion Adapter
 * Wraps the existing ApiHelpers to match the TServices interface
 */

import ApiHelpers from '@/external/bot-skeleton/services/api/api-helpers';
import type { TServices } from './types';

// Logger utility for services layer
const logger = {
    log: () => {}, // Disabled in production
    warn: console.warn.bind(console, '[SmartCharts Services]'),
    error: console.error.bind(console, '[SmartCharts Services]'),
};

/**
 * Type definition for initialized ApiHelpers instance
 */
interface InitializedApiHelpers {
    active_symbols: {
        retrieveActiveSymbols: () => Promise<any>;
        active_symbols?: any[];
    };
    trading_times: {
        initialise: () => Promise<void>;
        trading_times: any;
    };
}

/**
 * Type guard to check if ApiHelpers instance is properly initialized
 */
function isApiHelpersInitialized(instance: any): instance is InitializedApiHelpers {
    return (
        instance &&
        instance.active_symbols &&
        typeof instance.active_symbols.retrieveActiveSymbols === 'function' &&
        instance.trading_times &&
        typeof instance.trading_times.initialise === 'function'
    );
}

/**
 * Transform trading times data to SmartCharts Champion format
 * @param tradingTimesData Raw trading times data from TradingTimes class
 * @returns Transformed trading times data
 */
function transformTradingTimesData(tradingTimesData: any): any {
    // Transform to SmartCharts Champion format
    const transformedTradingTimes: any = {};

    // Filter out invalid keys first
    const validKeys = Object.keys(tradingTimesData || {}).filter(symbol => {
        // Skip undefined, null, or invalid symbol keys
        const isValidSymbol =
            symbol &&
            symbol !== 'undefined' &&
            symbol !== 'null' &&
            typeof symbol === 'string' &&
            symbol.trim() !== '' &&
            symbol !== '[object Object]';

        if (!isValidSymbol) {
            logger.warn(`Filtering out invalid symbol key: "${symbol}"`);
            return false;
        }

        return true;
    });

    validKeys.forEach(symbol => {
        const symbolData = tradingTimesData[symbol];

        if (symbolData && typeof symbolData === 'object') {
            // Initialize the structure
            transformedTradingTimes[symbol] = {
                open: [],
                close: [],
                settlement: undefined,
            };

            if (symbolData.is_open_all_day) {
                transformedTradingTimes[symbol].open = ['00:00:00'];
                transformedTradingTimes[symbol].close = ['23:59:59'];
            } else if (symbolData.is_closed_all_day) {
                transformedTradingTimes[symbol].open = ['--'];
                transformedTradingTimes[symbol].close = ['--'];
            } else if (symbolData.times && Array.isArray(symbolData.times)) {
                // Extract open and close times from the times array

                symbolData.times.forEach((timeSession: any) => {
                    if (timeSession && timeSession.open && timeSession.close) {
                        // Convert timestamps to time strings (HH:MM:SS format)
                        let openTime: string;
                        let closeTime: string;

                        // Handle Unix timestamps (numbers) - this is what TradingTimes class actually stores
                        if (typeof timeSession.open === 'number') {
                            openTime = new Date(timeSession.open * 1000).toISOString().substr(11, 8);
                        } else if (timeSession.open instanceof Date) {
                            openTime = timeSession.open.toISOString().substr(11, 8);
                        } else {
                            openTime = String(timeSession.open);
                        }

                        if (typeof timeSession.close === 'number') {
                            closeTime = new Date(timeSession.close * 1000).toISOString().substr(11, 8);
                        } else if (timeSession.close instanceof Date) {
                            closeTime = timeSession.close.toISOString().substr(11, 8);
                        } else {
                            closeTime = String(timeSession.close);
                        }

                        transformedTradingTimes[symbol].open.push(openTime);
                        transformedTradingTimes[symbol].close.push(closeTime);
                    } else {
                        logger.warn(`Invalid time session for ${symbol}:`, timeSession);
                    }
                });
            } else {
                logger.warn(`No valid times array for ${symbol}. Available properties:`, Object.keys(symbolData));

                // Check if this is fallback data with different structure
                if (symbolData.open && symbolData.close) {
                    // This might be fallback data from getTradingTimes utility
                    transformedTradingTimes[symbol].open = Array.isArray(symbolData.open)
                        ? symbolData.open
                        : [symbolData.open];
                    transformedTradingTimes[symbol].close = Array.isArray(symbolData.close)
                        ? symbolData.close
                        : [symbolData.close];
                }
            }
        }
    });

    return transformedTradingTimes;
}

/**
 * Create services wrapper around ApiHelpers
 * @returns TServices implementation
 */
export function createServices(): TServices {
    return {
        /**
         * Get active symbols data
         * @returns Promise resolving to active symbols array
         */
        async getActiveSymbols(): Promise<any> {
            try {
                const apiHelpers = ApiHelpers.instance as any;

                if (!isApiHelpersInitialized(apiHelpers)) {
                    throw new Error('ApiHelpers not initialized or active_symbols not available');
                }

                // Retrieve active symbols using the existing service
                const activeSymbols = await apiHelpers.active_symbols.retrieveActiveSymbols();

                // Convert the processed symbols back to array format for the adapter
                if (!Array.isArray(activeSymbols)) {
                    logger.warn('No active symbols available from ApiHelpers');
                    return [];
                }

                return activeSymbols;
            } catch (error) {
                logger.error('Error getting active symbols:', error);

                // Fallback: try to get from the raw active_symbols array if available
                try {
                    const apiHelpers = ApiHelpers.instance as any;
                    if (isApiHelpersInitialized(apiHelpers) && apiHelpers.active_symbols.active_symbols) {
                        return apiHelpers.active_symbols.active_symbols;
                    }
                } catch (fallbackError) {
                    logger.error('Fallback active symbols retrieval failed:', fallbackError);
                }

                return [];
            }
        },

        /**
         * Get trading times data
         * @returns Promise resolving to trading times object
         */
        async getTradingTimes(): Promise<any> {
            try {
                const apiHelpers = ApiHelpers.instance as any;

                if (!apiHelpers) {
                    logger.error('ApiHelpers instance not available');
                    return {};
                }

                if (!apiHelpers.trading_times) {
                    logger.error('trading_times not available on ApiHelpers instance');
                    return {};
                }
                // Initialize trading times if not already done
                await apiHelpers.trading_times.initialise();

                // Get the trading times data - this is the actual data structure from TradingTimes class
                const tradingTimesData = apiHelpers.trading_times.trading_times;

                if (!tradingTimesData || typeof tradingTimesData !== 'object') {
                    logger.warn('No trading times data available, trying fallback...');

                    // Try to trigger setTradingTimes fallback manually
                    if (typeof apiHelpers.trading_times.setTradingTimes === 'function') {
                        apiHelpers.trading_times.setTradingTimes();
                        const fallbackData = apiHelpers.trading_times.trading_times;

                        if (fallbackData && typeof fallbackData === 'object') {
                            // Use the fallback data
                            return transformTradingTimesData(fallbackData);
                        }
                    }

                    return {};
                }

                return transformTradingTimesData(tradingTimesData);
            } catch (error) {
                logger.error('Error getting trading times:', error);
                logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
                return {};
            }
        },
    };
}
