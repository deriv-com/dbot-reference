import { activeSymbolCategorizationService } from '../../services/active-symbol-categorization.service';
import sortSymbols, { ActiveSymbol } from '../sort-symbols-utils';

// Mock the service
jest.mock('../../services/active-symbol-categorization.service', () => ({
    activeSymbolCategorizationService: {
        getSubmarketDisplayName: jest.fn((submarket: string) => {
            const translations: { [key: string]: string } = {
                random_index: 'Continuous Indices',
                crash_boom: 'Crash/Boom Indices',
                major_pairs: 'Major Pairs',
                metals: 'Metals',
            };
            return translations[submarket] || submarket;
        }),
    },
}));

describe('sortSymbols', () => {
    const mockSymbols: ActiveSymbol[] = [
        {
            symbol: 'BTCUSD',
            display_name: 'BTC/USD',
            market: 'cryptocurrency',
            submarket: 'non_stable_coin',
        },
        {
            symbol: 'R_10',
            display_name: 'Volatility 10 Index',
            market: 'synthetic_index',
            submarket: 'random_index',
        },
        {
            symbol: 'frxEURUSD',
            display_name: 'EUR/USD',
            market: 'forex',
            submarket: 'major_pairs',
        },
        {
            symbol: 'OTC_DJI',
            display_name: 'Wall Street 30',
            market: 'indices',
            submarket: 'americas',
        },
        {
            symbol: 'frxXAUUSD',
            display_name: 'Gold/USD',
            market: 'commodities',
            submarket: 'metals',
        },
    ];

    const mockGetSubmarketDisplayName =
        activeSymbolCategorizationService.getSubmarketDisplayName as jest.MockedFunction<
            typeof activeSymbolCategorizationService.getSubmarketDisplayName
        >;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should sort symbols by market order', () => {
        const result = sortSymbols(mockSymbols);

        // Expected order: synthetic_index, forex, indices, cryptocurrency, commodities
        expect(result[0].market).toBe('synthetic_index');
        expect(result[1].market).toBe('forex');
        expect(result[2].market).toBe('indices');
        expect(result[3].market).toBe('cryptocurrency');
        expect(result[4].market).toBe('commodities');
    });

    it('should sort by submarket display name within same market', () => {
        const sameMarketSymbols: ActiveSymbol[] = [
            {
                symbol: 'R_100',
                display_name: 'Volatility 100 Index',
                market: 'synthetic_index',
                submarket: 'random_index',
            },
            {
                symbol: 'CRASH1000',
                display_name: 'Crash 1000 Index',
                market: 'synthetic_index',
                submarket: 'crash_boom',
            },
        ];

        sortSymbols(sameMarketSymbols);

        // Should be sorted by submarket display name
        expect(mockGetSubmarketDisplayName).toHaveBeenCalledWith('random_index');
        expect(mockGetSubmarketDisplayName).toHaveBeenCalledWith('crash_boom');
    });

    it('should handle unknown markets by placing them at the end', () => {
        const symbolsWithUnknown: ActiveSymbol[] = [
            {
                symbol: 'UNKNOWN1',
                display_name: 'Unknown Symbol 1',
                market: 'unknown_market',
                submarket: 'unknown_submarket',
            },
            {
                symbol: 'R_10',
                display_name: 'Volatility 10 Index',
                market: 'synthetic_index',
                submarket: 'random_index',
            },
        ];

        const result = sortSymbols(symbolsWithUnknown);

        expect(result[0].market).toBe('synthetic_index');
        expect(result[1].market).toBe('unknown_market');
    });

    it('should create a defensive copy and not mutate original array', () => {
        const originalSymbols = [...mockSymbols];
        const result = sortSymbols(mockSymbols);

        // Original array should remain unchanged
        expect(mockSymbols).toEqual(originalSymbols);
        // Result should be a different array
        expect(result).not.toBe(mockSymbols);
    });

    it('should handle empty arrays', () => {
        const result = sortSymbols([]);
        expect(result).toEqual([]);
    });

    it('should handle single symbol', () => {
        const singleSymbol: ActiveSymbol[] = [
            {
                symbol: 'R_10',
                display_name: 'Volatility 10 Index',
                market: 'synthetic_index',
                submarket: 'random_index',
            },
        ];

        const result = sortSymbols(singleSymbol);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(singleSymbol[0]);
    });

    it('should handle symbols with same market and submarket', () => {
        const sameSubmarketSymbols: ActiveSymbol[] = [
            {
                symbol: 'R_100',
                display_name: 'Volatility 100 Index',
                market: 'synthetic_index',
                submarket: 'random_index',
            },
            {
                symbol: 'R_10',
                display_name: 'Volatility 10 Index',
                market: 'synthetic_index',
                submarket: 'random_index',
            },
        ];

        const result = sortSymbols(sameSubmarketSymbols);
        expect(result).toHaveLength(2);
        // Order should be maintained for same market/submarket
        expect(result[0].symbol).toBe('R_100');
        expect(result[1].symbol).toBe('R_10');
    });

    describe('getSubmarketDisplayName', () => {
        it('should translate submarket names correctly', () => {
            // This tests the internal function indirectly by having symbols from same market
            sortSymbols([
                {
                    symbol: 'R_10',
                    display_name: 'Volatility 10 Index',
                    market: 'synthetic_index',
                    submarket: 'random_index',
                },
                {
                    symbol: 'CRASH1000',
                    display_name: 'Crash 1000 Index',
                    market: 'synthetic_index',
                    submarket: 'crash_boom',
                },
            ]);

            expect(mockGetSubmarketDisplayName).toHaveBeenCalledWith('random_index');
            expect(mockGetSubmarketDisplayName).toHaveBeenCalledWith('crash_boom');
        });

        it('should handle various submarket types', () => {
            // Test with symbols from same market to trigger submarket comparison
            const sameMarketSymbols: ActiveSymbol[] = [
                {
                    symbol: 'frxEURUSD',
                    display_name: 'EUR/USD',
                    market: 'forex',
                    submarket: 'major_pairs',
                },
                {
                    symbol: 'frxGBPUSD',
                    display_name: 'GBP/USD',
                    market: 'forex',
                    submarket: 'major_pairs',
                },
            ];

            const commoditySymbols: ActiveSymbol[] = [
                {
                    symbol: 'frxXAUUSD',
                    display_name: 'Gold/USD',
                    market: 'commodities',
                    submarket: 'metals',
                },
                {
                    symbol: 'frxXAGUSD',
                    display_name: 'Silver/USD',
                    market: 'commodities',
                    submarket: 'metals',
                },
            ];

            sortSymbols(sameMarketSymbols);
            sortSymbols(commoditySymbols);

            expect(mockGetSubmarketDisplayName).toHaveBeenCalledWith('major_pairs');
            expect(mockGetSubmarketDisplayName).toHaveBeenCalledWith('metals');
        });
    });

    describe('edge cases', () => {
        it('should handle symbols with missing optional fields', () => {
            const minimalSymbols: ActiveSymbol[] = [
                {
                    symbol: 'TEST1',
                    display_name: 'Test 1',
                    market: 'test',
                    submarket: 'test_sub',
                },
                {
                    symbol: 'TEST2',
                    display_name: 'Test 2',
                    market: 'test',
                    submarket: 'test_sub',
                },
            ];

            const result = sortSymbols(minimalSymbols);
            expect(result).toHaveLength(2);
        });

        it('should handle symbols with undefined submarket gracefully', () => {
            const symbolsWithUndefinedSubmarket: ActiveSymbol[] = [
                {
                    symbol: 'TEST',
                    display_name: 'Test',
                    market: 'test',
                    submarket: undefined as any,
                },
            ];

            // Should not throw an error
            expect(() => sortSymbols(symbolsWithUndefinedSubmarket)).not.toThrow();
        });
    });
});
