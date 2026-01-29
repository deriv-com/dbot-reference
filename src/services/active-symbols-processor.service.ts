import { tradingTimesService } from '../components/shared/services/trading-times-service';
import { generateDisplayName, MARKET_MAPPINGS } from '../components/shared/utils/common-data';
import { activeSymbolCategorizationService } from './active-symbol-categorization.service';

// API Response Interfaces for better type safety
export interface TradingTimesSymbol {
    symbol: string;
    display_name: string;
    underlying_symbol?: string;
}

export interface TradingTimesSubmarket {
    name: string;
    symbols?: TradingTimesSymbol[];
}

export interface TradingTimesMarket {
    name: string;
    submarkets?: TradingTimesSubmarket[];
}

export interface TradingTimesResponse {
    markets: TradingTimesMarket[];
}

export interface ActiveSymbolInput {
    symbol: string;
    underlying_symbol?: string;
    display_name?: string;
    market: string;
    market_display_name?: string;
    submarket: string;
    submarket_display_name?: string;
    subgroup?: string;
    pip_size?: number;
    pip?: number;
    symbol_type?: string;
    underlying_symbol_type?: string;
    is_trading_suspended?: boolean;
    exchange_is_open?: boolean;
}

export interface ProcessedActiveSymbol {
    symbol: string;
    underlying_symbol: string;
    display_name: string;
    market: string;
    market_display_name: string;
    submarket: string;
    submarket_display_name: string;
    subgroup?: string;
    subgroup_display_name?: string;
    pip_size?: number;
    pip?: number;
    symbol_type?: string;
    underlying_symbol_type?: string;
    underlying_symbol_display_name?: string;
    symbol_display_name?: string;
    is_trading_suspended?: boolean;
    exchange_is_open?: boolean;
}

export interface PipSizes {
    [symbol: string]: number;
}

/**
 * Active Symbols Processor Service
 *
 * Handles all active symbol processing including:
 * - Pip size calculation
 * - Symbol enrichment with trading times data
 * - Display name generation
 * - Backward compatibility
 */
export class ActiveSymbolsProcessorService {
    private static instance: ActiveSymbolsProcessorService;

    // Constants for timeouts and cache duration
    private readonly ENRICHMENT_TIMEOUT_MS = 10000;

    private constructor() {}

    public static getInstance(): ActiveSymbolsProcessorService {
        if (!ActiveSymbolsProcessorService.instance) {
            ActiveSymbolsProcessorService.instance = new ActiveSymbolsProcessorService();
        }
        return ActiveSymbolsProcessorService.instance;
    }

    /**
     * Process pip sizes from active symbols
     */
    public processPipSizes(activeSymbols: ActiveSymbolInput[]): PipSizes {
        const pipSizes: PipSizes = {};

        activeSymbols.forEach((symbol: ActiveSymbolInput) => {
            const underlyingSymbol = symbol.underlying_symbol || symbol.symbol;
            const pipSize = symbol.pip_size || symbol.pip;

            if (underlyingSymbol && pipSize) {
                // Calculate decimal places from pip size (e.g., 0.01 -> 2, 0.0001 -> 4)
                // This converts pip size to exponential notation and extracts the exponent
                const exponent = +(+pipSize).toExponential().substring(3);
                pipSizes[underlyingSymbol] = Math.abs(exponent);
            }
        });

        return pipSizes;
    }

    /**
     * Get market mapping from common data
     */
    private getMarketMapping(): Map<string, string> {
        return MARKET_MAPPINGS.MARKET_DISPLAY_NAMES;
    }

    /**
     * Get submarket mapping from common data
     */
    private getSubmarketMapping(): Map<string, string> {
        return MARKET_MAPPINGS.SUBMARKET_DISPLAY_NAMES;
    }

    /**
     * Create lookup maps from trading times data
     */
    private async createLookupMaps() {
        try {
            const tradingTimes = await tradingTimesService.getTradingTimes();

            if (!tradingTimes?.markets || !Array.isArray(tradingTimes.markets)) {
                throw new Error('Invalid trading times data structure');
            }

            return this.processTradingTimesData(tradingTimes);
        } catch (error) {
            console.warn('Failed to create lookup maps from trading times, using fallback mappings:', error);

            // Return fallback maps with basic market mappings when trading times API fails
            const marketDisplayNames = new Map<string, string>();
            const submarketDisplayNames = new Map<string, string>();
            const symbolDisplayNames = new Map<string, string>();

            // Add basic market mappings from common data
            const marketMapping = this.getMarketMapping();
            const submarketMapping = this.getSubmarketMapping();

            // Populate with basic mappings
            marketMapping.forEach((displayName, code) => {
                marketDisplayNames.set(code, displayName);
            });

            submarketMapping.forEach((displayName, code) => {
                submarketDisplayNames.set(code, displayName);
            });

            return {
                marketDisplayNames,
                submarketDisplayNames,
                symbolDisplayNames,
            };
        }
    }

