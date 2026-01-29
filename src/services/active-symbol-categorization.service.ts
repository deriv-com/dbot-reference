import { localize } from '@deriv-com/translations';
import sortSymbols, { ActiveSymbol, ActiveSymbols } from '../utils/sort-symbols-utils';

export interface ProcessedSymbol {
    display_name: string;
    pip_size: number;
    is_active: boolean;
}

export interface ProcessedSubmarket {
    display_name: string;
    symbols: Record<string, ProcessedSymbol>;
}

export interface ProcessedMarket {
    display_name: string;
    submarkets: Record<string, ProcessedSubmarket>;
}

export interface BotSymbol {
    group: string;
    text: string;
    value: string;
    submarket: string;
}

export interface SubmarketGroup {
    submarket_display_name: string;
    items: ActiveSymbols;
}

export interface SubgroupGroup {
    subgroup_display_name: string;
    submarkets: Record<string, SubmarketGroup>;
}

export interface MarketGroup {
    market: string;
    market_display_name: string;
    subgroups: Record<string, SubgroupGroup>;
}

export type CategorizedSymbols = Record<string, MarketGroup>;

/**
 * Active Symbol Categorization Service
 *
 * This service provides a unified approach to:
 * - Translating market category names
 * - Processing and categorizing active symbols
 * - Generating dropdown options for UI components
 * - Handling symbol display names and mappings
 */
export class ActiveSymbolCategorizationService {
    private static instance: ActiveSymbolCategorizationService;

    // Cached translation mappings to avoid creating objects on every access
    private _marketTranslations: Record<string, string> | null = null;
    private _subgroupTranslations: Record<string, string> | null = null;
    private _submarketTranslations: Record<string, string> | null = null;

    // Translation mappings with memoization for performance
    private get marketTranslations(): Record<string, string> {
        if (!this._marketTranslations) {
            this._marketTranslations = {
                // Main market categories - following user specification
                Markets: localize('Markets'),
                Favorites: localize('Favorites'),
                Favourites: localize('Favorites'),
                Derived: 'Derived', // Keep in English
                Baskets: 'Baskets', // Keep in English
                Synthetics: 'Synthetics', // Keep in English
                Forex: 'Forex', // Keep in English
                'Stock Indices': localize('Stock Indices'),
                Cryptocurrencies: localize('Cryptocurrencies'),
                Commodities: localize('Commodities'),

                // API format mappings
                forex: 'Forex', // Keep in English
                synthetic_index: 'Derived', // Keep in English
                cryptocurrency: localize('Cryptocurrencies'),
                commodities: localize('Commodities'),
                stock_index: localize('Stock Indices'),
                indices: localize('Stock Indices'),
                basket_index: 'Baskets', // Keep in English

                // Additional mappings for common variations
                stock_indices: localize('Stock Indices'),
                'stock-indices': localize('Stock Indices'),
                StockIndices: localize('Stock Indices'),

                // Specific submarket categories that should be translated - only translate "indices" word
                'American indices': `${localize('American indices')}`,
                'Asian indices': `${localize('Asian indices')}`,
                'European indices': `${localize('European indices')}`,
            };
        }
        return this._marketTranslations;
    }

    // Subgroup translations with memoization for performance
    private get subgroupTranslations(): Record<string, string> {
        if (!this._subgroupTranslations) {
            this._subgroupTranslations = {
                none: '', // Will be replaced with market display name
                synthetics: 'Synthetics', // Keep in English
                baskets: 'Baskets', // Keep in English
                major_pairs: localize('Major Pairs'),
                minor_pairs: localize('Minor Pairs'),
                smart_fx: 'Smart FX', // Keep in English
                metals: localize('Metals'),
                energy: 'Energy', // Keep in English
                americas: 'Americas', // Keep in English
                asia_oceania: 'Asia/Oceania', // Keep in English
                europe_africa: 'Europe/Africa', // Keep in English
            };
        }
        return this._subgroupTranslations;
    }

