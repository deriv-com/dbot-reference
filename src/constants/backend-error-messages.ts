import { localize } from '@deriv-com/translations';
import { sanitizeParameterValue } from '../utils/xss-protection';

/**
 * Converts backend parameter format to frontend format and maps parameters
 * @param message - The backend error message
 * @param errorResponse - The complete error response containing code_args, details, etc.
 * @returns Processed parameters object
 */
const processBackendParameters = (message: string, errorResponse?: Record<string, any>) => {
    if (!errorResponse) return {};

    const params: Record<string, any> = {};

    // Handle new code_args array format
    if (errorResponse.code_args && Array.isArray(errorResponse.code_args)) {
        errorResponse.code_args.forEach((value: any, index: number) => {
            // Clean up parameter values by removing ALL trailing dots to prevent double dots
            let cleanValue = String(value);
            // Remove all trailing dots (not just one)
            cleanValue = cleanValue.replace(/\.+$/, '');
            // Apply XSS protection
            params[`param${index + 1}`] = sanitizeParameterValue(cleanValue);
        });
    }

    // Handle legacy format for backward compatibility
    if (errorResponse.details) {
        const details = errorResponse.details;

        // Handle common parameter mappings from legacy backend error message format
        if (details._1 !== undefined) {
            params.param1 = sanitizeParameterValue(String(details._1).replace(/\.+$/, ''));
        }
        if (details._2 !== undefined) {
            params.param2 = sanitizeParameterValue(String(details._2).replace(/\.+$/, ''));
        }
        if (details._3 !== undefined) {
            params.param3 = sanitizeParameterValue(String(details._3).replace(/\.+$/, ''));
        }
        if (details._4 !== undefined) {
            params.param4 = sanitizeParameterValue(String(details._4).replace(/\.+$/, ''));
        }
        if (details._5 !== undefined) {
            params.param5 = sanitizeParameterValue(String(details._5).replace(/\.+$/, ''));
        }

        // Also include any named parameters from details
        Object.keys(details).forEach(key => {
            if (!key.startsWith('_')) {
                params[key] = sanitizeParameterValue(String(details[key]).replace(/\.+$/, ''));
            }
        });
    }

    // Handle direct parameter mapping (for backward compatibility)
    if (!errorResponse.code_args && !errorResponse.details) {
        // Handle common parameter mappings from legacy format
        if (errorResponse._1 !== undefined) {
            params.param1 = sanitizeParameterValue(String(errorResponse._1).replace(/\.+$/, ''));
        }
        if (errorResponse._2 !== undefined) {
            params.param2 = sanitizeParameterValue(String(errorResponse._2).replace(/\.+$/, ''));
        }
        if (errorResponse._3 !== undefined) {
            params.param3 = sanitizeParameterValue(String(errorResponse._3).replace(/\.+$/, ''));
        }
        if (errorResponse._4 !== undefined) {
            params.param4 = sanitizeParameterValue(String(errorResponse._4).replace(/\.+$/, ''));
        }
        if (errorResponse._5 !== undefined) {
            params.param5 = sanitizeParameterValue(String(errorResponse._5).replace(/\.+$/, ''));
        }

        // Also include any named parameters
        Object.keys(errorResponse).forEach(key => {
            if (!key.startsWith('_') && !['code', 'subcode', 'message'].includes(key)) {
                params[key] = sanitizeParameterValue(String(errorResponse[key]).replace(/\.+$/, ''));
            }
        });
    }

    return params;
};

