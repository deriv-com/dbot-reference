/* eslint-disable no-confusing-arrow */
import { MARKET_OPTIONS, SUBMARKET_OPTIONS, SYMBOL_OPTIONS } from '../../../../components/shared/utils/common-data';
import { activeSymbolCategorizationService } from '../../../../services/active-symbol-categorization.service';
import { config } from '../../constants/config';
import PendingPromise from '../../utils/pending-promise';
import { api_base } from './api-base';

export default class ActiveSymbols {
    constructor(trading_times) {
        this.active_symbols = [];
        this.disabled_symbols = config().DISABLED_SYMBOLS;
        this.disabled_submarkets = config().DISABLED_SUBMARKETS;
        this.init_promise = new PendingPromise();
        this.is_initialised = false;
        this.has_initialization_error = false;
        this.processed_symbols = {};
        this.trading_times = trading_times;
    }

    clearCache() {
        this.active_symbols = [];
        this.processed_symbols = {};
        this.is_initialised = false;
        this.has_initialization_error = false;
        this.init_promise = new PendingPromise();
    }

    /**
     * Retrieves active symbols from the API with retry logic.
     *
     * @param {boolean} is_forced_update - Force refresh even if already initialized
     * @returns {Promise<Array>} Array of active symbol objects
     *
     * @important Callers MUST check `this.has_initialization_error` after calling this method.
     * If true, the returned array may be empty due to API failure, and UI should display
     * an appropriate error message to the user instead of showing empty dropdowns.
     *
     * @example
     * await activeSymbols.retrieveActiveSymbols();
     * if (activeSymbols.has_initialization_error) {
     *   // Show error message to user
     *   showError('Unable to load trading symbols. Please try again.');
     * }
     */
    async retrieveActiveSymbols(is_forced_update = false) {
        await this.trading_times.initialise();

        if (!is_forced_update && this.is_initialised) {
            await this.init_promise;
            return this.active_symbols;
        }

        // Wait for api_base to have symbols available
        if (api_base.has_active_symbols) {
            this.active_symbols = api_base?.active_symbols ?? [];
        } else {
            // If promise doesn't exist, trigger the fetch
            if (!api_base.active_symbols_promise) {
                api_base.active_symbols_promise = api_base.getActiveSymbols();
            }
            // Wait for the promise and use its resolved value
            const symbols = await api_base.active_symbols_promise;
            this.active_symbols = symbols ?? api_base?.active_symbols ?? [];
        }

        // If still no symbols after waiting, try one more time with a fresh fetch
        if (!this.active_symbols || this.active_symbols.length === 0) {
            console.warn('No symbols found, attempting fresh fetch...');
            try {
                const symbols = await api_base.getActiveSymbols();
                this.active_symbols = symbols ?? [];

                // If still no symbols after retry, mark as error state
                if (!this.active_symbols || this.active_symbols.length === 0) {
                    this.has_initialization_error = true;
                    console.error('Failed to fetch active symbols: No symbols returned after retry');
                }
            } catch (error) {
                console.error('Failed to fetch active symbols:', error);
                this.active_symbols = [];
                this.has_initialization_error = true;
            }
        }

        this.is_initialised = true;
        this.processed_symbols = this.processActiveSymbols();

        this.trading_times.onMarketOpenCloseChanged = changes => {
            Object.keys(changes).forEach(symbol_name => {
                const symbol_obj = this.active_symbols[symbol_name];

                if (symbol_obj) {
                    symbol_obj.exchange_is_open = changes[symbol_name];
                }
            });

            this.changes = changes;
            this.processActiveSymbols();
        };

        this.init_promise.resolve();
        return this.active_symbols;
    }

    processActiveSymbols() {
        if (this.active_symbols.length === 0) {
            return {};
        }

        // Use the centralized service for processing
        return activeSymbolCategorizationService.processActiveSymbols(
            this.active_symbols,
            config().DISABLED_SYMBOLS,
            config().DISABLED_SUBMARKETS
        );
    }

