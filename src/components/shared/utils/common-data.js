/**
 * Common Data Utilities
 *
 * This file contains centralized data constants and utility functions
 * to improve maintainability and provide consistent data across components.
 */
// Trading Times Data
export const TRADING_TIMES = {
    // Trading times for major symbols
    SYMBOLS: [
        // Forex - 24/5 markets
        'frxEURUSD',
        'frxGBPUSD',
        'frxUSDJPY',
        'frxAUDUSD',
        'frxUSDCAD',
        'frxUSDCHF',
        'frxNZDUSD',
        'frxEURGBP',
        // Indices - various hours
        'OTC_AS51',
        'OTC_AUS200',
        'OTC_DJI',
        'OTC_SPC',
        'OTC_NDX',
        'OTC_FTSE',
        'OTC_N225',
        'OTC_HSI',
        // Commodities
        'frxXAUUSD',
        'frxXAGUSD',
        'OTC_OIL_USD',
        'OTC_GAS_USD',
        // Volatility Indices - 24/7 (ordered to match dropdown structure)
        '1HZ100V',
        '1HZ10V',
        '1HZ25V',
        '1HZ50V',
        '1HZ75V',
        'R_10',
        'R_100',
        'R_25',
        'R_50',
        'R_75',
        'RDBEAR',
        'RDBULL',
    ],

    /**
     * Symbol Display Name Mappings
     *
     * All keys are normalized to UPPERCASE for O(1) lookup performance.
     * Use generateDisplayName() function for case-insensitive lookups.
     *
     * Organized by category for better maintainability:
     * - Forex pairs (FRX prefix)
     * - Metals/Commodities (XAU, XAG, XPT, XPD)
     * - Stock Indices (OTC prefix)
     * - Energy Commodities
     * - Baskets (WLD prefix)
     * - Volatility Indices (R_, 1HZ prefix)
     * - Daily Reset Indices (RDBEAR, RDBULL)
     * - Step Indices (STPRNG prefix)
     * - Crash/Boom Indices
     * - Jump Indices (JD prefix)
     * - Cryptocurrencies (CRY prefix)
     */
    SYMBOL_DISPLAY_NAMES: {
        // Forex Major Pairs (normalized to uppercase)
        FRXAUDCAD: 'AUD/CAD',
        FRXAUDCHF: 'AUD/CHF',
        FRXAUDJPY: 'AUD/JPY',
        FRXAUDNZD: 'AUD/NZD',
        FRXAUDPLN: 'AUD/PLN',
        FRXAUDUSD: 'AUD/USD',
        FRXBROUSD: 'Oil/USD',
        FRXEURAUD: 'EUR/AUD',
        FRXEURCAD: 'EUR/CAD',
        FRXEURCHF: 'EUR/CHF',
        FRXEURGBP: 'EUR/GBP',
        FRXEURJPY: 'EUR/JPY',
        FRXEURNZD: 'EUR/NZD',
        FRXEURUSD: 'EUR/USD',
        FRXGBPAUD: 'GBP/AUD',
        FRXGBPCAD: 'GBP/CAD',
        FRXGBPCHF: 'GBP/CHF',
        FRXGBPJPY: 'GBP/JPY',
        FRXGBPNOK: 'GBP/NOK',
        FRXGBPNZD: 'GBP/NZD',
        FRXGBPUSD: 'GBP/USD',
        FRXNZDJPY: 'NZD/JPY',
        FRXNZDUSD: 'NZD/USD',
        FRXUSDCAD: 'USD/CAD',
        FRXUSDCHF: 'USD/CHF',
        FRXUSDJPY: 'USD/JPY',
        FRXUSDMXN: 'USD/MXN',
        FRXUSDNOK: 'USD/NOK',
        FRXUSDPLN: 'USD/PLN',
        FRXUSDSEK: 'USD/SEK',

        // Metals/Commodities (all variations normalized to uppercase)
        FRXXAGUSD: 'Silver/USD',
        FRXXAUUSD: 'Gold/USD',
        FRXXPDUSD: 'Palladium/USD',
        FRXXPTUSD: 'Platinum/USD',
        XAGUSD: 'Silver/USD',
        XAUUSD: 'Gold/USD',
        XPDUSD: 'Palladium/USD',
        XPTUSD: 'Platinum/USD',
        'XAG/USD': 'Silver/USD',
        'XAU/USD': 'Gold/USD',
        'XPD/USD': 'Palladium/USD',
        'XPT/USD': 'Platinum/USD',

        // Stock Indices
        OTC_AEX: 'Netherlands 25',
        OTC_AS51: 'Australia 200',
        OTC_AUS200: 'Australia 200',
        OTC_DJI: 'Wall Street 30',
        OTC_FCHI: 'France 40',
        OTC_FTSE: 'UK 100',
        OTC_GDAXI: 'Germany 40',
        OTC_HSI: 'Hong Kong 50',
        OTC_IBEX35: 'Spain 35',
        OTC_N225: 'Japan 225',
        OTC_NDX: 'US Tech 100',
        OTC_SPC: 'US 500',
        OTC_SPX500: 'US 500',
        OTC_SSMI: 'Swiss 20',
        OTC_SX5E: 'Euro 50',

        // Energy Commodities
        OTC_OIL_USD: 'Oil/USD',
        OTC_GAS_USD: 'Gas/USD',

        // Baskets
        WLDAUD: 'AUD Basket',
        WLDEUR: 'EUR Basket',
        WLDGBP: 'GBP Basket',
        WLDUSD: 'USD Basket',
        WLDXAU: 'Gold Basket',

        // Volatility Indices
        R_10: 'Volatility 10 Index',
        R_25: 'Volatility 25 Index',
        R_50: 'Volatility 50 Index',
        R_75: 'Volatility 75 Index',
        R_100: 'Volatility 100 Index',
        '1HZ10V': 'Volatility 10 (1s) Index',
        '1HZ15V': 'Volatility 15 (1s) Index',
        '1HZ25V': 'Volatility 25 (1s) Index',
        '1HZ30V': 'Volatility 30 (1s) Index',
        '1HZ50V': 'Volatility 50 (1s) Index',
        '1HZ75V': 'Volatility 75 (1s) Index',
        '1HZ90V': 'Volatility 90 (1s) Index',
        '1HZ100V': 'Volatility 100 (1s) Index',
        '1HZ150V': 'Volatility 150 (1s) Index',
        '1HZ200V': 'Volatility 200 (1s) Index',
        '1HZ250V': 'Volatility 250 (1s) Index',
        '1HZ300V': 'Volatility 300 (1s) Index',

        // Daily Reset Indices
        RDBEAR: 'Bear Market Index',
        RDBULL: 'Bull Market Index',

        // Step Indices (normalized to uppercase)
        STPRNG: 'Step Index 100',
        STPRNG1: 'Step Index 100',
        STPRNG2: 'Step Index 200',
        STPRNG3: 'Step Index 300',
        STPRNG4: 'Step Index 400',
        STPRNG5: 'Step Index 500',

        // Crash/Boom Indices
        BOOM300N: 'Boom 300 Index',
        BOOM500: 'Boom 500 Index',
        BOOM1000: 'Boom 1000 Index',
        CRASH300N: 'Crash 300 Index',
        CRASH500: 'Crash 500 Index',
        CRASH1000: 'Crash 1000 Index',

        // Jump Indices
        JD10: 'Jump 10 Index',
        JD25: 'Jump 25 Index',
        JD50: 'Jump 50 Index',
        JD75: 'Jump 75 Index',
        JD100: 'Jump 100 Index',
        JD150: 'Jump 150 Index',
        JD200: 'Jump 200 Index',

        // Cryptocurrencies
        CRYBCHUSD: 'BCH/USD',
        CRYBNBUSD: 'BNB/USD',
        CRYBTCLTC: 'BTC/LTC',
        CRYIOTUSD: 'IOT/USD',
        CRYNEOUSD: 'NEO/USD',
        CRYOMGUSD: 'OMG/USD',
        CRYTRXUSD: 'TRX/USD',
        CRYBTCETH: 'BTC/ETH',
        CRYZECUSD: 'ZEC/USD',
        CRYXMRUSD: 'ZMR/USD',
        CRYXMLUSD: 'XLM/USD',
        CRYXRPUSD: 'XRP/USD',
        CRYBTCUSD: 'BTC/USD',
        CRYDSHUSD: 'DSH/USD',
        CRYETHUSD: 'ETH/USD',
        CRYEOSUSD: 'EOS/USD',
        CRYLTCUSD: 'LTC/USD',
    },
};