    /**
     * Process trading times data into lookup maps
     */
    private processTradingTimesData(tradingTimes: TradingTimesResponse) {
        const marketDisplayNames = new Map<string, string>();
        const submarketDisplayNames = new Map<string, string>();
        const symbolDisplayNames = new Map<string, string>();
        const marketMapping = this.getMarketMapping();
        const submarketMapping = this.getSubmarketMapping();

        // Process markets and submarkets
        tradingTimes.markets.forEach((market: TradingTimesMarket) => {
            if (market.name) {
                const translatedMarketName = activeSymbolCategorizationService.translateMarketCategory(market.name);
                marketDisplayNames.set(market.name, translatedMarketName);

                // Create reverse mapping for market codes
                marketMapping.forEach((name, code) => {
                    if (name === market.name) {
                        marketDisplayNames.set(code, translatedMarketName);
                    }
                });
            }

            if (market.submarkets) {
                market.submarkets.forEach((submarket: TradingTimesSubmarket) => {
                    if (submarket.name && market.name) {
                        const translatedSubmarketName = activeSymbolCategorizationService.translateMarketCategory(
                            submarket.name
                        );
                        const key = `${market.name}_${submarket.name}`;
                        submarketDisplayNames.set(key, translatedSubmarketName);
                        submarketDisplayNames.set(submarket.name, translatedSubmarketName);

                        // Create mapping for market codes and submarket codes
                        marketMapping.forEach((name, code) => {
                            if (name === market.name) {
                                const codeKey = `${code}_${submarket.name}`;
                                submarketDisplayNames.set(codeKey, translatedSubmarketName);
                            }
                        });
                    }

                    // Process symbols
                    if (submarket.symbols) {
                        submarket.symbols.forEach((symbolInfo: TradingTimesSymbol) => {
                            if (symbolInfo.symbol && symbolInfo.display_name) {
                                symbolDisplayNames.set(symbolInfo.symbol, symbolInfo.display_name);
                            }
                            if (symbolInfo.underlying_symbol && symbolInfo.display_name) {
                                symbolDisplayNames.set(symbolInfo.underlying_symbol, symbolInfo.display_name);
                            }
                        });
                    }
                });
            }
        });

        // Add direct submarket code mappings
        submarketMapping.forEach((submarketName, submarketCode) => {
            submarketDisplayNames.set(submarketCode, submarketName);

            // Also add with market prefixes
            marketMapping.forEach((_, marketCode) => {
                const key = `${marketCode}_${submarketCode}`;
                submarketDisplayNames.set(key, submarketName);
            });
        });

        return {
            marketDisplayNames,
            submarketDisplayNames,
            symbolDisplayNames,
        };
    }