    /**
     * Retrieves all symbols and returns an array of symbol objects consisting of symbol and their linked market + submarket.
     * @returns {Array} Symbols and their submarkets + markets.
     */
    getAllSymbols(should_be_open = false) {
        const all_symbols = [];

        Object.keys(this.processed_symbols).forEach(market_name => {
            if (should_be_open && this.isMarketClosed(market_name)) {
                return;
            }

            const market = this.processed_symbols[market_name];
            const { submarkets } = market;

            Object.keys(submarkets).forEach(submarket_name => {
                const submarket = submarkets[submarket_name];
                const { symbols } = submarket;

                Object.keys(symbols).forEach(symbol_name => {
                    const symbol = symbols[symbol_name];

                    all_symbols.push({
                        market: market_name,
                        market_display: market.display_name,
                        submarket: submarket_name,
                        submarket_display: submarket.display_name,
                        symbol: symbol_name,
                        symbol_display: symbol.display_name,
                    });
                });
            });
        });
        this.getSymbolsForBot();
        return all_symbols;
    }

    /**
     *
     * @returns {Array} Symbols and their submarkets + markets for deriv-bot
     */
    getSymbolsForBot() {
        const { DISABLED } = config().QUICK_STRATEGY;

        // Use the centralized service for generating bot symbols
        return activeSymbolCategorizationService.getSymbolsForBot(
            this.processed_symbols,
            DISABLED.SYMBOLS,
            DISABLED.SUBMARKETS,
            this.isMarketClosed.bind(this)
        );
    }

    getMarketDropdownOptions() {
        // Use the centralized service for market dropdown options
        const market_options = activeSymbolCategorizationService.getMarketDropdownOptions(
            this.processed_symbols,
            this.isMarketClosed.bind(this)
        );

        // Fallback markets if no processed symbols available
        if (market_options.length === 0) {
            return MARKET_OPTIONS;
        }

        const has_closed_markets = market_options.some(market_option => this.isMarketClosed(market_option[1]));

        if (has_closed_markets) {
            const sorted_options = activeSymbolCategorizationService.sortDropdownOptions(
                market_options,
                this.isMarketClosed.bind(this)
            );

            if (this.isMarketClosed('forex')) {
                return sorted_options.sort(a => (a[1] === 'synthetic_index' ? -1 : 1));
            }

            return sorted_options;
        }

        return market_options;
    }

    getSubmarketDropdownOptions(market) {
        // Use the centralized service for submarket dropdown options
        const submarket_options = activeSymbolCategorizationService.getSubmarketDropdownOptions(
            this.processed_symbols,
            market,
            this.isSubmarketClosed.bind(this)
        );

        // Fallback submarkets based on market
        if (submarket_options.length === 0) {
            return SUBMARKET_OPTIONS[market] || [['Default', 'default']];
        }

        return activeSymbolCategorizationService.sortDropdownOptions(
            submarket_options,
            this.isSubmarketClosed.bind(this)
        );
    }

    getSymbolDropdownOptions(submarket) {
        // Use the centralized service for symbol dropdown options
        const symbol_options = activeSymbolCategorizationService.getSymbolDropdownOptions(
            this.processed_symbols,
            submarket,
            this.isSymbolClosed.bind(this)
        );

        // Fallback symbols based on submarket
        if (symbol_options.length === 0) {
            // Return empty array instead of invalid 'DEFAULT' symbol to prevent API errors
            return SYMBOL_OPTIONS[submarket] || [];
        }

        return activeSymbolCategorizationService.sortDropdownOptions(symbol_options, this.isSymbolClosed.bind(this));
    }

    isMarketClosed(market_name) {
        const market = this.processed_symbols[market_name];

        if (!market) {
            return true;
        }

        return Object.keys(market.submarkets).every(submarket_name => this.isSubmarketClosed(submarket_name));
    }

    isSubmarketClosed(submarket_name) {
        const market_name = Object.keys(this.processed_symbols).find(name => {
            const market = this.processed_symbols[name];
            return Object.keys(market.submarkets).includes(submarket_name);
        });

        if (!market_name) {
            return true;
        }

        const market = this.processed_symbols[market_name];
        const submarket = market.submarkets[submarket_name];

        if (!submarket) {
            return true;
        }

        const { symbols } = submarket;
        return Object.keys(symbols).every(symbol_name => this.isSymbolClosed(symbol_name));
    }

    isSymbolClosed(symbol_name) {
        return this.active_symbols.some(active_symbol => {
            const symbol_code = active_symbol.underlying_symbol || active_symbol.symbol;
            return (
                symbol_code === symbol_name && (!active_symbol.exchange_is_open || active_symbol.is_trading_suspended)
            );
        });
    }

    // Removed sortDropdownOptions - now using centralized service
}