// DEPRECATED: Use ActiveSymbolCategorizationService instead
// These functions are kept for backward compatibility but delegate to the centralized service
import { activeSymbolCategorizationService } from '../../../services/active-symbol-categorization.service';

/**
 * @deprecated Use activeSymbolCategorizationService.getMarketDisplayName() instead
 */
export const getMarketDisplayName = market => {
    return activeSymbolCategorizationService.getMarketDisplayName(market);
};

/**
 * @deprecated Use activeSymbolCategorizationService.getSubgroupDisplayName() instead
 */
export const getSubgroupDisplayName = (subgroup, market) => {
    return activeSymbolCategorizationService.getSubgroupDisplayName(subgroup, market);
};

/**
 * @deprecated Use activeSymbolCategorizationService.getSubmarketDisplayName() instead
 */
export const getSubmarketDisplayName = submarket => {
    return activeSymbolCategorizationService.getSubmarketDisplayName(submarket);
};

// Market and Submarket Mappings - following specification
export const MARKET_MAPPINGS = {
    MARKET_DISPLAY_NAMES: new Map([
        // Keep in English according to specification
        ['synthetic_index', 'Derived'],
        ['forex', 'Forex'],
        ['basket_index', 'Baskets'],
        ['random_index', 'Derived'],
        ['stocks', 'Stocks'],

        // Translate according to specification
        ['indices', 'Stock Indices'],
        ['commodities', 'Commodities'],
        ['cryptocurrency', 'Cryptocurrencies'],
    ]),

    SUBMARKET_DISPLAY_NAMES: new Map([
        // Keep in English according to specification
        ['smart_fx', 'Smart FX'],
        ['energy', 'Energy'],
        ['otc_index', 'OTC Indices'],
        ['otc_indices', 'OTC Indices'],
        ['forex_basket', 'Forex Basket'],
        ['commodity_basket', 'Commodities Basket'],
        ['basket_forex', 'Forex Basket'],
        ['basket_commodities', 'Commodities Basket'],
        ['basket_cryptocurrency', 'Cryptocurrency Basket'],
        ['micro_pairs', 'Micro Pairs'],
        ['stable_coin', 'Stable Coins'],
        ['crypto_index', 'Crypto Index'],

        // Translate according to specification - only translate "indices" word
        ['random_index', 'Continuous Indices'], // This will be handled by the service
        ['random_daily', 'Daily Reset Indices'], // This will be handled by the service
        ['crash_index', 'Crash/Boom Indices'], // This will be handled by the service
        ['jump_index', 'Jump Indices'], // This will be handled by the service
        ['step_index', 'Step Indices'], // This will be handled by the service
        ['range_break', 'Range Break Indices'], // This will be handled by the service
        ['major_pairs', 'Major Pairs'],
        ['minor_pairs', 'Minor Pairs'],
        ['metals', 'Metals'],
        ['non_stable_coin', 'Cryptocurrencies'],
        ['asian_indices', 'Asian indices'], // This will be handled by the service
        ['american_indices', 'American indices'], // This will be handled by the service
        ['european_indices', 'European indices'], // This will be handled by the service
        ['europe_OTC', 'European indices'], // This will be handled by the service
        ['asia_oceania_OTC', 'Asian indices'], // This will be handled by the service
        ['americas_OTC', 'American indices'], // This will be handled by the service
        ['european_OTC', 'European indices'], // This will be handled by the service
        ['asia_OTC', 'Asian indices'], // This will be handled by the service
        ['american_OTC', 'American indices'], // This will be handled by the service
        ['us_indices', 'US Indices'],
        ['stock_indices', 'Stock Indices'],
        ['indices', 'Indices'],
    ]),
};

