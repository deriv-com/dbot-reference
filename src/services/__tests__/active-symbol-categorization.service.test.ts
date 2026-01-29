import { localize } from '@deriv-com/translations';
import { ActiveSymbolCategorizationService } from '../active-symbol-categorization.service';

// Mock the localize function
jest.mock('@deriv-com/translations', () => ({
    localize: jest.fn((key: string) => key),
}));

// Mock the sort symbols utility
jest.mock('../../utils/sort-symbols-utils', () => ({
    __esModule: true,
    default: jest.fn(symbols => symbols),
}));

describe('ActiveSymbolCategorizationService', () => {
    let service: ActiveSymbolCategorizationService;

    beforeEach(() => {
        service = ActiveSymbolCategorizationService.getInstance();
        // Clear the memoized translations cache by accessing private properties
        (service as any)._marketTranslations = null;
        (service as any)._subgroupTranslations = null;
        (service as any)._submarketTranslations = null;
        jest.clearAllMocks();
    });

    describe('translateMarketCategory', () => {
        it('should translate market names correctly', () => {
            const result = service.translateMarketCategory('Cryptocurrencies');
            expect(localize).toHaveBeenCalledWith('Cryptocurrencies');
            expect(result).toBe('Cryptocurrencies');
        });

        it('should keep trade types in English', () => {
            const result = service.translateMarketCategory('Up/Down');
            expect(result).toBe('Up/Down');
            expect(localize).not.toHaveBeenCalled();
        });

        it('should keep financial instruments in English', () => {
            const result = service.translateMarketCategory('Volatility 100 Index');
            expect(result).toBe('Volatility 100 Index');
            expect(localize).not.toHaveBeenCalled();
        });

        it('should handle empty category names', () => {
            const result = service.translateMarketCategory('');
            expect(result).toBe('');
        });

        it('should handle undefined category names', () => {
            const result = service.translateMarketCategory(undefined as any);
            expect(result).toBeUndefined();
        });
    });

    describe('getMarketDisplayName', () => {
        it('should return translated market display name', () => {
            const result = service.getMarketDisplayName('cryptocurrency');
            expect(localize).toHaveBeenCalledWith('Cryptocurrencies');
            expect(result).toBe('Cryptocurrencies');
        });

        it('should return original name if no translation exists', () => {
            const result = service.getMarketDisplayName('unknown_market');
            expect(result).toBe('unknown_market');
        });
    });

    describe('getSubgroupDisplayName', () => {
        it('should return market display name for "none" subgroup', () => {
            const result = service.getSubgroupDisplayName('none', 'forex');
            expect(result).toBe('Forex');
        });

        it('should return translated subgroup name', () => {
            const result = service.getSubgroupDisplayName('major_pairs', 'forex');
            expect(localize).toHaveBeenCalledWith('Major Pairs');
            expect(result).toBe('Major Pairs');
        });
    });

    describe('getSubmarketDisplayName', () => {
        it('should return translated submarket name', () => {
            const result = service.getSubmarketDisplayName('random_index');
            expect(localize).toHaveBeenCalledWith('Continuous Indices');
            expect(result).toBe('Continuous Indices');
        });

        it('should return original name if no translation exists', () => {
            const result = service.getSubmarketDisplayName('unknown_submarket');
            expect(result).toBe('unknown_submarket');
        });
    });

    describe('categorizeSymbols', () => {
        const mockSymbols = [
            {
                symbol: 'R_10',
                display_name: 'Volatility 10 Index',
                market: 'synthetic_index',
                submarket: 'random_index',
                subgroup: 'synthetics',
            },
            {
                symbol: 'frxEURUSD',
                display_name: 'EUR/USD',
                market: 'forex',
                submarket: 'major_pairs',
            },
        ];

        it('should categorize symbols correctly', () => {
            const result = service.categorizeSymbols(mockSymbols);

            expect(result).toHaveProperty('favorites');
            expect(result).toHaveProperty('all');
            expect(result).toHaveProperty('synthetic_index');
            expect(result).toHaveProperty('forex');
        });

        it('should handle empty symbol arrays', () => {
            const result = service.categorizeSymbols([]);
            expect(result).toEqual({});
        });

        it('should validate required symbol fields', () => {
            const invalidSymbol = { symbol: 'TEST' }; // Missing market and submarket
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            service.categorizeSymbols([invalidSymbol as any]);

            expect(consoleSpy).toHaveBeenCalledWith(
                'Invalid symbol structure - missing required fields:',
                invalidSymbol
            );
            consoleSpy.mockRestore();
        });
    });

    describe('processActiveSymbols', () => {
        const mockSymbols = [
            {
                symbol: 'R_10',
                underlying_symbol: 'R_10',
                display_name: 'Volatility 10 Index',
                market: 'synthetic_index',
                submarket: 'random_index',
                pip_size: 0.001,
                exchange_is_open: true,
                is_trading_suspended: false,
            },
        ];

        it('should process active symbols correctly', () => {
            const result = service.processActiveSymbols(mockSymbols);

            expect(result).toHaveProperty('synthetic_index');
            expect(result.synthetic_index).toHaveProperty('submarkets');
            expect(result.synthetic_index.submarkets).toHaveProperty('random_index');
        });

        it('should handle empty arrays', () => {
            const result = service.processActiveSymbols([]);
            expect(result).toEqual({});
        });

        it('should skip disabled symbols', () => {
            const result = service.processActiveSymbols(mockSymbols, ['R_10']);
            expect(Object.keys(result)).toHaveLength(0);
        });

        it('should skip disabled submarkets', () => {
            const result = service.processActiveSymbols(mockSymbols, [], ['random_index']);
            expect(Object.keys(result)).toHaveLength(0);
        });
    });

    describe('getSymbolsForBot', () => {
        const mockProcessedSymbols = {
            synthetic_index: {
                display_name: 'Derived',
                submarkets: {
                    random_index: {
                        display_name: 'Continuous Indices',
                        symbols: {
                            R_10: {
                                display_name: 'Volatility 10 Index',
                                pip_size: 3,
                                is_active: true,
                            },
                        },
                    },
                },
            },
        };

        it('should generate bot symbols correctly', () => {
            const result = service.getSymbolsForBot(mockProcessedSymbols);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                group: 'Continuous Indices',
                text: 'Volatility 10 Index',
                value: 'R_10',
                submarket: 'random_index',
            });
        });

        it('should skip closed markets', () => {
            const isMarketClosed = jest.fn().mockReturnValue(true);
            const result = service.getSymbolsForBot(mockProcessedSymbols, [], [], isMarketClosed);

            expect(result).toHaveLength(0);
            expect(isMarketClosed).toHaveBeenCalledWith('synthetic_index');
        });

        it('should skip disabled symbols and submarkets', () => {
            const result = service.getSymbolsForBot(mockProcessedSymbols, ['R_10'], ['random_index']);

            expect(result).toHaveLength(0);
        });
    });

    describe('dropdown options generation', () => {
        const mockProcessedSymbols = {
            synthetic_index: {
                display_name: 'Derived',
                submarkets: {
                    random_index: {
                        display_name: 'Continuous Indices',
                        symbols: {
                            R_10: {
                                display_name: 'Volatility 10 Index',
                                pip_size: 3,
                                is_active: true,
                            },
                        },
                    },
                },
            },
        };

        describe('getMarketDropdownOptions', () => {
            it('should generate market options correctly', () => {
                const result = service.getMarketDropdownOptions(mockProcessedSymbols);

                expect(result).toContainEqual(['Derived', 'synthetic_index']);
            });

            it('should sort synthetic_index first', () => {
                const result = service.getMarketDropdownOptions(mockProcessedSymbols);
                const syntheticIndex = result.find(([, value]) => value === 'synthetic_index');

                expect(result[0]).toBe(syntheticIndex);
            });
        });

        describe('getSubmarketDropdownOptions', () => {
            it('should generate submarket options correctly', () => {
                const result = service.getSubmarketDropdownOptions(mockProcessedSymbols, 'synthetic_index');

                expect(result).toContainEqual(['Continuous Indices', 'random_index']);
            });

            it('should sort random_index first for synthetic_index market', () => {
                const result = service.getSubmarketDropdownOptions(mockProcessedSymbols, 'synthetic_index');
                const randomIndex = result.find(([, value]) => value === 'random_index');

                expect(result[0]).toBe(randomIndex);
            });
        });

        describe('getSymbolDropdownOptions', () => {
            it('should generate symbol options correctly', () => {
                const result = service.getSymbolDropdownOptions(mockProcessedSymbols, 'random_index');

                expect(result).toContainEqual(['Volatility 10 Index', 'R_10']);
            });
        });
    });

    describe('sortDropdownOptions', () => {
        const mockOptions: [string, string][] = [
            ['Open Market', 'open'],
            ['Closed Market (Closed)', 'closed'],
            ['Another Open Market', 'open2'],
        ];

        it('should sort closed items to the end', () => {
            const isClosedFunc = (value: string) => value === 'closed';
            const result = service.sortDropdownOptions(mockOptions, isClosedFunc);

            expect(result[result.length - 1][1]).toBe('closed');
        });
    });

    describe('translateTradingTimesData', () => {
        const mockTradingTimesData = {
            markets: [
                {
                    name: 'Cryptocurrencies',
                    submarkets: [{ name: 'Major Pairs' }],
                },
            ],
        };

        it('should translate trading times data', () => {
            const result = service.translateTradingTimesData(mockTradingTimesData);

            expect(result.markets[0].name).toBe('Cryptocurrencies');
            expect(result.markets[0].submarkets[0].name).toBe('Major Pairs');
        });

        it('should handle missing markets', () => {
            const result = service.translateTradingTimesData({});
            expect(result).toEqual({});
        });

        it('should handle null input', () => {
            const result = service.translateTradingTimesData(null);
            expect(result).toBeNull();
        });
    });
});