// Backend error code mappings for localization
export const getBackendErrorMessages = () => ({
    // Bot-skeleton specific errors
    RateLimit: localize('You are rate limited for: {{message_type}}, retrying in {{delay}}s (ID: {{request}})'),
    DisconnectError: localize('You are disconnected, retrying in {{delay}}s'),
    RequestFailed: localize('Request failed for: {{message_type}}, retrying in {{delay}}s'),
    InputValidationFailed: localize('Invalid input provided'),
    DurationValidationFailed: localize('Duration must be a positive integer'),
    AmountValidationFailed: localize('Amount must be a positive number.'),
    ProposalsNotReady: localize('Proposals are not ready'),
    SelectedProposalNotExist: localize('Selected proposal does not exist'),
    ContractBuyValidationError: localize('Contract purchase validation failed'),
    InvalidOfferings: localize('Contract cannot be sold at this time'),
    InvalidSellContractProposal: localize('Invalid sell contract proposal'),
    UnrecognisedRequest: localize('Unrecognised request'),
    InvalidContractProposal: localize('Invalid contract proposal'),
    NotInitialized: localize('Bot.init is not called'),
    CallError: localize('API call error occurred'),
    WrongResponse: localize('Unexpected API response'),
    GetProposalFailure: localize('Failed to get proposal'),
    PositiveIntegerExpected: localize('A positive integer is expected'),
    OptionError: localize('Option validation error occurred'),
    LoginError: localize('Please log in to continue'),
    CandleExpected: localize('A valid candle is expected'),
    CandleListExpected: localize('A valid candle list is expected'),
    CustomLimitsReached: localize('Custom trading limits have been reached'),
    AlreadySubscribed: localize('Already subscribed to this data stream'),
    MaxTradesReached: localize('Maximum number of trades reached'),
    MaxLossReached: localize('Maximum loss amount reached'),

    // Backend API errors
    AccountBalanceExceedsLimit: localize(
        'Sorry, your account cash balance is too high ({{param1}}). Your maximum account balance is {{param2}}.'
    ),
    AlreadyExpired: localize('This contract has already expired.'),
    AuthorizationRequired: localize('Please log in.'),
    BarrierNotAllowed: localize('Barrier is not allowed for this contract type.'),
    BarrierNotInRange: localize('Barrier is not an integer in range of {{param1}} to {{param2}}.'),
    BarrierOutOfRange: localize('Barrier is out of acceptable range.'),
    BarrierValidationError: localize('Barrier can only be up to {{param1}} decimal places.'),
    BetExpired: localize('The contract has expired.'),
    CancelIsBetter: localize(
        'The spot price has moved. We have not closed this contract because your profit is negative and deal cancellation is active. Cancel your contract to get your full stake back.'
    ),
    CannotCancelContract: localize('Deal cancellation is not available for this contract.'),
    CannotValidateContract: localize('Cannot validate contract.'),
    ClientContractProfitLimitExceeded: localize('Maximum daily profit limit exceeded for this contract.'),
    ClientUnderlyingVolumeLimitReached: localize(
        'You will exceed the maximum exposure limit for this market if you purchase this contract. Please close some of your positions and try again.'
    ),
    ClientUnwelcome: localize('Sorry, your account is not authorised for any further contract purchases.'),
    ClientVolumeLimitReached: localize(
        'You will exceed the maximum exposure limit if you purchase this contract. Please close some of your positions and try again.'
    ),
    CompanyWideLimitExceeded: localize(
        'No further trading is allowed on this contract type for the current trading session For more info, refer to our terms and conditions.'
    ),
    ContractAlreadySold: localize('This contract has been sold.'),
    ContractAlreadyStarted: localize('Start time is in the past.'),
    ContractExpiryNotAllowed: localize('Contract may not expire between {{param1}} and {{param2}}.'),
    ContractNotFound: localize('This contract was not found among your open positions.'),
    ContractUpdateDisabled: localize('Update of stop loss and take profit is not available at the moment.'),
    ContractUpdateFailure: localize('Invalid contract update parameters.'),
    ContractUpdateNotAllowed: localize(
        "This contract cannot be updated once you've made your purchase.This feature is not available for this contract type."
    ),
    ContractUpdateTooFrequent: localize('Only one update per second is allowed.'),
    CrossMarketIntraday: localize('Intraday contracts may not cross market open.'),
    DailyProfitLimitExceeded: localize('No further trading is allowed for the current trading session.'),
    DailyTurnoverLimitExceeded: localize(
        'Purchasing this contract will cause you to exceed your daily turnover limit of {{param1}} {{param2}}.'
    ),
    DealCancellationBlackout: localize('Deal cancellation is not available from {{param1}} to {{param2}}.'),
    DealCancellationExpired: localize(
        'Deal cancellation period has expired. Your contract can only be cancelled while deal cancellation is active.'
    ),
    DealCancellationNotAvailable: localize('Deal cancellation is not available for this asset.'),
    DealCancellationNotBought: localize(
        'This contract does not include deal cancellation. Your contract can only be cancelled when you select deal cancellation in your purchase.'
    ),
    DigitOutOfRange: localize('Digit must be in the range of {{param1}} to {{param2}}.'),
    DuplicateExpiry: localize('Please enter only {{param1}} or {{param2}}.'),
    EitherStopLossOrCancel: localize(
        'You may use either stop loss or deal cancellation, but not both. Please select either one.'
    ),
    EitherTakeProfitOrCancel: localize(
        'You may use either take profit or deal cancellation, but not both. Please select either one.'
    ),
    EntryTickMissing: localize('Waiting for entry tick.'),
    FutureStartTime: localize('Start time is in the future.'),
    GeneralError: localize('A general error has occurred.'),
    GrowthRateOutOfRange: localize('Growth rate is not in acceptable range. Accepts {{param1}}.'),
    IncorrectBarrierOffsetDecimals: localize(
        '{{param1}} barrier offset can not have more than {{param2}} decimal places.'
    ),
    IncorrectPayoutDecimals: localize('Payout can not have more than {{param1}} decimal places.'),
    IncorrectStakeDecimals: localize('Stake can not have more than {{param1}} decimal places.'),
    InsufficientBalance: localize('Your account balance is insufficient to buy this contract.'),
    IntegerBarrierRequired: localize('Barrier must be an integer.'),
    IntegerSelectedTickRequired: localize('Selected tick must be an integer.'),
    InternalServerError: localize('Sorry, an error occurred while processing your request.'),
    InvalidAmount: localize('Amount provided can not have more than {{param1}} decimal places.'),
    InvalidBarrier: localize('Invalid barrier.'),
    InvalidBarrierDifferentType: localize(
        'Invalid barrier (Barrier type must be the same for double-barrier contracts).'
    ),
    InvalidBarrierDouble: localize('Invalid barrier (Double barrier input is expected).'),
    InvalidBarrierForSpot: localize('Barrier must be at least {{param1}} away from the spot.'),
    InvalidBarrierMixedBarrier: localize('Invalid barrier (Contract can have only one type of barrier).'),
    InvalidBarrierPredefined: localize('Barriers available are {{param1}}.'),
    InvalidBarrierRange: localize('Barriers must be on either side of the spot.'),
    InvalidBarrierSingle: localize('Invalid barrier (Single barrier input is expected).'),
    InvalidBarrierUndef: localize('Invalid barrier.'),
    InvalidContractType: localize('Invalid contract type.'),
    InvalidDatePricing: localize('This contract cannot be properly validated at this time.'),
    InvalidDealCancellation: localize('Deal cancellation is not offered at this duration.'),
    InvalidExpiry: localize('Invalid input (duration or date_expiry) for this contract type ({{param1}}).'),
    InvalidExpiryTime: localize('Invalid expiry time.'),
    InvalidHighBarrier: localize('High barrier must be higher than low barrier.'),
    InvalidHighLowBarrierRange: localize('High barrier is out of acceptable range. Please adjust the high barrier.'),
    InvalidInput: localize('{{param1}} is not a valid input for contract type {{param2}}.'),
    InvalidInputAsset: localize('Trading is not offered for this asset.'),
    InvalidLowBarrierRange: localize('Low barrier is out of acceptable range. Please adjust the low barrier.'),
    InvalidMinStake: localize("Please enter a stake amount that's at least {{param1}}."),
    InvalidNonBinaryPrice: localize('Contract price cannot be zero.'),
    InvalidPayoutCurrency: localize('Invalid payout currency'),
    InvalidPayoutPerPoint: localize('Available payout per points are {{param1}}.'),
    InvalidPrice: localize('Price provided can not have more than {{param1}} decimal places.'),
    InvalidRequest: localize('Invalid request.'),
    InvalidStake: localize('Invalid stake/payout.'),
    InvalidtoBuy: localize(
        'Minimum stake of {{param1}} and maximum payout of {{param2}}. Current payout is {{param3}}.'
    ),
    InvalidStakeMoreThanPrice: localize("Contract's stake amount is more than the maximum purchase price."),
    InvalidStartEnd: localize('Start time {{param1}} must be before end time {{param2}}'),
    InvalidStopOut: localize(
        'Invalid stop out. Stop out must be {{param1}} than current spot price. Please adjust stake or multiplier.'
    ),
    InvalidStyle: localize('Invalid style.'),
    InvalidSymbol: localize('Invalid symbol.'),
    InvalidTickExpiry: localize('Invalid duration (tick) for contract type ({{param1}}).'),
    InvalidToken: localize('Your token has expired or is invalid.'),
    InvalidUpdateArgument: localize('Only a hash reference input is accepted.'),
    InvalidUpdateValue: localize('Please enter a number or a null value.'),
    InvalidVolatility: localize('We could not process this contract at this time.'),
    LimitOrderAmountTooHigh: localize('Enter an amount equal to or lower than {{param1}}.'),
    LimitOrderAmountTooLow: localize('Enter an amount equal to or higher than {{param1}}.'),
    LimitOrderIncorrectDecimal: localize('Only {{param1}} decimal places allowed.'),
    MarketIsClosed: localize('This market is presently closed. Market will open at {{param1}}.'),
    MaxAggregateOpenStakeExceeded: localize(
        'No further trading is allowed on this growth rate and instrument. Please try again later or alternatively try on other instrument or growth rate.'
    ),
    MissingBasisSpot: localize('Basis spot is not defined.'),
    MissingConfig: localize('Missing configuration for {{param1}} and {{param2}} with expiry type {{param3}}'),
    MissingContractId: localize('Contract id is required.'),
    MissingEither: localize('Please specify either {{param1}} or {{param2}}.'),
    MissingMarketData: localize('Trading is suspended due to missing market data.'),
    MissingRequiredContractConfig: localize('Missing required contract config.'),
    MissingRequiredContractParams: localize('Missing required contract parameters ({{param1}}).'),
    MissingRequiredDigit: localize('Missing required contract parameters (last digit prediction for digit contracts).'),
    MissingRequiredSelectedTick: localize('Missing required contract parameters (selected tick).'),
    MissingSpotMarketData: localize('Trading is suspended due to missing market (spot too far) data.'),
    MissingTickMarketData: localize('Trading is suspended due to missing market (tick) data.'),
    MissingVanillaFinancialConfig: localize('Missing vanilla option configuration for financial symbols'),
    MissingVolatilityMarketData: localize('Trading is suspended due to missing market (volatility) data.'),
    MultiplierOutOfRange: localize('Multiplier is not in acceptable range. Accepts {{param1}}.'),
    MultiplierRangeDisabled: localize('Multiplier is not in acceptable range.'),
    NeedAbsoluteBarrier: localize('Contracts more than 24 hours in duration would need an absolute barrier.'),
    NegativeContractBarrier: localize(
        'Barrier offset {{param1}} exceeded quote price, contract barrier must be positive.'
    ),
    NegativeTakeProfit: localize('Negative take profit value is not accepted'),
    NoBusiness: localize('This contract is unavailable on this account.'),
    NoBusinessMultiplier: localize(
        'Trading multiplier options on {{param1}} is disabled. Please choose another market.'
    ),
    NoCurrencySet: localize('Please set the currency of your account.'),
    NoOpenPosition: localize('This contract was not found among your open positions.'),
    NoReturn: localize('This contract offers no return.'),
    NonDeterminedBarriers: localize('Barriers could not be determined.'),
    NotDefaultCurrency: localize('The provided currency {{param1}} is not the default currency.'),
    OfferingsInvalidSymbol: localize("There's no contract available for this symbol."),
    OfferingsSymbolRequired: localize('Symbol is required.'),
    OldMarketData: localize('Trading is suspended due to missing market (old) data.'),
    OpenPositionLimit: localize(
        'Sorry, you cannot hold more than {{param1}} contracts at a given time. Please wait until some contracts have closed and try again.'
    ),
    OpenPositionLimitExceeded: localize(
        'You have open positions of this asset and trade type. Close or wait for them to settle first.'
    ),
    OpenPositionPayoutLimit: localize(
        'Sorry, the aggregate payouts of contracts on your account cannot exceed {{param1}} {{param2}}.'
    ),

    OrderUpdateNotAllowed: localize('Only updates to these parameters are allowed {{param1}}.'),
    OutdatedVolatilityData: localize('Trading is suspended due to missing market (out-of-date volatility) data.'),
    PastExpiryTime: localize('Expiry time cannot be in the past.'),
    PastStartTime: localize('Start time is in the past.'),
    PayoutLimitExceeded: localize('Maximum payout allowed is {{param1}}.'),
    PayoutLimits: localize(
        'Minimum stake of {{param1}} and maximum payout of {{param2}}. Current payout is {{param3}}.'
    ),
    PermissionDenied: localize('Permission denied.'),
    PriceMoved: localize(
        'The underlying market has moved too much since you priced the contract. The contract {{param4}} has changed from {{param2}} {{param1}} to {{param3}} {{param1}}.'
    ),
    ProductSpecificTurnoverLimitExceeded: localize(
        "You've reached the maximum daily stake for this trade type. Choose another trade type, or wait until {{param1}} {{param2}} {{param3}} {{param4}} {{param5}} UTC tomorrow for the daily limit to reset."
    ),
    PromoCodeLimitExceeded: localize(
        'Your account has exceeded the trading limit with free promo code, please deposit if you wish to continue trading.'
    ),
    RateLimitExceeded: localize('Rate limit exceeded.'),
    RefundBuyForMissingData: localize(
        'There was a market data disruption during the contract period. For real-money accounts we will attempt to correct this and settle the contract properly, otherwise the contract will be cancelled and refunded. Virtual-money contracts will be cancelled and refunded.'
    ),
    ResaleNotOffered: localize('Resale of this contract is not offered.'),
    ResaleNotOfferedHolidays: localize(
        'Resale of this contract is not offered due to market holidays during contract period.'
    ),
    ResalePathDependentNotAllowed: localize('Resale not available during rollover time.'),
    ResetBarrierError: localize('Non atm barrier is not allowed for reset contract.'),
    ResetFixedExpiryError: localize('Fixed expiry for reset contract is not allowed.'),
    RoundingExceedPermittedEpsilon: localize('Only a maximum of two decimal points are allowed for the amount.'),
    SameBarriersNotAllowed: localize('High and low barriers must be different.'),
    SameExpiryStartTime: localize('Expiry time cannot be equal to start time.'),
    SameStartSellTime: localize('Contract cannot be sold at this time. Please try again.'),
    SameTradingDayExpiry: localize(
        'Contracts on this market with a duration of under 24 hours must expire on the same trading day.'
    ),
    SelectedTickNumberLimits: localize('Tick prediction must be between {{param1}} and {{param2}}.'),
    SellAtEntryTick: localize('Contract cannot be sold at entry tick. Please wait for the next tick.'),
    SellFailureDueToUpdate: localize('Sell failed because contract was updated.'),
    SellPriceLowerThanStake: localize('Sell price must be higher than stake {{param1}}.'),
    SpecificOpenPositionLimitExceeded: localize(
        'You have exceeded the open position limit for contracts of this type.'
    ),
    StakeLimitExceeded: localize('Maximum stake allowed is {{param1}}.'),
    StakeLimits: localize('Minimum stake of {{param1}} and maximum payout of {{param2}}. Current stake is {{param3}}.'),
    StakeTooLow: localize(
        "This contract's price is {{param2}} {{param1}}. Contracts purchased from {{param3}} must have a purchase price above {{param4}} {{param1}}. Please accordingly increase the contract amount to meet this minimum stake."
    ),
    Suspendedlogin: localize(
        "We can't take you to your account right now due to system maintenance. Please try again later."
    ),
    SymbolMissingInBetMarketTable: localize('Trading is suspended for this instrument.'),
    SingleTickNumberLimits: localize('Number of ticks must be {{param1}}.'),
    TicksNumberLimits: localize('Number of ticks must be between {{param1}} and {{param2}}.'),
    TooManyHolidays: localize('Too many market holidays during the contract period.'),
    TradeTemporarilyUnavailable: localize('This trade is temporarily unavailable.'),
    TradingConfigError: localize('Sorry, an error occurred while processing your request.'),
    TradingDayEndExpiry: localize(
        'Contracts on this market with a duration of more than 24 hours must expire at the end of a trading day.'
    ),
    TradingDayExpiry: localize('The contract must expire on a trading day.'),
    TradingDisabled: localize('Trading is disabled for this account.'),
    TradingDurationNotAllowed: localize('Trading is not offered for this duration.'),
    TradingHoursExpiry: localize('Contract must expire during trading hours.'),
    TradingNotAvailable: localize('Trading is not available from {{param1}} to {{param2}}.'),
    TradingSuspendedSpecificHours: localize(
        'Trading on forex contracts with duration less than 5 hours is not available from {{param1}} to {{param2}}'
    ),
    TransactionTimeTooOld: localize('Cannot create contract.'),
    TransactionTimeTooYoung: localize('Cannot create contract.'),
    UpdateStopLossNotAllowed: localize('You may update your stop loss amount after deal cancellation has expired.'),
    UpdateTakeProfitNotAllowed: localize('You may update your take profit amount after deal cancellation has expired.'),
    WaitForContractSettlement: localize(
        'Please wait for contract settlement. The final settlement price may differ from the indicative price.'
    ),
    WrongAmountTypeOne: localize('Basis must be {{param1}} for this contract.'),
    WrongAmountTypeTwo: localize('Basis can either be {{param1}} or {{param2}} for this contract.'),
    ZeroAbsoluteBarrier: localize('Barrier cannot be zero.'),
});