// Market Dropdown Options
export const MARKET_OPTIONS = [
    ['Derived', 'synthetic_index'],
    ['Forex', 'forex'],
    ['Stock Indices', 'indices'],
    ['Commodities', 'commodities'],
    ['Cryptocurrencies', 'cryptocurrency'],
];

// Submarket Options by Market
export const SUBMARKET_OPTIONS = {
    synthetic_index: [
        ['Continuous Indices', 'random_index'], // Display names handled by service
        ['Daily Reset Indices', 'random_daily'], // Display names handled by service
        ['Crash/Boom', 'crash_index'], // Display names handled by service
        ['Jump Indices', 'jump_index'], // Display names handled by service
        ['Step Indices', 'step_index'], // Display names handled by service
    ],
    forex: [
        ['Major Pairs', 'major_pairs'],
        ['Minor Pairs', 'minor_pairs'],
        ['Exotic Pairs', 'exotic_pairs'],
        ['Smart FX', 'smart_fx'],
    ],
    indices: [
        ['Asian Indices', 'asian_indices'], // Display names handled by service
        ['American Indices', 'american_indices'], // Display names handled by service
        ['European Indices', 'european_indices'], // Display names handled by service
        ['OTC Indices', 'otc_index'], // Display names handled by service
    ],
    commodities: [
        ['Metals', 'metals'],
        ['Energy', 'energy'],
    ],
    cryptocurrency: [
        ['Crypto Index', 'crypto_index'],
        ['Non-Stable Coins', 'non_stable_coin'],
        ['Stable Coins', 'stable_coin'],
    ],
};

