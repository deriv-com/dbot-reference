/**
 * Unit tests for SmartCharts Champion Adapter
 * Tests the main adapter implementation including transformations and core functionality
 */

import { buildSmartchartsChampionAdapter } from '../index';
import type { TGetQuotesRequest, TServices, TTransport } from '../types';

// Mock transport layer
const mockTransport: TTransport = {
    send: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    unsubscribeAll: jest.fn(),
};

// Mock services layer
const mockServices: TServices = {
    getActiveSymbols: jest.fn(),
    getTradingTimes: jest.fn(),
};

describe('SmartCharts Champion Adapter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('buildSmartchartsChampionAdapter', () => {
        it('should create adapter with transport and services', () => {
            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);

            expect(adapter).toBeDefined();
            expect(adapter.transport).toBe(mockTransport);
            expect(adapter.services).toBe(mockServices);
            expect(adapter.getQuotes).toBeInstanceOf(Function);
            expect(adapter.subscribeQuotes).toBeInstanceOf(Function);
            expect(adapter.unsubscribeQuotes).toBeInstanceOf(Function);
            expect(adapter.getChartData).toBeInstanceOf(Function);
        });

        it('should accept optional config', () => {
            const config = { debug: true, subscriptionTimeout: 5000 };
            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices, config);

            expect(adapter).toBeDefined();
        });
    });

    describe('getQuotes', () => {
        it('should fetch tick data (granularity = 0)', async () => {
            const mockResponse = {
                history: {
                    prices: [100.5, 100.6, 100.7],
                    times: [1609459200, 1609459201, 1609459202],
                },
                echo_req: { ticks_history: 'R_50' },
            };

            (mockTransport.send as jest.Mock).mockResolvedValue(mockResponse);

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const request: TGetQuotesRequest = {
                symbol: 'R_50',
                granularity: 0,
                count: 3,
            };

            const result = await adapter.getQuotes(request);

            expect(mockTransport.send).toHaveBeenCalledWith({
                ticks_history: 'R_50',
                end: 'latest',
                count: 3,
                adjust_start_time: 1,
                style: 'ticks',
            });

            expect(result.quotes).toHaveLength(3);
            expect(result.quotes[0]).toMatchObject({
                Date: '1609459200',
                Close: 100.5,
            });
            expect(result.meta?.symbol).toBe('R_50');
            expect(result.meta?.granularity).toBe(0);
        });

        it('should fetch candle data (granularity > 0)', async () => {
            const mockResponse = {
                candles: [
                    { epoch: 1609459200, open: 100, high: 101, low: 99, close: 100.5 },
                    { epoch: 1609459260, open: 100.5, high: 102, low: 100, close: 101 },
                ],
                echo_req: { ticks_history: 'R_50' },
            };

            (mockTransport.send as jest.Mock).mockResolvedValue(mockResponse);

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const request: TGetQuotesRequest = {
                symbol: 'R_50',
                granularity: 60,
                count: 2,
            };

            const result = await adapter.getQuotes(request);

            expect(mockTransport.send).toHaveBeenCalledWith({
                ticks_history: 'R_50',
                end: 'latest',
                count: 2,
                adjust_start_time: 1,
                style: 'candles',
                granularity: 60,
            });

            expect(result.quotes).toHaveLength(2);
            expect(result.quotes[0]).toMatchObject({
                Date: '1609459200',
                Open: 100,
                High: 101,
                Low: 99,
                Close: 100.5,
            });
        });

        it('should handle start time parameter', async () => {
            (mockTransport.send as jest.Mock).mockResolvedValue({
                candles: [],
                echo_req: { ticks_history: 'R_50' },
            });

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const request: TGetQuotesRequest = {
                symbol: 'R_50',
                granularity: 60,
                start: 1609459200,
            };

            await adapter.getQuotes(request);

            expect(mockTransport.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    start: 1609459200,
                })
            );
            expect(mockTransport.send).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    count: expect.anything(),
                })
            );
        });

        it('should handle errors gracefully', async () => {
            (mockTransport.send as jest.Mock).mockRejectedValue(new Error('Network error'));

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const request: TGetQuotesRequest = {
                symbol: 'R_50',
                granularity: 0,
            };

            const result = await adapter.getQuotes(request);

            expect(result.quotes).toEqual([]);
            expect(result.meta?.symbol).toBe('R_50');
        });
    });

    describe('subscribeQuotes', () => {
        it('should subscribe to tick stream', () => {
            const mockCallback = jest.fn();
            const mockSubscriptionId = 'sub-123';

            (mockTransport.subscribe as jest.Mock).mockReturnValue(mockSubscriptionId);

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const request: TGetQuotesRequest = {
                symbol: 'R_50',
                granularity: 0,
            };

            const unsubscribe = adapter.subscribeQuotes(request, mockCallback);

            expect(mockTransport.subscribe).toHaveBeenCalledWith(
                expect.objectContaining({
                    ticks_history: 'R_50',
                    subscribe: 1,
                    style: 'ticks',
                }),
                expect.any(Function)
            );

            expect(unsubscribe).toBeInstanceOf(Function);
        });

        it('should subscribe to candle stream', () => {
            const mockCallback = jest.fn();
            const mockSubscriptionId = 'sub-456';

            (mockTransport.subscribe as jest.Mock).mockReturnValue(mockSubscriptionId);

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const request: TGetQuotesRequest = {
                symbol: 'R_50',
                granularity: 60,
            };

            adapter.subscribeQuotes(request, mockCallback);

            expect(mockTransport.subscribe).toHaveBeenCalledWith(
                expect.objectContaining({
                    ticks_history: 'R_50',
                    subscribe: 1,
                    style: 'candles',
                    granularity: 60,
                }),
                expect.any(Function)
            );
        });

        it('should handle subscription errors', () => {
            const mockCallback = jest.fn();
            (mockTransport.subscribe as jest.Mock).mockImplementation(() => {
                throw new Error('Subscription failed');
            });

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const request: TGetQuotesRequest = {
                symbol: 'R_50',
                granularity: 0,
            };

            const unsubscribe = adapter.subscribeQuotes(request, mockCallback);

            expect(unsubscribe).toBeInstanceOf(Function);
            expect(unsubscribe()).toBeUndefined();
        });

        it('should allow unsubscribing', () => {
            const mockCallback = jest.fn();
            const mockSubscriptionId = 'sub-789';

            (mockTransport.subscribe as jest.Mock).mockReturnValue(mockSubscriptionId);

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const request: TGetQuotesRequest = {
                symbol: 'R_50',
                granularity: 0,
            };

            const unsubscribe = adapter.subscribeQuotes(request, mockCallback);
            unsubscribe();

            expect(mockTransport.unsubscribe).toHaveBeenCalledWith(mockSubscriptionId);
        });
    });

    describe('unsubscribeQuotes', () => {
        it('should unsubscribe from active subscription', () => {
            const mockCallback = jest.fn();
            const mockSubscriptionId = 'sub-999';

            (mockTransport.subscribe as jest.Mock).mockReturnValue(mockSubscriptionId);

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const request: TGetQuotesRequest = {
                symbol: 'R_50',
                granularity: 0,
            };

            adapter.subscribeQuotes(request, mockCallback);
            adapter.unsubscribeQuotes(request);

            expect(mockTransport.unsubscribe).toHaveBeenCalledWith(mockSubscriptionId);
        });

        it('should handle unsubscribe for non-existent subscription', () => {
            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const request: TGetQuotesRequest = {
                symbol: 'R_50',
                granularity: 0,
            };

            // Should not throw
            expect(() => adapter.unsubscribeQuotes(request)).not.toThrow();
        });
    });

    describe('getChartData', () => {
        it('should fetch active symbols and trading times', async () => {
            const mockActiveSymbols = [
                {
                    symbol: 'R_50',
                    display_name: 'Volatility 50 Index',
                    market: 'synthetic_index',
                    market_display_name: 'Synthetic Indices',
                },
            ];

            const mockTradingTimes = {
                R_50: {
                    open: ['00:00:00'],
                    close: ['23:59:59'],
                },
            };

            (mockServices.getActiveSymbols as jest.Mock).mockResolvedValue(mockActiveSymbols);
            (mockServices.getTradingTimes as jest.Mock).mockResolvedValue(mockTradingTimes);

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const result = await adapter.getChartData();

            expect(mockServices.getActiveSymbols).toHaveBeenCalled();
            expect(mockServices.getTradingTimes).toHaveBeenCalled();

            expect(result.activeSymbols).toBeDefined();
            expect(result.tradingTimes).toBeDefined();
            expect(result.tradingTimes.R_50).toMatchObject({
                isOpen: true,
                openTime: '00:00:00',
                closeTime: '23:59:59',
            });
        });

        it('should handle errors in getChartData', async () => {
            (mockServices.getActiveSymbols as jest.Mock).mockRejectedValue(new Error('API error'));
            (mockServices.getTradingTimes as jest.Mock).mockRejectedValue(new Error('API error'));

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const result = await adapter.getChartData();

            expect(result.activeSymbols).toEqual([]);
            expect(result.tradingTimes).toEqual({});
        });
    });

    describe('Transformations', () => {
        it('should transform active symbols correctly', async () => {
            const mockActiveSymbols = [
                {
                    symbol: 'frxEURUSD',
                    display_name: 'EUR/USD',
                    market: 'forex',
                    market_display_name: 'Forex',
                    submarket: 'major_pairs',
                    submarket_display_name: 'Major Pairs',
                    pip: 0.0001,
                    exchange_is_open: 1,
                },
            ];

            (mockServices.getActiveSymbols as jest.Mock).mockResolvedValue(mockActiveSymbols);
            (mockServices.getTradingTimes as jest.Mock).mockResolvedValue({});

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const result = await adapter.getChartData();

            expect(result.activeSymbols[0]).toMatchObject({
                symbol: 'frxEURUSD',
                display_name: 'EUR/USD',
                market: 'forex',
                pip: 0.0001,
                exchange_is_open: 1,
            });
        });

        it('should transform trading times with open/close arrays', async () => {
            const mockTradingTimes = {
                R_50: {
                    open: ['09:00:00', '13:00:00'],
                    close: ['12:00:00', '17:00:00'],
                },
            };

            (mockServices.getActiveSymbols as jest.Mock).mockResolvedValue([]);
            (mockServices.getTradingTimes as jest.Mock).mockResolvedValue(mockTradingTimes);

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const result = await adapter.getChartData();

            expect(result.tradingTimes.R_50).toMatchObject({
                isOpen: true,
                openTime: '09:00:00',
                closeTime: '12:00:00',
            });
        });

        it('should handle closed markets', async () => {
            const mockTradingTimes = {
                CLOSED_MARKET: {
                    open: ['--'],
                    close: ['--'],
                },
            };

            (mockServices.getActiveSymbols as jest.Mock).mockResolvedValue([]);
            (mockServices.getTradingTimes as jest.Mock).mockResolvedValue(mockTradingTimes);

            const adapter = buildSmartchartsChampionAdapter(mockTransport, mockServices);
            const result = await adapter.getChartData();

            expect(result.tradingTimes.CLOSED_MARKET).toMatchObject({
                isOpen: false,
                openTime: '--',
                closeTime: '--',
            });
        });
    });
});
