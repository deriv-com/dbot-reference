import { tradingTimesService } from '../../components/shared/services/trading-times-service';
import { activeSymbolCategorizationService } from '../active-symbol-categorization.service';
import { ActiveSymbolInput, ActiveSymbolsProcessorService } from '../active-symbols-processor.service';

// Mock external dependencies
jest.mock('../../external/bot-skeleton/services/api/api-base', () => ({
    api_base: {
        api: null,
    },
}));

// Mock dependencies
jest.mock('../../components/shared/services/trading-times-service');
jest.mock('../active-symbol-categorization.service');
jest.mock('../../components/shared/utils/common-data', () => ({
    generateDisplayName: jest.fn(symbolCode => `Generated: ${symbolCode}`),
    MARKET_MAPPINGS: {
        MARKET_DISPLAY_NAMES: new Map([
            ['forex', 'Forex'],
            ['synthetic_index', 'Derived'],
        ]),
        SUBMARKET_DISPLAY_NAMES: new Map([
            ['major_pairs', 'Major Pairs'],
            ['random_index', 'Continuous Indices'],
        ]),
    },
}));

describe('ActiveSymbolsProcessorService', () => {
    let service: ActiveSymbolsProcessorService;
    const mockTradingTimesService = tradingTimesService as jest.Mocked<typeof tradingTimesService>;
    const mockActiveSymbolCategorizationService = activeSymbolCategorizationService as jest.Mocked<
        typeof activeSymbolCategorizationService
    >;

    beforeEach(() => {
        service = ActiveSymbolsProcessorService.getInstance();
        jest.clearAllMocks();
    });

    describe('processPipSizes', () => {
        it('should calculate pip sizes correctly', () => {
            const mockSymbols: ActiveSymbolInput[] = [
                {
                    symbol: 'R_10',
                    underlying_symbol: 'R_10',
                    market: 'synthetic_index',
                    submarket: 'random_index',
                    pip_size: 0.001,
                },
                {
                    symbol: 'frxEURUSD',
                    underlying_symbol: 'frxEURUSD',
                    market: 'forex',
                    submarket: 'major_pairs',
                    pip: 0.0001,
                },
            ];

            const result = service.processPipSizes(mockSymbols);

            expect(result).toEqual({
                R_10: 3, // 0.001 -> 3 (exponent notation)
                frxEURUSD: 4, // 0.0001 -> 4 (exponent notation)
            });
        });

        it('should handle symbols without pip sizes', () => {
            const mockSymbols: ActiveSymbolInput[] = [
                {
                    symbol: 'TEST',
                    market: 'test',
                    submarket: 'test',
                },
            ];

            const result = service.processPipSizes(mockSymbols);
            expect(result).toEqual({});
        });

        it('should handle empty arrays', () => {
            const result = service.processPipSizes([]);
            expect(result).toEqual({});
        });
    });

    describe('enrichActiveSymbolsWithTradingTimes', () => {
        beforeEach(() => {
            mockTradingTimesService.getTradingTimes.mockResolvedValue({
                markets: [
                    {
                        name: 'Forex',
                        submarkets: [
                            {
                                name: 'Major Pairs',
                                symbols: [
                                    {
                                        symbol: 'frxEURUSD',
                                        display_name: 'EUR/USD',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });

            mockActiveSymbolCategorizationService.translateMarketCategory.mockImplementation(name => name);
            mockActiveSymbolCategorizationService.getSubmarketDisplayName.mockImplementation(name => name);
        });

        it('should enrich symbols with trading times data', async () => {
            const mockSymbols: ActiveSymbolInput[] = [
                {
                    symbol: 'frxEURUSD',
                    underlying_symbol: 'frxEURUSD',
                    market: 'forex',
                    submarket: 'major_pairs',
                },
            ];

            const result = await service.enrichActiveSymbolsWithTradingTimes(mockSymbols);

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                symbol: 'frxEURUSD',
                underlying_symbol: 'frxEURUSD',
                display_name: 'EUR/USD',
                market: 'forex',
                submarket: 'major_pairs',
            });
        });

        it('should handle empty symbol arrays', async () => {
            const result = await service.enrichActiveSymbolsWithTradingTimes([]);
            expect(result).toEqual([]);
        });

        it('should handle null/undefined symbols', async () => {
            const result = await service.enrichActiveSymbolsWithTradingTimes(null as any);
            expect(result).toEqual([]);
        });

        it('should handle invalid symbol structures', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const invalidSymbol = 'invalid';

            const result = await service.enrichActiveSymbolsWithTradingTimes([invalidSymbol as any]);

            expect(consoleSpy).toHaveBeenCalledWith('Invalid symbol structure:', invalidSymbol);
            expect(result[0]).toBe(invalidSymbol);
            consoleSpy.mockRestore();
        });

        it('should handle trading times service errors', async () => {
            mockTradingTimesService.getTradingTimes.mockRejectedValue(new Error('API Error'));
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const mockSymbols: ActiveSymbolInput[] = [
                {
                    symbol: 'TEST',
                    market: 'test',
                    submarket: 'test',
                },
            ];

            const result = await service.enrichActiveSymbolsWithTradingTimes(mockSymbols);

            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to create lookup maps from trading times, using fallback mappings:',
                expect.any(Error)
            );
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                symbol: 'TEST',
                underlying_symbol: 'TEST',
                display_name: 'Generated: TEST',
                market_display_name: 'test',
                submarket_display_name: 'test',
            });
            consoleSpy.mockRestore();
        });
    });

    describe('processActiveSymbols', () => {
        beforeEach(() => {
            mockTradingTimesService.getTradingTimes.mockResolvedValue({
                markets: [],
            });
            mockActiveSymbolCategorizationService.translateMarketCategory.mockImplementation(name => name);
            mockActiveSymbolCategorizationService.getSubmarketDisplayName.mockImplementation(name => name);
        });

        it('should process active symbols completely', async () => {
            const mockSymbols: ActiveSymbolInput[] = [
                {
                    symbol: 'R_10',
                    underlying_symbol: 'R_10',
                    market: 'synthetic_index',
                    submarket: 'random_index',
                    pip_size: 0.001,
                },
            ];

            const result = await service.processActiveSymbols(mockSymbols);

            expect(result).toHaveProperty('enrichedSymbols');
            expect(result).toHaveProperty('pipSizes');
            expect(result.enrichedSymbols).toHaveLength(1);
            expect(result.pipSizes).toEqual({ R_10: 3 });
        });

        it('should handle empty arrays', async () => {
            const result = await service.processActiveSymbols([]);

            expect(result).toEqual({
                enrichedSymbols: [],
                pipSizes: {},
            });
        });

        it('should handle null/undefined input', async () => {
            const result = await service.processActiveSymbols(null as any);

            expect(result).toEqual({
                enrichedSymbols: [],
                pipSizes: {},
            });
        });
    });

    describe('error handling paths', () => {
        it('should handle trading times API failures gracefully', async () => {
            mockTradingTimesService.getTradingTimes.mockRejectedValue(new Error('Network error'));
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const mockSymbols: ActiveSymbolInput[] = [
                {
                    symbol: 'TEST',
                    market: 'test',
                    submarket: 'test',
                },
            ];

            // This should not throw but handle the error gracefully
            const result = await service.enrichActiveSymbolsWithTradingTimes(mockSymbols);

            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to create lookup maps from trading times, using fallback mappings:',
                expect.any(Error)
            );
            expect(result).toHaveLength(1);
            consoleSpy.mockRestore();
        });

        it('should handle invalid trading times data structure', async () => {
            mockTradingTimesService.getTradingTimes.mockResolvedValue({
                markets: null as any, // Invalid structure for testing
            });
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const mockSymbols: ActiveSymbolInput[] = [
                {
                    symbol: 'TEST',
                    market: 'test',
                    submarket: 'test',
                },
            ];

            const result = await service.enrichActiveSymbolsWithTradingTimes(mockSymbols);

            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to create lookup maps from trading times, using fallback mappings:',
                expect.any(Error)
            );
            expect(result).toHaveLength(1);
            consoleSpy.mockRestore();
        });

        it('should handle missing symbol fields gracefully', async () => {
            const mockSymbols: ActiveSymbolInput[] = [
                {
                    symbol: 'TEST',
                    market: 'test',
                    submarket: 'test',
                    // Missing underlying_symbol
                },
            ];

            const result = await service.enrichActiveSymbolsWithTradingTimes(mockSymbols);

            expect(result[0]).toMatchObject({
                symbol: 'TEST',
                underlying_symbol: 'TEST', // Should be filled from symbol
                market: 'test',
                submarket: 'test',
            });
        });
    });

    describe('backward compatibility', () => {
        it('should ensure backward compatibility for symbol fields', async () => {
            const mockSymbols: ActiveSymbolInput[] = [
                {
                    symbol: 'TEST',
                    market: 'test',
                    submarket: 'test',
                    symbol_type: 'forex',
                    // Missing underlying_symbol and underlying_symbol_type
                },
            ];

            const result = await service.enrichActiveSymbolsWithTradingTimes(mockSymbols);

            expect(result[0]).toMatchObject({
                symbol: 'TEST',
                underlying_symbol: 'TEST',
                symbol_type: 'forex',
                underlying_symbol_type: 'forex',
            });
        });

        it('should handle symbols with only underlying_symbol', async () => {
            const mockSymbols: ActiveSymbolInput[] = [
                {
                    underlying_symbol: 'TEST',
                    market: 'test',
                    submarket: 'test',
                    // Missing symbol field
                } as any,
            ];

            const result = await service.enrichActiveSymbolsWithTradingTimes(mockSymbols);

            expect(result[0]).toMatchObject({
                symbol: 'TEST',
                underlying_symbol: 'TEST',
            });
        });
    });
});