// Symbol Options by Submarket
export const SYMBOL_OPTIONS = {
    random_index: [
        ['Volatility 100 (1s) Index', '1HZ100V'],
        ['Volatility 10 (1s) Index', '1HZ10V'],
        ['Volatility 25 (1s) Index', '1HZ25V'],
        ['Volatility 50 (1s) Index', '1HZ50V'],
        ['Volatility 75 (1s) Index', '1HZ75V'],
        ['Volatility 10 Index', 'R_10'],
        ['Volatility 100 Index', 'R_100'],
        ['Volatility 25 Index', 'R_25'],
        ['Volatility 50 Index', 'R_50'],
        ['Volatility 75 Index', 'R_75'],
    ],
    major_pairs: [
        ['EUR/USD', 'frxEURUSD'],
        ['GBP/USD', 'frxGBPUSD'],
        ['USD/JPY', 'frxUSDJPY'],
        ['USD/CHF', 'frxUSDCHF'],
        ['AUD/USD', 'frxAUDUSD'],
    ],
    crash_index: [
        ['Crash 300 Index', 'CRASH300'],
        ['Crash 500 Index', 'CRASH500'],
        ['Crash 1000 Index', 'CRASH1000'],
        ['Boom 300 Index', 'BOOM300'],
        ['Boom 500 Index', 'BOOM500'],
        ['Boom 1000 Index', 'BOOM1000'],
    ],
    otc_index: [
        ['Wall Street 30', 'OTC_DJI'],
        ['US 500', 'OTC_SPC'],
        ['US Tech 100', 'OTC_NDX'],
        ['UK 100', 'OTC_FTSE'],
        ['Germany 40', 'OTC_GDAXI'],
        ['Euro 50', 'OTC_SX5E'],
        ['Australia 200', 'OTC_AS51'],
        ['Japan 225', 'OTC_N225'],
    ],
    american_indices: [
        ['Wall Street 30', 'OTC_DJI'],
        ['US 500', 'OTC_SPC'],
        ['US Tech 100', 'OTC_NDX'],
    ],
    european_indices: [
        ['UK 100', 'OTC_FTSE'],
        ['Germany 40', 'OTC_GDAXI'],
        ['Euro 50', 'OTC_SX5E'],
    ],
    asian_indices: [
        ['Australia 200', 'OTC_AS51'],
        ['Japan 225', 'OTC_N225'],
    ],
    metals: [
        ['Gold/USD', 'frxXAUUSD'],
        ['Silver/USD', 'frxXAGUSD'],
        ['Palladium/USD', 'FRXXPDUSD'],
        ['Platinum/USD', 'FRXXPTUSD'],
        ['Gold Basket', 'WLDXAU'],
    ],
};

