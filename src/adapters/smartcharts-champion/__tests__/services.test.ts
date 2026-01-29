/**
 * Unit tests for Services Layer
 * Tests the services wrapper around ApiHelpers
 */

import ApiHelpers from '@/external/bot-skeleton/services/api/api-helpers';
import { createServices } from '../services';

// Mock ApiHelpers
jest.mock('@/external/bot-skeleton/services/api/api-helpers', () => ({
    __esModule: true,
    default: {
        instance: null,
    },
}));

describe('Services Layer', () => {
    let mockApiHelpers: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock ApiHelpers instance
        mockApiHelpers = {
            active_symbols: {
                retrieveActiveSymbols: jest.fn(),
                active_symbols: [],
            },
            trading_times: {
                initialise: jest.fn(),
                trading_times: {},
                setTradingTimes: jest.fn(),
            },
        };

        // Set up ApiHelpers.instance
        (ApiHelpers as any).instance = mockApiHelpers;
    });

    afterEach(() => {
        (ApiHelpers as any).instance = null;
    });

    describe('createServices', () => {
        it('should create services instance', () => {
            const services = createServices();

            expect(services).toBeDefined();
            expect(services.getActiveSymbols).toBeInstanceOf(Function);
            expect(services.getTradingTimes).toBeInstanceOf(Function);
        });
    });

    describe('getActiveSymbols', () => {
        it('should retrieve active symbols', async () => {
            const mockSymbols = [
                {
                    symbol: 'R_50',
                    display_name: 'Volatility 50 Index',
                    market: 'synthetic_index',
                    market_display_name: 'Synthetic Indices',
                    submarket: 'random_index',
                    submarket_display_name: 'Continuous Indices',
                    pip: 0.01,
                },
                {
                    symbol: 'frxEURUSD',
                    display_name: 'EUR/USD',
                    market: 'forex',
                    market_display_name: 'Forex',
                    submarket: 'major_pairs',
                    submarket_display_name: 'Major Pairs',
                    pip: 0.0001,
                },
            ];

            mockApiHelpers.active_symbols.retrieveActiveSymbols.mockResolvedValue(mockSymbols);

            const services = createServices();
            const result = await services.getActiveSymbols();

            expect(mockApiHelpers.active_symbols.retrieveActiveSymbols).toHaveBeenCalled();
            expect(result).toEqual(mockSymbols);
            expect(result).toHaveLength(2);
        });

        it('should handle empty active symbols', async () => {
            mockApiHelpers.active_symbols.retrieveActiveSymbols.mockResolvedValue([]);

            const services = createServices();
            const result = await services.getActiveSymbols();

            expect(result).toEqual([]);
        });

        it('should handle non-array response', async () => {
            mockApiHelpers.active_symbols.retrieveActiveSymbols.mockResolvedValue(null);

            const services = createServices();
            const result = await services.getActiveSymbols();

            expect(result).toEqual([]);
        });

        it('should fallback to active_symbols array on error', async () => {
            const fallbackSymbols = [{ symbol: 'R_50', display_name: 'Volatility 50' }];

            mockApiHelpers.active_symbols.retrieveActiveSymbols.mockRejectedValue(new Error('Retrieval failed'));
            mockApiHelpers.active_symbols.active_symbols = fallbackSymbols;

            const services = createServices();
            const result = await services.getActiveSymbols();

            expect(result).toEqual(fallbackSymbols);
        });

        it('should return empty array if ApiHelpers not initialized', async () => {
            (ApiHelpers as any).instance = null;

            const services = createServices();
            const result = await services.getActiveSymbols();

            expect(result).toEqual([]);
        });

        it('should return empty array if active_symbols not available', async () => {
            (ApiHelpers as any).instance = { trading_times: {} };

            const services = createServices();
            const result = await services.getActiveSymbols();

            expect(result).toEqual([]);
        });
    });

    describe('getTradingTimes', () => {
        it('should retrieve and transform trading times', async () => {
            const mockTradingTimes = {
                R_50: {
                    times: [
                        {
                            open: 1609459200, // Unix timestamp
                            close: 1609545600,
                        },
                    ],
                },
                frxEURUSD: {
                    is_open_all_day: true,
                },
            };

            mockApiHelpers.trading_times.initialise.mockResolvedValue(undefined);
            mockApiHelpers.trading_times.trading_times = mockTradingTimes;

            const services = createServices();
            const result = await services.getTradingTimes();

            expect(mockApiHelpers.trading_times.initialise).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.R_50).toBeDefined();
            expect(result.R_50.open).toHaveLength(1);
            expect(result.R_50.close).toHaveLength(1);
            expect(result.frxEURUSD.open).toEqual(['00:00:00']);
            expect(result.frxEURUSD.close).toEqual(['23:59:59']);
        });

        it('should handle closed markets', async () => {
            const mockTradingTimes = {
                CLOSED_MARKET: {
                    is_closed_all_day: true,
                },
            };

            mockApiHelpers.trading_times.initialise.mockResolvedValue(undefined);
            mockApiHelpers.trading_times.trading_times = mockTradingTimes;

            const services = createServices();
            const result = await services.getTradingTimes();

            expect(result.CLOSED_MARKET.open).toEqual(['--']);
            expect(result.CLOSED_MARKET.close).toEqual(['--']);
        });

        it('should filter out invalid symbol keys', async () => {
            const mockTradingTimes = {
                R_50: { times: [] },
                undefined: { times: [] },
                null: { times: [] },
                '': { times: [] },
                '[object Object]': { times: [] },
            };

            mockApiHelpers.trading_times.initialise.mockResolvedValue(undefined);
            mockApiHelpers.trading_times.trading_times = mockTradingTimes;

            const services = createServices();
            const result = await services.getTradingTimes();

            expect(result.R_50).toBeDefined();
            expect(result.undefined).toBeUndefined();
            expect(result.null).toBeUndefined();
            expect(result['']).toBeUndefined();
            expect(result['[object Object]']).toBeUndefined();
        });

        it('should handle fallback data structure', async () => {
            const mockTradingTimes = {
                R_50: {
                    open: ['09:00:00'],
                    close: ['17:00:00'],
                },
            };

            mockApiHelpers.trading_times.initialise.mockResolvedValue(undefined);
            mockApiHelpers.trading_times.trading_times = mockTradingTimes;

            const services = createServices();
            const result = await services.getTradingTimes();

            expect(result.R_50.open).toEqual(['09:00:00']);
            expect(result.R_50.close).toEqual(['17:00:00']);
        });

        it('should handle Date objects in times', async () => {
            const mockTradingTimes = {
                R_50: {
                    times: [
                        {
                            open: new Date('2021-01-01T09:00:00Z'),
                            close: new Date('2021-01-01T17:00:00Z'),
                        },
                    ],
                },
            };

            mockApiHelpers.trading_times.initialise.mockResolvedValue(undefined);
            mockApiHelpers.trading_times.trading_times = mockTradingTimes;

            const services = createServices();
            const result = await services.getTradingTimes();

            expect(result.R_50.open).toHaveLength(1);
            expect(result.R_50.close).toHaveLength(1);
            expect(result.R_50.open[0]).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        });

        it('should handle string times', async () => {
            const mockTradingTimes = {
                R_50: {
                    times: [
                        {
                            open: '09:00:00',
                            close: '17:00:00',
                        },
                    ],
                },
            };

            mockApiHelpers.trading_times.initialise.mockResolvedValue(undefined);
            mockApiHelpers.trading_times.trading_times = mockTradingTimes;

            const services = createServices();
            const result = await services.getTradingTimes();

            expect(result.R_50.open).toEqual(['09:00:00']);
            expect(result.R_50.close).toEqual(['17:00:00']);
        });

        it('should return empty object if ApiHelpers not available', async () => {
            (ApiHelpers as any).instance = null;

            const services = createServices();
            const result = await services.getTradingTimes();

            expect(result).toEqual({});
        });

        it('should return empty object if trading_times not available', async () => {
            (ApiHelpers as any).instance = { active_symbols: {} };

            const services = createServices();
            const result = await services.getTradingTimes();

            expect(result).toEqual({});
        });

        it('should handle null trading times data', async () => {
            mockApiHelpers.trading_times.initialise.mockResolvedValue(undefined);
            mockApiHelpers.trading_times.trading_times = null;

            const services = createServices();
            const result = await services.getTradingTimes();

            expect(result).toEqual({});
        });

        it('should use fallback if setTradingTimes available', async () => {
            const fallbackData = {
                R_50: {
                    open: ['00:00:00'],
                    close: ['23:59:59'],
                },
            };

            mockApiHelpers.trading_times.initialise.mockResolvedValue(undefined);
            mockApiHelpers.trading_times.trading_times = null;
            mockApiHelpers.trading_times.setTradingTimes.mockImplementation(() => {
                mockApiHelpers.trading_times.trading_times = fallbackData;
            });

            const services = createServices();
            const result = await services.getTradingTimes();

            expect(mockApiHelpers.trading_times.setTradingTimes).toHaveBeenCalled();
            expect(result.R_50).toBeDefined();
        });

        it('should handle errors gracefully', async () => {
            mockApiHelpers.trading_times.initialise.mockRejectedValue(new Error('Init failed'));

            const services = createServices();
            const result = await services.getTradingTimes();

            expect(result).toEqual({});
        });

        it('should handle invalid time sessions', async () => {
            const mockTradingTimes = {
                R_50: {
                    times: [
                        null,
                        { open: null, close: null },
                        { open: 1609459200 }, // Missing close
                    ],
                },
            };

            mockApiHelpers.trading_times.initialise.mockResolvedValue(undefined);
            mockApiHelpers.trading_times.trading_times = mockTradingTimes;

            const services = createServices();
            const result = await services.getTradingTimes();

            // Should handle gracefully without throwing
            expect(result.R_50).toBeDefined();
            expect(result.R_50.open).toBeInstanceOf(Array);
            expect(result.R_50.close).toBeInstanceOf(Array);
        });
    });
});