    // Submarket translations with memoization for performance
    private get submarketTranslations(): Record<string, string> {
        if (!this._submarketTranslations) {
            this._submarketTranslations = {
                // Derived submarkets - only translate "indices" word
                random_index: `${localize('Continuous Indices')}`,
                random_daily: `${localize('Daily Reset Indices')}`,
                crash_boom: `${localize('Crash/Boom Indices')}`,
                crash_index: `${localize('Crash/Boom Indices')}`,
                step_indices: `${localize('Step Indices')}`,
                step_index: `${localize('Step Indices')}`,
                range_break: `${localize('Range Break Indices')}`,
                range_break_indices: `${localize('Range Break Indices')}`,
                jump_indices: `${localize('Jump Indices')}`,
                jump_index: `${localize('Jump Indices')}`,

                // Forex submarkets
                major_pairs: localize('Major Pairs'),
                minor_pairs: localize('Minor Pairs'),
                smart_fx: 'Smart FX', // Keep in English

                // Cryptocurrency submarkets
                cryptocurrency: localize('Cryptocurrencies'),
                non_stable_coin: localize('Cryptocurrencies'),

                // Commodities submarkets
                metals: localize('Metals'),
                energy: 'Energy', // Keep in English

                // Stock indices submarkets
                americas: 'Americas', // Keep in English
                americas_OTC: `${localize('American indices')}`,
                asia_oceania: 'Asia/Oceania', // Keep in English
                asia_oceania_OTC: `${localize('Asian indices')}`,
                europe_africa: 'Europe/Africa', // Keep in English
                europe_OTC: `${localize('European indices')}`,
                otc_index: ` ${localize('OTC indices')}`,

                // Basket indices - Keep in English but group by category
                basket_forex: 'Forex Basket',
                forex_basket: 'Forex Basket',
                basket_commodities: 'Commodities Basket',
                commodity_basket: 'Commodities Basket',
                basket_cryptocurrency: 'Cryptocurrency Basket',
            };
        }
        return this._submarketTranslations;
    }

    // Trade type names that should NOT be translated
    private readonly tradeTypeNames = new Set([
        'Up/Down',
        'Touch/No Touch',
        'In/Out',
        'Asians',
        'Digits',
        'Reset Call/Reset Put',
        'Call Spread/Put Spread',
        'High/Low Ticks',
        'Only Ups/Only Downs',
        'Multipliers',
        'Accumulators',
        'Rise/Fall',
        'Higher/Lower',
        'Rise',
        'Fall',
        'Higher',
        'Lower',
        'Touch',
        'No Touch',
        'Matches',
        'Differs',
        'Even',
        'Odd',
        'Over',
        'Under',
        'Up',
        'Down',
        'Call',
        'Put',
        'Buy',
    ]);

    // Names that should remain in English according to user specification
    private readonly keepInEnglishPatterns = [
        // Volatility indices
        /^Volatility \d+( \(\d+s\))? Index$/i,
        // Crash/Boom indices
        /^Crash \d+ Index$/i,
        /^Boom \d+ Index$/i,
        // Jump indices
        /^Jump \d+ Index$/i,
        // Step indices
        /^Step Index \d+$/i,
        /^Step \d+ Index$/i,
        // Range Break indices
        /^Range Break \d+ Index$/i,
        // Bear/Bull Market
        /^Bear Market Index$/i,
        /^Bull Market Index$/i,
        // Forex pairs
        /^[A-Z]{3}\/[A-Z]{3}$/i,
        // Stock indices
        /^US \d+$/i,
        /^US Tech \d+$/i,
        /^Wall Street \d+$/i,
        /^Australia \d+$/i,
        /^Hong Kong \d+$/i,
        /^Japan \d+$/i,
        /^Euro \d+$/i,
        /^France \d+$/i,
        /^Germany \d+$/i,
        /^Netherlands \d+$/i,
        /^Swiss \d+$/i,
        /^UK \d+$/i,
        // Cryptocurrencies
        /^[A-Z]{3}\/USD$/i,
        // Metals
        /^(Gold|Silver|Platinum|Palladium)\/USD$/i,
        // Baskets
        /^(Gold|AUD|EUR|GBP|USD) Basket$/i,
    ];