/**
 * Helper function to get localized error message by error code
 * @param errorCode - The backend error code
 * @param errorResponse - The complete error response containing code_args, details, etc.
 * @returns Localized error message
 */
export const getLocalizedErrorMessage = (errorCode: string, errorResponse?: Record<string, any>): string => {
    const errorMessages = getBackendErrorMessages();
    let message = errorMessages[errorCode as keyof typeof errorMessages];

    if (!message) {
        // Log unknown error codes for monitoring and improvement
        console.warn(`Unknown error code encountered: ${errorCode}`, {
            errorCode,
            errorResponse,
            availableErrorCodes: Object.keys(errorMessages).slice(0, 10), // Log first 10 for reference
        });

        // If no predefined message, use the backend message if available
        message = errorResponse?.message || localize('An error occurred. Please try again.');
    }

    // Handle direct replacement of [_1], [_2], [_3] format with code_args values
    if (errorResponse?.code_args && Array.isArray(errorResponse.code_args)) {
        errorResponse.code_args.forEach((value: any, index: number) => {
            const placeholder = `[_${index + 1}]`;
            message = message.replace(new RegExp(`\\${placeholder}`, 'g'), value);
        });
    }

    // Process backend parameters for {{param}} format
    const processedParams = processBackendParameters(message, errorResponse);

    // For messages that already have parameter placeholders, replace them directly
    // instead of using localize() which adds "..." for unknown translation keys
    let finalMessage = message;
    if (processedParams && Object.keys(processedParams).length > 0) {
        Object.keys(processedParams).forEach(key => {
            const placeholder = `{{${key}}}`;
            finalMessage = finalMessage.replace(new RegExp(placeholder, 'g'), processedParams[key]);
        });
    } else {
        // Only use localize() for static messages without dynamic parameters
        finalMessage = localize(message, processedParams);
    }

    return finalMessage;
};

/**
 * Type definition for backend error codes
 */
export type BackendErrorCode = keyof ReturnType<typeof getBackendErrorMessages>;