// Account Limits Data
export const ACCOUNT_LIMITS = {
    commodities: {
        AUD: { max_payout: 77000, min_stake: 0.8 },
        BTC: { max_payout: 0.440255, min_stake: 0.000005 },
        ETH: { max_payout: 11, min_stake: 0.000117 },
        EUR: { max_payout: 42000, min_stake: 0.5 },
        GBP: { max_payout: 37000, min_stake: 0.4 },
        LTC: { max_payout: 430, min_stake: 0.004327 },
        USD: { max_payout: 50000, min_stake: 0.5 },
        USDC: { max_payout: 5000, min_stake: 0.6 },
        XRP: { max_payout: 17000, min_stake: 0.1723 },
        eUSDT: { max_payout: 4900, min_stake: 0.5 },
        tUSDT: { max_payout: 4900, min_stake: 0.5 },
    },
    cryptocurrency: {
        AUD: { max_payout: 77000, min_stake: 0.8 },
        BTC: { max_payout: 0.440255, min_stake: 0.000005 },
        ETH: { max_payout: 11, min_stake: 0.000117 },
        EUR: { max_payout: 42000, min_stake: 0.5 },
        GBP: { max_payout: 37000, min_stake: 0.4 },
        LTC: { max_payout: 430, min_stake: 0.004327 },
        USD: { max_payout: 50000, min_stake: 0.5 },
        USDC: { max_payout: 5000, min_stake: 0.6 },
        XRP: { max_payout: 17000, min_stake: 0.1723 },
        eUSDT: { max_payout: 4900, min_stake: 0.5 },
        tUSDT: { max_payout: 4900, min_stake: 0.5 },
    },
    forex: {
        AUD: { max_payout: 77000, min_stake: 0.8 },
        BTC: { max_payout: 0.440255, min_stake: 0.000005 },
        ETH: { max_payout: 11, min_stake: 0.000117 },
        EUR: { max_payout: 42000, min_stake: 0.5 },
        GBP: { max_payout: 37000, min_stake: 0.4 },
        LTC: { max_payout: 430, min_stake: 0.004327 },
        USD: { max_payout: 50000, min_stake: 0.5 },
        USDC: { max_payout: 5000, min_stake: 0.6 },
        XRP: { max_payout: 17000, min_stake: 0.1723 },
        eUSDT: { max_payout: 4900, min_stake: 0.5 },
        tUSDT: { max_payout: 4900, min_stake: 0.5 },
    },
    indices: {
        AUD: { max_payout: 77000, min_stake: 0.8 },
        BTC: { max_payout: 0.440255, min_stake: 0.000005 },
        ETH: { max_payout: 11, min_stake: 0.000117 },
        EUR: { max_payout: 42000, min_stake: 0.5 },
        GBP: { max_payout: 37000, min_stake: 0.4 },
        LTC: { max_payout: 430, min_stake: 0.004327 },
        USD: { max_payout: 50000, min_stake: 0.5 },
        USDC: { max_payout: 5000, min_stake: 0.6 },
        XRP: { max_payout: 17000, min_stake: 0.1723 },
        eUSDT: { max_payout: 4900, min_stake: 0.5 },
        tUSDT: { max_payout: 4900, min_stake: 0.5 },
    },
    synthetic_index: {
        AUD: { max_payout: 77000, min_stake: 0.6 },
        BTC: { max_payout: 0.440255, min_stake: 0.000004 },
        ETH: { max_payout: 11, min_stake: 0.000082 },
        EUR: { max_payout: 42000, min_stake: 0.4 },
        GBP: { max_payout: 37000, min_stake: 0.3 },
        LTC: { max_payout: 430, min_stake: 0.003029 },
        USD: { max_payout: 50000, min_stake: 0.35 },
        USDC: { max_payout: 5000, min_stake: 0.4 },
        XRP: { max_payout: 17000, min_stake: 0.1206 },
        eUSDT: { max_payout: 4900, min_stake: 0.4 },
        tUSDT: { max_payout: 4900, min_stake: 0.4 },
    },
};

// Contract Types Data
export const CONTRACT_TYPES = {
    // Contract options based on common trade types
    callput: [
        ['Rise', 'CALL'],
        ['Fall', 'PUT'],
    ],
    callputequal: [
        ['Rise Equals', 'CALLE'],
        ['Fall Equals', 'PUTE'],
    ],
    higherlower: [
        ['Higher', 'CALL'],
        ['Lower', 'PUT'],
    ],
    touchnotouch: [
        ['Touch', 'ONETOUCH'],
        ['No Touch', 'NOTOUCH'],
    ],
    endsinout: [
        ['Ends Between', 'EXPIRYRANGE'],
        ['Ends Outside', 'EXPIRYMISS'],
    ],
    staysinout: [
        ['Stays Between', 'RANGE'],
        ['Goes Outside', 'UPORDOWN'],
    ],
    matchesdiffers: [
        ['Matches', 'DIGITMATCH'],
        ['Differs', 'DIGITDIFF'],
    ],
    evenodd: [
        ['Even', 'DIGITEVEN'],
        ['Odd', 'DIGITODD'],
    ],
    overunder: [
        ['Over', 'DIGITOVER'],
        ['Under', 'DIGITUNDER'],
    ],
    multiplier: [
        ['Up', 'MULTUP'],
        ['Down', 'MULTDOWN'],
    ],
    accumulator: [['Buy', 'ACCU']],
    asians: [
        ['Asian Up', 'ASIANU'],
        ['Asian Down', 'ASIAND'],
    ],
    reset: [
        ['Reset Call', 'RESETCALL'],
        ['Reset Put', 'RESETPUT'],
    ],
    highlowticks: [
        ['High Tick', 'TICKHIGH'],
        ['Low Tick', 'TICKLOW'],
    ],
    runs: [
        ['Only Ups', 'RUNHIGH'],
        ['Only Downs', 'RUNLOW'],
    ],
    callputspread: [
        ['Call Spread', 'CALLSPREAD'],
        ['Put Spread', 'PUTSPREAD'],
    ],

    // Default fallback when no trade type matches
    DEFAULT_FALLBACK: [
        ['Rise', 'CALL'],
        ['Fall', 'PUT'],
        ['Rise Equals', 'CALLE'],
        ['Fall Equals', 'PUTE'],
        ['Higher', 'CALLSPREAD'],
        ['Lower', 'PUTSPREAD'],
    ],
};