    private constructor() {}

    public static getInstance(): ActiveSymbolCategorizationService {
        if (!ActiveSymbolCategorizationService.instance) {
            ActiveSymbolCategorizationService.instance = new ActiveSymbolCategorizationService();
        }
        return ActiveSymbolCategorizationService.instance;
    }

    /**
     * Checks if a given name should remain in English according to user specification
     */
    private shouldKeepInEnglish(name: string): boolean {
        return this.keepInEnglishPatterns.some(pattern => pattern.test(name));
    }

    /**
     * Translates market category names with proper handling of trade types and items that should remain in English
     */
    public translateMarketCategory(categoryName: string): string {
        if (!categoryName) return categoryName;

        // Don't translate trade type names - keep them in English
        if (this.tradeTypeNames.has(categoryName)) {
            return categoryName;
        }

        // Don't translate names that should remain in English according to user specification
        if (this.shouldKeepInEnglish(categoryName)) {
            return categoryName;
        }

        return this.marketTranslations[categoryName] || categoryName;
    }

    /**
     * Gets market display name with translation
     */
    public getMarketDisplayName(market: string): string {
        return this.marketTranslations[market] || market;
    }

    /**
     * Gets subgroup display name with translation
     */
    public getSubgroupDisplayName(subgroup: string, market: string): string {
        if (subgroup === 'none') {
            return this.getMarketDisplayName(market);
        }
        return this.subgroupTranslations[subgroup] || subgroup;
    }

    /**
     * Gets submarket display name with translation
     */
    public getSubmarketDisplayName(submarket: string): string {
        const result = this.submarketTranslations[submarket] || submarket;
        return result;
    }

    /**
     * Categorizes symbols using the new structure from the user's specification
     */
    public categorizeSymbols(symbols: ActiveSymbols): CategorizedSymbols {
        if (symbols.length === 0) {
            return {};
        }

        // Sort symbols first using the centralized sorting utility
        const sortedSymbols = sortSymbols(symbols);

        // Categorize symbols by market, subgroup, and submarket
        let categorizedSymbols = sortedSymbols.reduce((acc: CategorizedSymbols, symbol: ActiveSymbol) => {
            // Validate required symbol fields
            if (!symbol.market || !symbol.submarket) {
                console.warn('Invalid symbol structure - missing required fields:', symbol);
                return acc;
            }

            const { market, submarket } = symbol;
            const subgroup = symbol.subgroup || 'none';

            acc[market] ??= {
                market,
                market_display_name: this.getMarketDisplayName(market),
                subgroups: {},
            };

            acc[market].subgroups[subgroup] ??= {
                subgroup_display_name: this.getSubgroupDisplayName(subgroup, market),
                submarkets: {},
            };

            acc[market].subgroups[subgroup].submarkets[submarket] ??= {
                submarket_display_name: this.getSubmarketDisplayName(submarket),
                items: [],
            };

            acc[market].subgroups[subgroup].submarkets[submarket].items.push(symbol);

            return acc;
        }, {});

        // Sort submarkets by display name
        Object.keys(categorizedSymbols).forEach(market => {
            Object.keys(categorizedSymbols[market].subgroups).forEach(subgroup => {
                const submarkets = categorizedSymbols[market].subgroups[subgroup].submarkets;
                const sortedSubmarkets = Object.entries(submarkets)
                    .sort(([, a], [, b]) =>
                        (a as SubmarketGroup).submarket_display_name.localeCompare(
                            (b as SubmarketGroup).submarket_display_name
                        )
                    )
                    .reduce(
                        (sortedAcc, [key, value]) => {
                            sortedAcc[key] = value as SubmarketGroup;
                            return sortedAcc;
                        },
                        {} as Record<string, SubmarketGroup>
                    );
                categorizedSymbols[market].subgroups[subgroup].submarkets = sortedSubmarkets;
            });
        });

        // Create 'all' category by flattening all submarkets
        const allCategory = Object.values(categorizedSymbols).reduce(
            (result, item) => {
                Object.keys(item.subgroups).forEach(key => {
                    const newKey = key === 'none' ? item.market : key;
                    const newName =
                        key === 'none'
                            ? this.getMarketDisplayName(item.market)
                            : item.subgroups[key].subgroup_display_name;

                    result[newKey] = {
                        subgroup_display_name: newName,
                        submarkets: item.subgroups[key].submarkets,
                    };
                });
                return result;
            },
            {} as Record<string, SubgroupGroup>
        );

        // Add favorites and all categories
        categorizedSymbols = {
            favorites: {
                market: 'favorites',
                market_display_name: localize('Favorites'),
                subgroups: {},
            },
            all: {
                market: 'all',
                market_display_name: localize('All'),
                subgroups: allCategory,
            },
            ...categorizedSymbols,
        };

        return categorizedSymbols;
    }