    /**
     * Enrich a single symbol with display names and additional data
     */
    private enrichSymbol(
        symbol: ActiveSymbolInput,
        lookupMaps: {
            marketDisplayNames: Map<string, string>;
            submarketDisplayNames: Map<string, string>;
            symbolDisplayNames: Map<string, string>;
        }
    ): ProcessedActiveSymbol {
        const enrichedSymbol: Partial<ProcessedActiveSymbol> = { ...symbol };

        // Add market display name
        if (symbol.market) {
            enrichedSymbol.market_display_name =
                lookupMaps.marketDisplayNames.get(symbol.market) ||
                activeSymbolCategorizationService.translateMarketCategory(symbol.market);
        }

        // Add submarket display name
        if (symbol.submarket) {
            enrichedSymbol.submarket_display_name = activeSymbolCategorizationService.getSubmarketDisplayName(
                symbol.submarket
            );
        }

        // Add subgroup display name
        if (symbol.subgroup) {
            let subgroupDisplayName = symbol.subgroup;

            // Try with market prefix
            if (symbol.market) {
                const subgroupKey = `${symbol.market}_${symbol.subgroup}`;
                subgroupDisplayName = lookupMaps.submarketDisplayNames.get(subgroupKey) || subgroupDisplayName;
            }

            // Try direct subgroup code lookup
            subgroupDisplayName = lookupMaps.submarketDisplayNames.get(symbol.subgroup) || subgroupDisplayName;
            enrichedSymbol.subgroup_display_name = subgroupDisplayName;
        }

        // Add symbol display name
        const symbolCode = symbol.underlying_symbol || symbol.symbol;
        if (symbolCode) {
            const symbolDisplayName = lookupMaps.symbolDisplayNames.get(symbolCode);
            if (symbolDisplayName) {
                enrichedSymbol.display_name = symbolDisplayName;
            } else {
                enrichedSymbol.display_name = this.generateFallbackDisplayName(symbolCode, symbol);
            }
        }

        // Add underlying_symbol display name
        if (symbol.underlying_symbol) {
            const underlyingSymbolDisplayName = lookupMaps.symbolDisplayNames.get(symbol.underlying_symbol);
            if (underlyingSymbolDisplayName) {
                enrichedSymbol.underlying_symbol_display_name = underlyingSymbolDisplayName;
            }
        }

        // Add symbol field display name
        if (symbol.symbol) {
            const symbolFieldDisplayName = lookupMaps.symbolDisplayNames.get(symbol.symbol);
            if (symbolFieldDisplayName) {
                enrichedSymbol.symbol_display_name = symbolFieldDisplayName;
            }
        }

        // Handle backward compatibility
        this.ensureBackwardCompatibility(enrichedSymbol);

        return enrichedSymbol as ProcessedActiveSymbol;
    }

    /**
     * Ensure backward compatibility for symbol fields
     */
    private ensureBackwardCompatibility(symbol: Partial<ProcessedActiveSymbol>): void {
        // Handle new API field names
        if (symbol.symbol_type && !symbol.underlying_symbol_type) {
            symbol.underlying_symbol_type = symbol.symbol_type;
        }

        // Ensure we have both symbol and underlying_symbol
        if (symbol.underlying_symbol && !symbol.symbol) {
            symbol.symbol = symbol.underlying_symbol;
        } else if (symbol.symbol && !symbol.underlying_symbol) {
            symbol.underlying_symbol = symbol.symbol;
        }
    }

    /**
     * Generate fallback display name for symbols not found in trading times
     */
    private generateFallbackDisplayName(symbolCode: string, symbol: ActiveSymbolInput): string {
        return generateDisplayName(symbolCode, symbol);
    }

    /**
     * Enrich active symbols with trading times data
     */
    public async enrichActiveSymbolsWithTradingTimes(
        activeSymbols: ActiveSymbolInput[]
    ): Promise<ProcessedActiveSymbol[]> {
        if (!activeSymbols || activeSymbols.length === 0) {
            return [];
        }

        try {
            const lookupMaps = await this.createLookupMaps();

            return activeSymbols.map(symbol => {
                // Validate symbol structure before processing
                if (!symbol || typeof symbol !== 'object') {
                    console.warn('Invalid symbol structure:', symbol);
                    return symbol;
                }

                return this.enrichSymbol(symbol, lookupMaps);
            });
        } catch (error) {
            console.error('Error enriching active symbols:', error);
            // Return symbols as-is with minimal processing for error case
            return activeSymbols.map(symbol => ({
                ...symbol,
                underlying_symbol: symbol.underlying_symbol || symbol.symbol,
                display_name: symbol.display_name || symbol.symbol,
                market_display_name: symbol.market_display_name || symbol.market,
                submarket_display_name: symbol.submarket_display_name || symbol.submarket,
            })) as ProcessedActiveSymbol[];
        }
    }

    /**
     * Process active symbols - complete processing pipeline
     */
    public async processActiveSymbols(activeSymbols: ActiveSymbolInput[]): Promise<{
        enrichedSymbols: ProcessedActiveSymbol[];
        pipSizes: PipSizes;
    }> {
        if (!activeSymbols || !activeSymbols.length) {
            return {
                enrichedSymbols: [],
                pipSizes: {},
            };
        }

        // Process pip sizes
        const pipSizes = this.processPipSizes(activeSymbols);

        // Enrich symbols with trading times data
        const enrichedSymbols = await this.enrichActiveSymbolsWithTradingTimes(activeSymbols);

        return {
            enrichedSymbols,
            pipSizes,
        };
    }
}

// Export singleton instance
export const activeSymbolsProcessorService = ActiveSymbolsProcessorService.getInstance();
