/**
 * Unit tests for useSmartChartAdaptor hook
 * Tests the React hook that manages the SmartCharts Champion adapter
 */

import { renderHook, waitFor } from '@testing-library/react';

// Mock all dependencies before importing the hook
const mockBuildAdapter = jest.fn();
const mockCreateServices = jest.fn();
const mockCreateTransport = jest.fn();

// Mock with both relative and @ paths
jest.mock('@/adapters/smartcharts-champion', () => ({
    buildSmartchartsChampionAdapter: (...args: any[]) => mockBuildAdapter(...args),
}));

jest.mock('@/adapters/smartcharts-champion/services', () => ({
    createServices: (...args: any[]) => mockCreateServices(...args),
}));

jest.mock('@/adapters/smartcharts-champion/transport', () => ({
    createTransport: (...args: any[]) => mockCreateTransport(...args),
}));

// Mock chart_api with a mutable reference
jest.mock('@/external/bot-skeleton/services/api/chart-api', () => ({
    __esModule: true,
    default: {
        api: null,
        init: jest.fn(),
    },
}));

// Now import the hook and chart_api after mocks are set up
import chart_api from '@/external/bot-skeleton/services/api/chart-api';
import { useSmartChartAdaptor } from '../useSmartChartAdaptor';

describe('useSmartChartAdaptor', () => {
    let mockAdapter: any;
    let mockTransport: any;
    let mockServices: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock transport
        mockTransport = {
            send: jest.fn(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
            unsubscribeAll: jest.fn(),
        };

        // Mock services
        mockServices = {
            getActiveSymbols: jest.fn(),
            getTradingTimes: jest.fn(),
        };

        // Mock adapter
        mockAdapter = {
            transport: mockTransport,
            services: mockServices,
            getQuotes: jest.fn(),
            subscribeQuotes: jest.fn(),
            unsubscribeQuotes: jest.fn(),
            getChartData: jest.fn(),
        };

        // Set up mocks
        mockCreateTransport.mockReturnValue(mockTransport);
        mockCreateServices.mockReturnValue(mockServices);
        mockBuildAdapter.mockReturnValue(mockAdapter);

        // Set up chart_api.api
        chart_api.api = {
            forgetAll: jest.fn(),
        } as any;
    });

    afterEach(() => {
        chart_api.api = null;
    });

    describe('Initialization', () => {
        it('should initialize adapter when chart_api.api is available', async () => {
            const { result } = renderHook(() => useSmartChartAdaptor());

            await waitFor(() => {
                expect(result.current.adapterInitialized).toBe(true);
            });

            expect(mockCreateTransport).toHaveBeenCalled();
            expect(mockCreateServices).toHaveBeenCalled();
            expect(mockBuildAdapter).toHaveBeenCalledWith(
                mockTransport,
                mockServices,
                expect.objectContaining({
                    debug: true,
                    subscriptionTimeout: 30000,
                })
            );
            expect(result.current.adapter).toBe(mockAdapter);
        });

        it('should not initialize if chart_api.api is not available', () => {
            chart_api.api = null;

            const { result } = renderHook(() => useSmartChartAdaptor());

            expect(result.current.adapterInitialized).toBe(false);
            expect(result.current.adapter).toBeNull();
        });

        it('should handle initialization errors', async () => {
            mockBuildAdapter.mockImplementation(() => {
                throw new Error('Initialization failed');
            });

            const { result } = renderHook(() => useSmartChartAdaptor());

            await waitFor(() => {
                expect(result.current.error).toBeDefined();
            });

            expect(result.current.error?.message).toBe('Initialization failed');
            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('Chart Data Loading', () => {
        it('should load chart data after adapter initialization', async () => {
            const mockChartData = {
                activeSymbols: [
                    {
                        symbol: 'R_50',
                        display_name: 'Volatility 50 Index',
                        market: 'synthetic_index',
                    },
                ],
                tradingTimes: {
                    R_50: {
                        isOpen: true,
                        openTime: '00:00:00',
                        closeTime: '23:59:59',
                    },
                },
            };

            mockAdapter.getChartData.mockResolvedValue(mockChartData);

            const { result } = renderHook(() => useSmartChartAdaptor());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(mockAdapter.getChartData).toHaveBeenCalled();
            expect(result.current.chartData.activeSymbols).toEqual(mockChartData.activeSymbols);
            expect(result.current.chartData.tradingTimes).toEqual(mockChartData.tradingTimes);
            expect(result.current.error).toBeNull();
        });

        it('should handle chart data loading errors', async () => {
            jest.useFakeTimers();
            mockAdapter.getChartData.mockRejectedValue(new Error('Failed to load chart data'));

            const { result } = renderHook(() => useSmartChartAdaptor());

            // Fast-forward through all retries (10 retries * 200ms = 2000ms)
            await waitFor(() => {
                expect(result.current.adapterInitialized).toBe(true);
            });

            // Fast-forward through retry delays
            for (let i = 0; i < 10; i++) {
                jest.advanceTimersByTime(200);
                await Promise.resolve(); // Allow promises to resolve
            }

            await waitFor(
                () => {
                    expect(result.current.error).toBeDefined();
                    expect(result.current.error?.message).toBe('Failed to load chart data');
                },
                { timeout: 5000 }
            );

            expect(result.current.chartData.activeSymbols).toEqual([]);
            expect(result.current.chartData.tradingTimes).toEqual({});

            jest.useRealTimers();
        });

        it('should set fallback data on error', async () => {
            mockAdapter.getChartData.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useSmartChartAdaptor());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.chartData).toEqual({
                activeSymbols: [],
                tradingTimes: {},
            });
        });
    });

    describe('getQuotes', () => {
        it('should fetch tick quotes (granularity = 0)', async () => {
            const mockQuotes = {
                quotes: [
                    { Date: '1609459200', Close: 100.5, DT: new Date() },
                    { Date: '1609459201', Close: 100.6, DT: new Date() },
                ],
                meta: { symbol: 'R_50', granularity: 0 },
            };

            mockAdapter.getQuotes.mockResolvedValue(mockQuotes);
            mockAdapter.getChartData.mockResolvedValue({
                activeSymbols: [],
                tradingTimes: {},
            });

            const { result } = renderHook(() => useSmartChartAdaptor());

            await waitFor(() => {
                expect(result.current.adapterInitialized).toBe(true);
            });

            const quotes = await result.current.getQuotes({
                symbol: 'R_50',
                granularity: 0,
                count: 2,
            });

            expect(mockAdapter.getQuotes).toHaveBeenCalledWith({
                symbol: 'R_50',
                granularity: 0,
                count: 2,
                start: undefined,
                end: undefined,
            });

            expect(quotes.history).toBeDefined();
            expect(quotes.history?.prices).toEqual([100.5, 100.6]);
            expect(quotes.history?.times).toEqual([1609459200, 1609459201]);
        });

        it('should fetch candle quotes (granularity > 0)', async () => {
            const mockQuotes = {
                quotes: [
                    {
                        Date: '1609459200',
                        Open: 100,
                        High: 101,
                        Low: 99,
                        Close: 100.5,
                        DT: new Date(),
                    },
                ],
                meta: { symbol: 'R_50', granularity: 60 },
            };

            mockAdapter.getQuotes.mockResolvedValue(mockQuotes);
            mockAdapter.getChartData.mockResolvedValue({
                activeSymbols: [],
                tradingTimes: {},
            });

            const { result } = renderHook(() => useSmartChartAdaptor());

            await waitFor(() => {
                expect(result.current.adapterInitialized).toBe(true);
            });

            const quotes = await result.current.getQuotes({
                symbol: 'R_50',
                granularity: 60,
                count: 1,
            });

            expect(quotes.candles).toBeDefined();
            expect(quotes.candles?.[0]).toMatchObject({
                open: 100,
                high: 101,
                low: 99,
                close: 100.5,
                epoch: 1609459200,
            });
        });

        it('should throw error if adapter not initialized', async () => {
            chart_api.api = null;

            const { result } = renderHook(() => useSmartChartAdaptor());

            await expect(
                result.current.getQuotes({
                    symbol: 'R_50',
                    granularity: 0,
                    count: 100,
                })
            ).rejects.toThrow('Adapter not initialized');
        });
    });

    describe('subscribeQuotes', () => {
        it('should subscribe to quote updates', async () => {
            const mockUnsubscribe = jest.fn();
            mockAdapter.subscribeQuotes.mockReturnValue(mockUnsubscribe);
            mockAdapter.getChartData.mockResolvedValue({
                activeSymbols: [],
                tradingTimes: {},
            });

            const { result } = renderHook(() => useSmartChartAdaptor());

            await waitFor(() => {
                expect(result.current.adapterInitialized).toBe(true);
            });

            const callback = jest.fn();
            const unsubscribe = result.current.subscribeQuotes(
                {
                    symbol: 'R_50',
                    granularity: 0,
                },
                callback
            );

            expect(mockAdapter.subscribeQuotes).toHaveBeenCalledWith(
                {
                    symbol: 'R_50',
                    granularity: 0,
                },
                expect.any(Function)
            );

            expect(unsubscribe).toBeInstanceOf(Function);

            // Test unsubscribe
            unsubscribe();
            expect(mockUnsubscribe).toHaveBeenCalled();
        });

        it('should return no-op function if adapter not initialized', () => {
            chart_api.api = null;

            const { result } = renderHook(() => useSmartChartAdaptor());

            const callback = jest.fn();
            const unsubscribe = result.current.subscribeQuotes(
                {
                    symbol: 'R_50',
                    granularity: 0,
                },
                callback
            );

            expect(unsubscribe).toBeInstanceOf(Function);
            expect(unsubscribe()).toBeUndefined();
        });

        it('should only call callback if component is mounted', async () => {
            const mockUnsubscribe = jest.fn();
            let capturedCallback: any;

            mockAdapter.subscribeQuotes.mockImplementation((req: any, cb: any) => {
                capturedCallback = cb;
                return mockUnsubscribe;
            });

            mockAdapter.getChartData.mockResolvedValue({
                activeSymbols: [],
                tradingTimes: {},
            });

            const { result, unmount } = renderHook(() => useSmartChartAdaptor());

            await waitFor(() => {
                expect(result.current.adapterInitialized).toBe(true);
            });

            const callback = jest.fn();
            result.current.subscribeQuotes(
                {
                    symbol: 'R_50',
                    granularity: 0,
                },
                callback
            );

            // Unmount before callback is triggered
            unmount();

            // Try to trigger callback after unmount
            if (capturedCallback) {
                capturedCallback({ tick: { quote: 100.5 } });
            }

            // Callback should not be called after unmount
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('unsubscribeQuotes', () => {
        it('should unsubscribe with request details', async () => {
            mockAdapter.getChartData.mockResolvedValue({
                activeSymbols: [],
                tradingTimes: {},
            });

            const { result } = renderHook(() => useSmartChartAdaptor());

            await waitFor(() => {
                expect(result.current.adapterInitialized).toBe(true);
            });

            result.current.unsubscribeQuotes({
                symbol: 'R_50',
                granularity: 0,
            });

            expect(mockAdapter.unsubscribeQuotes).toHaveBeenCalledWith({
                symbol: 'R_50',
                granularity: 0,
            });
        });

        it('should unsubscribe all if no request details provided', async () => {
            mockAdapter.getChartData.mockResolvedValue({
                activeSymbols: [],
                tradingTimes: {},
            });

            const { result } = renderHook(() => useSmartChartAdaptor());

            await waitFor(() => {
                expect(result.current.adapterInitialized).toBe(true);
            });

            result.current.unsubscribeQuotes({});

            expect(mockAdapter.transport.unsubscribeAll).toHaveBeenCalledWith('ticks');
        });
    });

    describe('Cleanup', () => {
        it('should cleanup subscriptions on unmount', async () => {
            const mockUnsubscribe1 = jest.fn();
            const mockUnsubscribe2 = jest.fn();

            mockAdapter.subscribeQuotes.mockReturnValueOnce(mockUnsubscribe1).mockReturnValueOnce(mockUnsubscribe2);

            mockAdapter.getChartData.mockResolvedValue({
                activeSymbols: [],
                tradingTimes: {},
            });

            const { result, unmount } = renderHook(() => useSmartChartAdaptor());

            await waitFor(() => {
                expect(result.current.adapterInitialized).toBe(true);
            });

            // Create first subscription
            const wrappedUnsub1 = result.current.subscribeQuotes({ symbol: 'R_50', granularity: 0 }, jest.fn());

            // Create second subscription
            const wrappedUnsub2 = result.current.subscribeQuotes({ symbol: 'R_100', granularity: 60 }, jest.fn());

            // Verify both subscriptions were created
            expect(mockAdapter.subscribeQuotes).toHaveBeenCalledTimes(2);

            // Manually call the wrapped unsubscribe functions to verify they work
            wrappedUnsub1();
            expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);

            wrappedUnsub2();
            expect(mockUnsubscribe2).toHaveBeenCalledTimes(1);

            // Reset the mocks
            mockUnsubscribe1.mockClear();
            mockUnsubscribe2.mockClear();

            // Now test automatic cleanup on unmount
            // Create new subscriptions
            result.current.subscribeQuotes({ symbol: 'R_50', granularity: 0 }, jest.fn());
            result.current.subscribeQuotes({ symbol: 'R_100', granularity: 60 }, jest.fn());

            // Unmount - this will trigger cleanup of all subscriptions
            unmount();

            // Note: The wrapped functions from the first two subscriptions were already called manually,
            // so they removed themselves from the cleanup array. Only the last two subscriptions
            // should be cleaned up automatically.
            // Since we already used mockReturnValueOnce twice, subsequent calls will return undefined
            // Let's just verify the global cleanup methods were called
            expect(chart_api.api?.forgetAll).toHaveBeenCalledWith('ticks');
            expect(mockAdapter.transport.unsubscribeAll).toHaveBeenCalledWith('ticks');
        });

        it('should handle cleanup errors gracefully', async () => {
            const mockUnsubscribe = jest.fn().mockImplementation(() => {
                throw new Error('Cleanup error');
            });

            mockAdapter.subscribeQuotes.mockReturnValue(mockUnsubscribe);
            mockAdapter.getChartData.mockResolvedValue({
                activeSymbols: [],
                tradingTimes: {},
            });

            const { result, unmount } = renderHook(() => useSmartChartAdaptor());

            await waitFor(() => {
                expect(result.current.adapterInitialized).toBe(true);
            });

            result.current.subscribeQuotes({ symbol: 'R_50', granularity: 0 }, jest.fn());

            // Should not throw on unmount
            expect(() => unmount()).not.toThrow();
        });
    });

    describe('Memoization', () => {
        it('should have stable callback references', async () => {
            mockAdapter.getChartData.mockResolvedValue({
                activeSymbols: [],
                tradingTimes: {},
            });

            const { result, rerender } = renderHook(() => useSmartChartAdaptor());

            await waitFor(() => {
                expect(result.current.adapterInitialized).toBe(true);
            });

            const firstGetQuotes = result.current.getQuotes;
            const firstSubscribeQuotes = result.current.subscribeQuotes;
            const firstUnsubscribeQuotes = result.current.unsubscribeQuotes;

            // Rerender without changes
            rerender();

            // Callbacks should maintain same reference (memoized with useCallback)
            expect(result.current.getQuotes).toBe(firstGetQuotes);
            expect(result.current.subscribeQuotes).toBe(firstSubscribeQuotes);
            expect(result.current.unsubscribeQuotes).toBe(firstUnsubscribeQuotes);
        });
    });
});
