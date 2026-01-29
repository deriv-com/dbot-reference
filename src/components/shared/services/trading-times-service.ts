import { api_base } from '../../../external/bot-skeleton/services/api/api-base';
import { activeSymbolCategorizationService } from '../../../services/active-symbol-categorization.service';

// API Response interfaces for trading times
interface TradingTimesApiResponse {
    trading_times?: {
        markets: Array<{
            name: string;
            submarkets?: Array<{
                name: string;
                symbols?: Array<{
                    symbol: string;
                    display_name: string;
                }>;
            }>;
        }>;
    };
    error?: {
        message?: string;
        code?: string;
    };
}

interface CachedTradingTimes {
    markets: Array<{
        name: string;
        submarkets?: Array<{
            name: string;
            symbols?: Array<{
                symbol: string;
                display_name: string;
            }>;
        }>;
    }>;
}

class TradingTimesService {
    private trading_times_cache: CachedTradingTimes | null = null;
    private cache_expiry: number = 0;
    private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
    private readonly FETCH_TIMEOUT_MS = 10000; // 10 seconds

    /**
     * Get trading times data with caching
     * Now relies entirely on API data - no hardcoded fallbacks
     */
    async getTradingTimes(): Promise<CachedTradingTimes> {
        const now = Date.now();

        // Return cached data if still valid
        if (this.trading_times_cache && now < this.cache_expiry && this.trading_times_cache.markets) {
            return this.trading_times_cache;
        }

        try {
            const trading_times = await this.fetchTradingTimes();

            if (!trading_times?.markets || !Array.isArray(trading_times.markets)) {
                throw new Error('Invalid trading times data structure received from API');
            }

            // Translate any API-returned category names
            const translated_trading_times = activeSymbolCategorizationService.translateTradingTimesData(trading_times);

            this.trading_times_cache = translated_trading_times;
            this.cache_expiry = now + this.CACHE_DURATION_MS;

            return translated_trading_times;
        } catch (error) {
            console.error('Failed to fetch trading times:', error);
            throw error;
        }
    }

    /**
     * Fetch trading times from API
     */
    private async fetchTradingTimes(): Promise<CachedTradingTimes> {
        if (!api_base.api) {
            throw new Error('API connection not available for fetching trading times');
        }

        try {
            // Add timeout to prevent hanging
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Trading times fetch timeout')), this.FETCH_TIMEOUT_MS)
            );

            const tradingTimesPromise = api_base.api.send({ trading_times: new Date().toISOString().split('T')[0] });

            const apiResult = await Promise.race([tradingTimesPromise, timeout]);

            const { trading_times, error } = apiResult as TradingTimesApiResponse;

            if (error && Object.keys(error).length > 0) {
                throw new Error(`Trading times API error: ${error.message || 'Unknown error'}`);
            }

            if (!trading_times?.markets || !Array.isArray(trading_times.markets)) {
                throw new Error('Invalid trading times data structure received from API');
            }

            return trading_times;
        } catch (error) {
            console.error('Failed to fetch trading times from API:', error);
            throw error;
        }
    }

    /**
     * Clear cached trading times data
     */
    clearCache(): void {
        this.trading_times_cache = null;
        this.cache_expiry = 0;
    }

    /**
     * Check if cache is valid
     */
    isCacheValid(): boolean {
        return this.trading_times_cache !== null && Date.now() < this.cache_expiry;
    }
}

// Export singleton instance
export const tradingTimesService = new TradingTimesService();