    /**
     * Processes active symbols into the legacy format for backward compatibility
     */
    public processActiveSymbols(
        activeSymbols: ActiveSymbols,
        disabledSymbols: string[] = [],
        disabledSubmarkets: string[] = []
    ): Record<string, ProcessedMarket> {
        if (activeSymbols.length === 0) {
            return {};
        }

        return activeSymbols.reduce((processed: Record<string, ProcessedMarket>, symbol: ActiveSymbol) => {
            const symbolCode = symbol.underlying_symbol || symbol.symbol;
            const symbolSubmarket = symbol.submarket;
            const symbolMarket = symbol.market;

            // Skip disabled symbols and submarkets
            if (disabledSymbols.includes(symbolCode) || disabledSubmarkets.includes(symbolSubmarket)) {
                return processed;
            }

            const isExistingValue = (object: Record<string, any>, propValue: string) =>
                Object.keys(object).includes(propValue);

            if (!isExistingValue(processed, symbolMarket)) {
                processed[symbolMarket] = {
                    display_name: symbol.market_display_name || this.getMarketDisplayName(symbolMarket),
                    submarkets: {},
                };
            }

            const { submarkets } = processed[symbolMarket];

            if (!isExistingValue(submarkets, symbolSubmarket)) {
                const displayName = symbol.submarket_display_name || this.getSubmarketDisplayName(symbolSubmarket);
                submarkets[symbolSubmarket] = {
                    display_name: displayName,
                    symbols: {},
                };
            }

            const { symbols } = submarkets[symbolSubmarket];

            if (!isExistingValue(symbols, symbolCode)) {
                const displayName = symbol.display_name || symbolCode;
                symbols[symbolCode] = {
                    display_name: displayName,
                    pip_size: `${symbol.pip || symbol.pip_size || 0}`.length - 2,
                    is_active: !symbol.is_trading_suspended && !!symbol.exchange_is_open,
                };
            }

            return processed;
        }, {});
    }

    /**
     * Generates symbols for bot usage with proper translation
     */
    public getSymbolsForBot(
        processedSymbols: Record<string, ProcessedMarket>,
        disabledSymbols: string[] = [],
        disabledSubmarkets: string[] = [],
        isMarketClosed: (market: string) => boolean = () => false
    ): BotSymbol[] {
        const symbolsForBot: BotSymbol[] = [];

        Object.keys(processedSymbols).forEach(marketName => {
            if (isMarketClosed(marketName)) return;

            const market = processedSymbols[marketName];
            const { submarkets } = market;

            Object.keys(submarkets).forEach(submarketName => {
                if (disabledSubmarkets.includes(submarketName)) return;

                const submarket = submarkets[submarketName];
                const { symbols } = submarket;

                Object.keys(symbols).forEach(symbolName => {
                    if (disabledSymbols.includes(symbolName)) return;

                    const symbol = symbols[symbolName];
                    symbolsForBot.push({
                        group: submarket.display_name,
                        text: symbol.display_name,
                        value: symbolName,
                        submarket: submarketName,
                    });
                });
            });
        });

        return symbolsForBot;
    }