// Duration Options
export const DURATIONS = [
    { display: 'Ticks', unit: 't', min: 1, max: 10 },
    { display: 'Seconds', unit: 's', min: 15, max: 3600 },
    { display: 'Minutes', unit: 'm', min: 1, max: 1440 },
    { display: 'Hours', unit: 'h', min: 1, max: 24 },
    { display: 'Days', unit: 'd', min: 1, max: 365 },
];

// Trade Type Categories
export const TRADE_TYPE_CATEGORIES = [
    ['Up/Down', 'callput'],
    ['Touch/No Touch', 'touchnotouch'],
    ['In/Out', 'inout'],
    ['Digits', 'digits'],
    ['Multipliers', 'multiplier'],
];

// Trade Types by Category
export const TRADE_TYPES = {
    callput: [
        ['Rise/Fall', 'callput'],
        ['Rise Equals/Fall Equals', 'callputequal'],
        ['Higher/Lower', 'higherlower'],
    ],
    touchnotouch: [['Touch/No Touch', 'touchnotouch']],
    inout: [
        ['Ends Between/Ends Outside', 'endsinout'],
        ['Stays Between/Goes Outside', 'staysinout'],
    ],
    digits: [
        ['Matches/Differs', 'matchesdiffers'],
        ['Even/Odd', 'evenodd'],
        ['Over/Under', 'overunder'],
    ],
    multiplier: [['Up/Down', 'multiplier']],
    asian: [['Asian Up/Asian Down', 'asians']],
    reset: [['Reset Call/Reset Put', 'reset']],
    highlowticks: [['High Tick/Low Tick', 'highlowticks']],
    runs: [['Only Ups/Only Downs', 'runs']],
};

// Chart Type and Interval Configurations
export const TRADE_URL_PARAMS_CONFIG = {
    chartType: [
        { text: 'area', value: 'line' },
        { text: 'candle', value: 'candles' },
        { text: 'hollow', value: 'hollow' },
        { text: 'ohlc', value: 'ohlc' },
    ],
    interval: [
        { text: '1t', value: '0' },
        { text: '1m', value: '60' },
        { text: '2m', value: '120' },
        { text: '3m', value: '180' },
        { text: '5m', value: '300' },
        { text: '10m', value: '600' },
        { text: '15m', value: '900' },
        { text: '30m', value: '1800' },
        { text: '1h', value: '3600' },
        { text: '2h', value: '7200' },
        { text: '4h', value: '14400' },
        { text: '8h', value: '28800' },
        { text: '1d', value: '86400' },
    ],
};

// Shared constants for pattern matching
const METALS_MAP = new Map([
    ['XAU', 'Gold'],
    ['XAG', 'Silver'],
    ['XPT', 'Platinum'],
    ['XPD', 'Palladium'],
]);

