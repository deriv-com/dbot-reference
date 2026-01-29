import { config } from '@/external/bot-skeleton/constants/config';

// Mapping from URL parameter values to internal trade type categories
const URL_TO_TRADE_TYPE_MAPPING: Record<string, string> = {
    // Original mappings
    rise_equals_fall_equals: 'callput',
    higher_lower: 'callput',
    touch_no_touch: 'touchnotouch',
    in_out: 'inout',
    digits: 'digits',
    multiplier: 'multiplier',
    accumulator: 'accumulator',
    asian: 'asian',
    reset: 'reset',
    high_low_ticks: 'highlowticks',
    only_ups_downs: 'runs',

    // New mappings from external application identifiers based on your feedback
    match_diff: 'digits', // Matches/Differs -> digits
    even_odd: 'digits', // Even/Odd -> digits
    over_under: 'digits', // Over/Under -> digits
    rise_fall: 'callput', // Rise/Fall -> updown (callput)
    high_low: 'callput', // Higher/Lower -> updown (callput)
    high_tick: 'highlowticks', // High Tick/Low Tick -> first dropdown only
    accumulators: 'accumulator', // Accumulators -> first dropdown only
    only_up_only_down: 'runs', // Only Ups/Only Downs -> first dropdown only
    touch: 'touchnotouch', // Touch/No Touch -> first dropdown only
    multipliers: 'multiplier', // Multipliers -> first dropdown only

    // Additional new trade types
    ends_between_ends_outside: 'inout', // Ends Between/Ends Outside -> inout
    stays_between_goes_outside: 'inout', // Stays Between/Goes Outside -> inout
    asians: 'asian', // Asians -> asian
    reset_call_reset_put: 'reset', // Reset Call/Reset Put -> reset
};

// Mapping from URL parameter values to specific trade types within categories
const URL_TO_SPECIFIC_TRADE_TYPE_MAPPING: Record<string, string> = {
    // Original mappings
    rise_equals_fall_equals: 'callputequal',
    higher_lower: 'higherlower',
    touch_no_touch: 'touchnotouch',
    ends_in_out: 'endsinout',
    stays_in_out: 'staysinout',
    matches_differs: 'matchesdiffers',
    multiplier: 'multiplier',
    accumulator: 'accumulator',
    asian_up_down: 'asians',
    reset_call_put: 'reset',
    high_low_ticks: 'highlowticks',
    only_ups_downs: 'runs',

    // New mappings from external application identifiers based on your feedback
    match_diff: 'matchesdiffers', // Matches/Differs -> digits category
    even_odd: 'evenodd', // Even/Odd -> digits category
    over_under: 'overunder', // Over/Under -> digits category
    rise_fall: 'callput', // Rise/Fall -> updown category
    high_low: 'higherlower', // Higher/Lower -> updown category
    high_tick: 'highlowticks', // High Tick/Low Tick -> first dropdown only
    accumulators: 'accumulator', // Accumulators -> first dropdown only
    only_up_only_down: 'runs', // Only Ups/Only Downs -> first dropdown only
    touch: 'touchnotouch', // Touch/No Touch -> first dropdown only
    multipliers: 'multiplier', // Multipliers -> first dropdown only

    // Additional new trade types
    ends_between_ends_outside: 'endsinout', // Ends Between/Ends Outside -> inout category
    stays_between_goes_outside: 'staysinout', // Stays Between/Goes Outside -> inout category
    asians: 'asians', // Asians -> asian category
    reset_call_reset_put: 'reset', // Reset Call/Reset Put -> reset category
};

/**
 * Interface representing trade type information extracted from URL parameters
 */
export interface TradeTypeFromUrl {
    /** The internal trade type category (e.g., 'digits', 'callput', 'multiplier') */
    tradeTypeCategory: string;
    /** The specific trade type within the category (e.g., 'matchesdiffers', 'callput') */
    tradeType: string;
    /** Whether the trade type is valid and exists in the configuration */
    isValid: boolean;
}

/**
 * Extracts and validates trade type from URL parameters
 * @param urlParam - The trade type parameter from URL (e.g., 'rise_fall', 'higher_lower')
 * @returns Object containing trade type category, specific trade type, and validation status
 */
export const getTradeTypeFromUrlParam = (urlParam: string): TradeTypeFromUrl => {
    if (!urlParam) {
        return {
            tradeTypeCategory: '',
            tradeType: '',
            isValid: false,
        };
    }

    const normalizedParam = urlParam.toLowerCase().trim();
    const tradeTypeCategory = URL_TO_TRADE_TYPE_MAPPING[normalizedParam];
    const tradeType = URL_TO_SPECIFIC_TRADE_TYPE_MAPPING[normalizedParam];

    // Validate against the config to ensure the trade type exists
    const { TRADE_TYPE_CATEGORIES } = config();
    const isValidCategory = Boolean(tradeTypeCategory && tradeTypeCategory in TRADE_TYPE_CATEGORIES);
    const isValidTradeType = Boolean(
        tradeType &&
        isValidCategory &&
        TRADE_TYPE_CATEGORIES[tradeTypeCategory as keyof typeof TRADE_TYPE_CATEGORIES].includes(tradeType)
    );

    return {
        tradeTypeCategory: tradeTypeCategory || '',
        tradeType: tradeType || '',
        isValid: isValidCategory && isValidTradeType,
    };
};

/**
 * Gets trade type from current URL parameters
 * @returns TradeTypeFromUrl object or null if no trade type parameter found
 */
export const getTradeTypeFromCurrentUrl = (): TradeTypeFromUrl | null => {
    if (typeof window === 'undefined') return null;

    const urlParams = new URLSearchParams(window.location.search);
    const tradeTypeParam = urlParams.get('trade_type');

    if (!tradeTypeParam) return null;
    return getTradeTypeFromUrlParam(tradeTypeParam);
};

/**
 * Gets all supported URL trade type parameters
 * @returns Array of supported URL parameter values (e.g., ['multipliers', 'match_diff', 'rise_fall'])
 * @example
 * const supportedTypes = getSupportedUrlTradeTypes();
 * // Returns: ['multipliers', 'match_diff', 'rise_fall', ...]
 */
export const getSupportedUrlTradeTypes = (): string[] => {
    return Object.keys(URL_TO_TRADE_TYPE_MAPPING);
};

/**
 * Validates if a URL trade type parameter is supported
 * @param urlParam - The trade type parameter to validate (case-insensitive)
 * @returns boolean indicating if the parameter is supported
 * @example
 * isValidUrlTradeType('multipliers') // Returns: true
 * isValidUrlTradeType('invalid_type') // Returns: false
 */
export const isValidUrlTradeType = (urlParam: string): boolean => {
    return getSupportedUrlTradeTypes().includes(urlParam.toLowerCase().trim());
};

/**
 * Gets the display name for a trade type category
 * @param tradeTypeCategory - The internal trade type category (e.g., 'multiplier', 'digits')
 * @returns Localized display name or empty string if not found
 * @example
 * getTradeTypeCategoryDisplayName('multiplier') // Returns: 'Multipliers'
 * getTradeTypeCategoryDisplayName('digits') // Returns: 'Digits'
 */
export const getTradeTypeCategoryDisplayName = (tradeTypeCategory: string): string => {
    const { TRADE_TYPE_CATEGORY_NAMES } = config();
    return TRADE_TYPE_CATEGORY_NAMES[tradeTypeCategory as keyof typeof TRADE_TYPE_CATEGORY_NAMES] || '';
};