    /**
     * Generates market dropdown options with translations
     */
    public getMarketDropdownOptions(
        processedSymbols: Record<string, ProcessedMarket>,
        isMarketClosed: (market: string) => boolean = () => false
    ): [string, string][] {
        const marketOptions: [string, string][] = [];

        Object.keys(processedSymbols).forEach(marketName => {
            const { display_name } = processedSymbols[marketName];
            const translatedDisplayName = this.translateMarketCategory(display_name);
            const marketDisplayName = translatedDisplayName + (isMarketClosed(marketName) ? ' (Closed)' : '');
            marketOptions.push([marketDisplayName, marketName]);
        });

        // Sort with synthetic_index first
        marketOptions.sort(a => (a[1] === 'synthetic_index' ? -1 : 1));

        return marketOptions;
    }

    /**
     * Generates submarket dropdown options with translations
     */
    public getSubmarketDropdownOptions(
        processedSymbols: Record<string, ProcessedMarket>,
        market: string,
        isSubmarketClosed: (submarket: string) => boolean = () => false
    ): [string, string][] {
        const submarketOptions: [string, string][] = [];
        const marketObj = processedSymbols[market];

        if (marketObj) {
            const { submarkets } = marketObj;

            Object.keys(submarkets).forEach(submarketName => {
                const { display_name } = submarkets[submarketName];
                const translatedDisplayName = this.translateMarketCategory(display_name);
                const submarketDisplayName =
                    translatedDisplayName + (isSubmarketClosed(submarketName) ? ' (Closed)' : '');
                submarketOptions.push([submarketDisplayName, submarketName]);
            });
        }

        if (market === 'synthetic_index') {
            submarketOptions.sort(a => (a[1] === 'random_index' ? -1 : 1));
        }

        return submarketOptions;
    }

    /**
     * Generates symbol dropdown options with translations
     */
    public getSymbolDropdownOptions(
        processedSymbols: Record<string, ProcessedMarket>,
        submarket: string,
        isSymbolClosed: (symbol: string) => boolean = () => false
    ): [string, string][] {
        const symbolOptions: [string, string][] = [];

        Object.keys(processedSymbols).forEach(marketName => {
            const { submarkets } = processedSymbols[marketName];

            Object.keys(submarkets).forEach(submarketName => {
                if (submarketName === submarket) {
                    const submarketObj = submarkets[submarketName];
                    const { symbols } = submarketObj;

                    Object.keys(symbols).forEach(symbolName => {
                        const { display_name } = symbols[symbolName];
                        const symbolDisplayName = display_name + (isSymbolClosed(symbolName) ? ' (Closed)' : '');
                        symbolOptions.push([symbolDisplayName, symbolName]);
                    });
                }
            });
        });

        return symbolOptions;
    }

    /**
     * Sorts dropdown options with closed items at the end
     */
    public sortDropdownOptions<T extends [string, string]>(
        dropdownOptions: T[],
        closedFunc: (value: string) => boolean
    ): T[] {
        const options = [...dropdownOptions];

        options.sort((a, b) => {
            const isAClosed = closedFunc(a[1]);
            const isBClosed = closedFunc(b[1]);

            if (isAClosed && !isBClosed) {
                return 1;
            } else if (isAClosed === isBClosed) {
                return 0;
            }
            return -1;
        });

        return options;
    }

    /**
     * Translates market category names in trading times data
     */
    public translateTradingTimesData(tradingTimesData: any): any {
        if (!tradingTimesData?.markets) {
            return tradingTimesData;
        }

        const translatedData = { ...tradingTimesData };

        translatedData.markets = tradingTimesData.markets.map((market: any) => ({
            ...market,
            name: this.translateMarketCategory(market.name),
            submarkets:
                market.submarkets?.map((submarket: any) => ({
                    ...submarket,
                    name: this.translateMarketCategory(submarket.name),
                })) || [],
        }));

        return translatedData;
    }
}

// Export singleton instance
export const activeSymbolCategorizationService = ActiveSymbolCategorizationService.getInstance();