// Symbol Pattern Mappings for Display Names
export const SYMBOL_PATTERNS = new Map([
    // Step indices
    [/^STPRNG$/i, () => 'Step 100 Index'],
    [/^STPRNG(\d+)$/i, match => `Step ${match[1]}00 Index`],
    [/^stpRNG$/i, () => 'Step 100 Index'],
    [/^stpRNG(\d+)$/i, match => `Step ${match[1]}00 Index`],

    // Volatility indices
    [/^R_(\d+)$/i, match => `Volatility ${match[1]} Index`],
    [/^(\d+)HZ(\d+)V$/i, match => `Volatility ${match[2]} (${match[1]}s) Index`],

    // Crash/Boom indices
    [/^CRASH(\d+)N?$/i, match => `Crash ${match[1]} Index`],
    [/^BOOM(\d+)N?$/i, match => `Boom ${match[1]} Index`],

    // Jump indices
    [/^JD(\d+)$/i, match => `Jump ${match[1]} Index`],
    [/^JMP(\d+)$/i, match => `Jump ${match[1]} Index`],

    // Range Break indices
    [/^RB(\d+)$/i, match => `Range Break ${match[1]} Index`],

    // Bear/Bull indices
    [/^RDBEAR$/i, () => 'Bear Market Index'],
    [/^RDBULL$/i, () => 'Bull Market Index'],

    // Forex pairs
    [/^FRX([A-Z]{3})([A-Z]{3})$/i, match => `${match[1]}/${match[2]}`],
    [/^([A-Z]{3})([A-Z]{3})$/i, match => `${match[1]}/${match[2]}`],

    // Crypto
    [/^CRY([A-Z]+)USD$/i, match => `${match[1]}/USD`],
    [/^CRY([A-Z]{3})([A-Z]{3})$/i, match => `${match[1]}/${match[2]}`],

    // Stock indices
    [
        /^OTC_([A-Z]+)$/i,
        match => {
            const index_names = new Map([
                ['DJI', 'Wall Street 30'],
                ['SPX', 'US 500'],
                ['NDX', 'US Tech 100'],
                ['FTSE', 'UK 100'],
                ['GDAXI', 'Germany 40'],
                ['FCHI', 'France 40'],
                ['N225', 'Japan 225'],
                ['HSI', 'Hong Kong 50'],
                ['AS51', 'Australia 200'],
                ['AEX', 'Netherlands 25'],
                ['SSMI', 'Swiss 20'],
                ['SX5E', 'Euro 50'],
                ['IBEX35', 'Spain 35'],
            ]);
            return index_names.get(match[1]) || `${match[1]} Index`;
        },
    ],

    // Metals - handle multiple input formats
    // Pattern 1: Handles FRXXAUUSD, XAUUSD (with optional FRX prefix)
    [/^(?:FRX)?(XAU|XAG|XPT|XPD)USD$/i, match => `${METALS_MAP.get(match[1].toUpperCase()) || match[1]}/USD`],

    // Pattern 2: Handles XAU/USD format (with slash separator)
    // NOTE: This pattern is technically redundant since 'XAU/USD', 'XAG/USD', etc. are already
    // in SYMBOL_DISPLAY_NAMES (lines 110-113) and will match via direct O(1) lookup first.
    // However, it's kept as a defensive fallback in case symbols arrive in slash format
    // from sources that aren't in the direct mapping (e.g., user input, external APIs).
    [/^(XAU|XAG|XPT|XPD)\/USD$/i, match => `${METALS_MAP.get(match[1].toUpperCase()) || match[1]}/USD`],

    // Basket indices
    [/^WLD([A-Z]{3})$/i, match => `${match[1]} Basket`],
]);

// Utility Functions

/**
 * Get trading times information for a symbol
 *
 * @param {string} symbol - The symbol code to get trading times for
 * @returns {Object} Trading times object with properties:
 *   - is_open_all_day: boolean indicating if market is open 24/7
 *   - is_closed_all_day: boolean indicating if market is closed all day
 *   - times: array of open/close time objects or null
 *   - is_opened: boolean indicating current open status
 */
export const getTradingTimes = symbol => {
    if (symbol.startsWith('R_') || symbol.startsWith('RDB')) {
        // Volatility indices - 24/7
        return {
            is_open_all_day: true,
            is_closed_all_day: false,
            times: null,
            is_opened: true,
        };
    } else if (symbol.startsWith('frx')) {
        // Forex - 24/5 (closed weekends)
        const now = new Date();
        const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        return {
            is_open_all_day: !isWeekend,
            is_closed_all_day: isWeekend,
            times: null,
            is_opened: !isWeekend,
        };
    } else {
        // Indices and commodities - assume open during business hours
        const now = new Date();
        const hour = now.getUTCHours();
        const isBusinessHours = hour >= 6 && hour <= 22; // 6 AM to 10 PM UTC

        return {
            is_open_all_day: false,
            is_closed_all_day: false,
            times: [
                {
                    open: new Date(now.toISOString().substring(0, 11) + '06:00:00Z'),
                    close: new Date(now.toISOString().substring(0, 11) + '22:00:00Z'),
                },
            ],
            is_opened: isBusinessHours,
        };
    }
};

/**
 * Get contract type options based on contract type and trade type
 *
 * @param {string} contract_type - The contract type (e.g., 'CALL', 'PUT', 'both')
 * @param {string} trade_type - The trade type category (e.g., 'callput', 'touchnotouch')
 * @returns {Array<[string, string]>} Array of [display_name, contract_code] tuples
 */
export const getContractTypeOptions = (contract_type, trade_type) => {
    // Handle 'na' or invalid trade types with default options
    if (!trade_type || trade_type === 'na' || trade_type === '') {
        if (contract_type !== 'both') {
            return CONTRACT_TYPES.DEFAULT_FALLBACK.filter(option => option[1] === contract_type);
        }
        return CONTRACT_TYPES.DEFAULT_FALLBACK;
    }

    const options = CONTRACT_TYPES[trade_type.toLowerCase()] || CONTRACT_TYPES['callput'];

    if (contract_type !== 'both') {
        return options.filter(option => option[1] === contract_type);
    }
    return options;
};

/**
 * Generate a display name for a symbol code
 *
 * This function uses a three-tier lookup strategy:
 * 1. Direct O(1) lookup in SYMBOL_DISPLAY_NAMES (all keys are uppercase, input is normalized)
 * 2. Pattern matching for dynamic symbol names (e.g., STPRNG1, R_10, CRASH500)
 * 3. Fallback to formatted symbol code with optional submarket context
 *
 * @param {string} symbol_code - The symbol code to generate a display name for
 * @param {Object} symbol - Optional symbol object with additional metadata
 * @returns {string} The display name for the symbol
 */
export const generateDisplayName = (symbol_code, symbol) => {
    // Handle null/undefined gracefully
    if (!symbol_code) {
        return '';
    }

    // Direct O(1) lookup (case-insensitive via uppercase normalization)
    // All keys in SYMBOL_DISPLAY_NAMES are uppercase, so we normalize input
    const upperSymbolCode = symbol_code.toUpperCase();
    if (TRADING_TIMES.SYMBOL_DISPLAY_NAMES[upperSymbolCode]) {
        return TRADING_TIMES.SYMBOL_DISPLAY_NAMES[upperSymbolCode];
    }

    // Pattern matching for dynamic symbols (e.g., STPRNG1, R_10, CRASH500)
    // Use uppercase for consistency and to avoid case-insensitive regex overhead
    for (const [pattern, generator] of SYMBOL_PATTERNS) {
        const match = upperSymbolCode.match(pattern);
        if (match) {
            return generator(match);
        }
    }

    // Fallback - create a basic display name
    // Convert underscores to spaces and capitalize
    let display_name = symbol_code.replace(/_/g, ' ');
    display_name = display_name.replace(/\b\w/g, l => l.toUpperCase());

    // Add context from submarket if available
    if (symbol?.submarket) {
        const submarket_display = MARKET_MAPPINGS.SUBMARKET_DISPLAY_NAMES.get(symbol.submarket);
        // Check if submarket name is already part of the display name (case-insensitive)
        const displayNameLower = display_name.toLowerCase();
        const submarketLower = submarket_display?.toLowerCase() || '';

        if (submarket_display && !displayNameLower.includes(submarketLower)) {
            display_name = `${display_name} (${submarket_display})`;
        }
    }

    return display_name;
};

/**
 * Get parameter text by value for chart configuration
 *
 * @param {string|number} value - The parameter value to look up
 * @param {string} key - The parameter key ('chartType' or 'interval')
 * @returns {string} The text representation of the parameter value
 */
export const getParamTextByValue = (value, key) => {
    return TRADE_URL_PARAMS_CONFIG[key].find(interval => interval.value === value.toString())?.text ?? '';
};

/**
 * Get symbol display name from active symbols list
 *
 * @param {Array<Object>} active_symbols - Array of active symbol objects
 * @param {string} symbol - The symbol code to find
 * @returns {string} The display name of the symbol or empty string if not found
 */
export const getSymbolDisplayName = (active_symbols = [], symbol) => {
    return (
        active_symbols.find(
            symbol_info =>
                symbol_info.underlying_symbol?.toUpperCase() === symbol.toUpperCase() ||
                symbol_info.symbol?.toUpperCase() === symbol.toUpperCase()
        ) || {
            display_name: '',
        }
    ).display_name;
};

/**
 * Check if a market is currently closed
 *
 * @param {Array<Object>} active_symbols - Array of active symbol objects
 * @param {string} symbol - The symbol code to check
 * @returns {boolean} True if market is closed, false otherwise
 */
export const isMarketClosed = (active_symbols = [], symbol) => {
    if (!active_symbols.length) return false;
    // Handle both old and new field names for backward compatibility
    const getSymbolField = item => item.underlying_symbol || item.symbol;
    return active_symbols.filter(x => getSymbolField(x) === symbol)[0]
        ? !active_symbols.filter(symbol_info => getSymbolField(symbol_info) === symbol)[0].exchange_is_open
        : false;
};

/**
 * Get account limits for a specific currency and market
 *
 * @param {string} currency - The currency code (default: 'USD')
 * @param {string} selected_market - The market type (e.g., 'forex', 'synthetic_index')
 * @returns {Promise<Object>} Promise resolving to limits object with max_payout and min_stake
 */
export const getAccountLimits = (currency = 'USD', selected_market) => {
    // Return the currency config for the selected market
    const currency_config = ACCOUNT_LIMITS[selected_market];
    return Promise.resolve(currency_config ? currency_config[currency] : {});
};
