import {
    AccountLimitsRequest,
    AccountLimitsResponse,
    ActiveSymbolsRequest,
    ActiveSymbolsResponse,
    APITokenRequest,
    APITokenResponse,
    ApplicationDeleteRequest,
    ApplicationDeleteResponse,
    ApplicationGetDetailsRequest,
    ApplicationGetDetailsResponse,
    ApplicationListRequest,
    ApplicationListResponse,
    ApplicationMarkupDetailsRequest,
    ApplicationMarkupDetailsResponse,
    ApplicationMarkupStatisticsRequest,
    ApplicationMarkupStatisticsResponse,
    ApplicationRegisterRequest,
    ApplicationRegisterResponse,
    ApplicationUpdateRequest,
    ApplicationUpdateResponse,
    AssetIndexRequest,
    AssetIndexResponse,
    AuthorizeRequest,
    AuthorizeResponse,
    BalanceRequest,
    BalanceResponse,
    BuyContractForMultipleAccountsRequest,
    BuyContractForMultipleAccountsResponse,
    BuyContractRequest,
    BuyContractResponse,
    CancelAContractRequest,
    CancelAContractResponse,
    CashierInformationRequest,
    CashierInformationResponse,
    ContractsForSymbolRequest,
    ContractsForSymbolResponse,
    CopyTradingListRequest,
    CopyTradingListResponse,
    CopyTradingStartRequest,
    CopyTradingStartResponse,
    CopyTradingStatisticsRequest,
    CopyTradingStatisticsResponse,
    CopyTradingStopRequest,
    CopyTradingStopResponse,
    CryptocurrencyConfigurationsRequest,
    CryptocurrencyConfigurationsResponse,
    EconomicCalendarRequest,
    EconomicCalendarResponse,
    ForgetAllRequest,
    ForgetAllResponse,
    ForgetRequest,
    ForgetResponse,
    GetFinancialAssessmentRequest,
    GetFinancialAssessmentResponse,
    IdentityVerificationAddDocumentRequest,
    IdentityVerificationAddDocumentResponse,
    KYCAuthenticationStatusRequest,
    KYCAuthenticationStatusResponse,
    LoginHistoryRequest,
    LoginHistoryResponse,
    LogOutRequest,
    LogOutResponse,
    MT5DepositRequest,
    MT5DepositResponse,
    MT5NewAccountRequest,
    MT5NewAccountResponse,
    MT5PasswordChangeRequest,
    MT5PasswordChangeResponse,
    MT5PasswordCheckRequest,
    MT5PasswordCheckResponse,
    MT5PasswordResetRequest,
    MT5PasswordResetResponse,
    MT5WithdrawalRequest,
    MT5WithdrawalResponse,
    NewRealMoneyAccountDerivInvestmentEuropeLtdRequest,
    NewRealMoneyAccountDerivInvestmentEuropeLtdResponse,
    NewVirtualMoneyAccountRequest,
    NewVirtualMoneyAccountResponse,
    OAuthApplicationsRequest,
    OAuthApplicationsResponse,
    PaymentAgentCreateRequest,
    PaymentAgentCreateResponse,
    PaymentAgentDetailsRequest,
    PaymentAgentDetailsResponse,
    PaymentAgentListRequest,
    PaymentAgentListResponse,
    PaymentAgentTransferRequest,
    PaymentAgentTransferResponse,
    PaymentAgentWithdrawJustificationRequest,
    PaymentAgentWithdrawJustificationResponse,
    PaymentAgentWithdrawRequest,
    PaymentAgentWithdrawResponse,
    PaymentMethodsRequest,
    PaymentMethodsResponse,
    PingRequest,
    PingResponse,
    PortfolioRequest,
    PortfolioResponse,
    PriceProposalOpenContractsRequest,
    PriceProposalOpenContractsResponse,
    PriceProposalRequest,
    PriceProposalResponse,
    ProfitTableRequest,
    ProfitTableResponse,
    RealityCheckRequest,
    RealityCheckResponse,
    RevokeOauthApplicationRequest,
    RevokeOauthApplicationResponse,
    SellContractRequest,
    SellContractResponse,
    SellContractsMultipleAccountsRequest,
    SellContractsMultipleAccountsResponse,
    SellExpiredContractsRequest,
    SellExpiredContractsResponse,
    ServerConfigRequest,
    ServerConfigResponse,
    ServerListRequest,
    ServerListResponse,
    ServerTimeRequest,
    ServerTimeResponse,
    SetAccountCurrencyRequest,
    SetAccountCurrencyResponse,
    SetAccountSettingsRequest,
    SetAccountSettingsResponse,
    SetFinancialAssessmentRequest,
    SetFinancialAssessmentResponse,
    SetSelfExclusionRequest,
    SetSelfExclusionResponse,
    StatementRequest,
    StatementResponse,
    TicksHistoryRequest,
    TicksHistoryResponse,
    TicksStreamRequest,
    TicksStreamResponse,
    TopUpVirtualMoneyAccountRequest,
    TopUpVirtualMoneyAccountResponse,
    TradingDurationsRequest,
    TradingDurationsResponse,
    TradingPlatformPasswordResetRequest,
    TradingPlatformPasswordResetResponse,
    TradingTimesRequest,
    TradingTimesResponse,
    TransactionsStreamRequest,
    TransactionsStreamResponse,
    TransferBetweenAccountsRequest,
    TransferBetweenAccountsResponse,
    UnsubscribeEmailRequest,
    UnsubscribeEmailResponse,
    UpdateContractHistoryRequest,
    UpdateContractHistoryResponse,
    UpdateContractRequest,
    UpdateContractResponse,
} from '@deriv/api-types';

export type NoStringIndex<T> = { [K in keyof T as string extends K ? never : K]: T[K] };

type TSocketEndpoints = {
    active_symbols: {
        request: ActiveSymbolsRequest;
        response: ActiveSymbolsResponse;
    };
    api_token: {
        request: APITokenRequest;
        response: APITokenResponse;
    };
    app_delete: {
        request: ApplicationDeleteRequest;
        response: ApplicationDeleteResponse;
    };
    app_get: {
        request: ApplicationGetDetailsRequest;
        response: ApplicationGetDetailsResponse;
    };
    app_list: {
        request: ApplicationListRequest;
        response: ApplicationListResponse;
    };
    app_markup_details: {
        request: ApplicationMarkupDetailsRequest;
        response: ApplicationMarkupDetailsResponse;
    };
    app_markup_statistics: {
        request: ApplicationMarkupStatisticsRequest;
        response: ApplicationMarkupStatisticsResponse;
    };
    app_register: {
        request: ApplicationRegisterRequest;
        response: ApplicationRegisterResponse;
    };
    app_update: {
        request: ApplicationUpdateRequest;
        response: ApplicationUpdateResponse;
    };
    asset_index: {
        request: AssetIndexRequest;
        response: AssetIndexResponse;
    };
    authorize: {
        request: AuthorizeRequest;
        response: AuthorizeResponse;
    };
    balance: {
        request: BalanceRequest;
        response: BalanceResponse;
    };
    buy_contract_for_multiple_accounts: {
        request: BuyContractForMultipleAccountsRequest;
        response: BuyContractForMultipleAccountsResponse;
    };
    buy: {
        request: BuyContractRequest;
        response: BuyContractResponse;
    };
    cancel: {
        request: CancelAContractRequest;
        response: CancelAContractResponse;
    };
    cashier: {
        request: CashierInformationRequest;
        response: CashierInformationResponse;
    };
    confirm_email: {
        request: {
            /**
             * Must be `1`.
             */
            confirm_email: 1;

            /**
             * Boolean value: 1 or 0, indicating whether the client has given consent for marketing emails.
             */
            email_consent: 1 | 0;

            /**
             * Email verification code (received from a `verify_email` call, which must be done first).
             */
            verification_code: string;

            /**
             * [Optional] Used to pass data through the websocket, which may be retrieved via the `echo_req` output field.
             */
            passthrough?: {
                [k: string]: unknown;
            };

            /**
             * [Optional] Used to map request to response.
             */
            req_id?: number;
        };
        response: {
            /**
             * 1 for success (The verification code has been successfully verified)
             */
            confirm_email: 0 | 1;
        };
        /**
         * Echo of the request made.
         */
        echo_req: {
            [k: string]: unknown;
        };

        /**
         * Action name of the request made.
         */
        msg_type: 'confirm_email';

        /**
         * Optional field sent in request to map to response, present only when request contains `req_id`.
         */
        req_id?: number;
    };
    contract_update_history: {
        request: UpdateContractHistoryRequest;
        response: UpdateContractHistoryResponse;
    };
    contract_update: {
        request: UpdateContractRequest;
        response: UpdateContractResponse;
    };
    contracts_for: {
        request: ContractsForSymbolRequest;
        response: ContractsForSymbolResponse;
    };
    copy_start: {
        request: CopyTradingStartRequest;
        response: CopyTradingStartResponse;
    };
    copy_stop: {
        request: CopyTradingStopRequest;
        response: CopyTradingStopResponse;
    };
    copytrading_list: {
        request: CopyTradingListRequest;
        response: CopyTradingListResponse;
    };
    copytrading_statistics: {
        request: CopyTradingStatisticsRequest;
        response: CopyTradingStatisticsResponse;
    };
    crypto_config: {
        request: CryptocurrencyConfigurationsRequest;
        response: CryptocurrencyConfigurationsResponse;
    };

    economic_calendar: {
        request: EconomicCalendarRequest;
        response: EconomicCalendarResponse;
    };

    forget_all: {
        request: ForgetAllRequest;
        response: ForgetAllResponse;
    };
    forget: {
        request: ForgetRequest;
        response: ForgetResponse;
    };

    get_financial_assessment: {
        request: GetFinancialAssessmentRequest;
        response: GetFinancialAssessmentResponse;
    };
    get_limits: {
        request: AccountLimitsRequest;
        response: AccountLimitsResponse;
    };

    identity_verification_document_add: {
        request: IdentityVerificationAddDocumentRequest;
        response: IdentityVerificationAddDocumentResponse;
    };
    kyc_auth_status: {
        request: KYCAuthenticationStatusRequest;
        response: KYCAuthenticationStatusResponse;
    };

    login_history: {
        request: LoginHistoryRequest;
        response: LoginHistoryResponse;
    };
    logout: {
        request: LogOutRequest;
        response: LogOutResponse;
    };
    mt5_deposit: {
        request: MT5DepositRequest;
        response: MT5DepositResponse;
    };

    mt5_new_account: {
        request: MT5NewAccountRequest;
        response: MT5NewAccountResponse;
    };
    mt5_password_change: {
        request: MT5PasswordChangeRequest;
        response: MT5PasswordChangeResponse;
    };
    mt5_password_check: {
        request: MT5PasswordCheckRequest;
        response: MT5PasswordCheckResponse;
    };
    mt5_password_reset: {
        request: MT5PasswordResetRequest;
        response: MT5PasswordResetResponse;
    };
    mt5_withdrawal: {
        request: MT5WithdrawalRequest;
        response: MT5WithdrawalResponse;
    };
    new_account_maltainvest: {
        request: NewRealMoneyAccountDerivInvestmentEuropeLtdRequest;
        response: NewRealMoneyAccountDerivInvestmentEuropeLtdResponse;
    };

    new_account_virtual: {
        request: NewVirtualMoneyAccountRequest;
        response: NewVirtualMoneyAccountResponse;
    };
    notifications_list: {
        request: {
            /**
             * Must be 1
             */
            notifications_list: 1;
            /**
             * [Optional] Used to map request to response.
             */
            req_id?: number;
            /**
             * [Optional] If set to 1, will send updates whenever there is a change to any notification belonging to you.
             */
            subscribe?: 1;
        };
        response: {
            /**
             * Echo of the request made.
             */
            echo_req: {
                [k: string]: unknown;
            };
            /**
             * Action name of the request made.
             */
            msg_type: 'notifications_list';
            notifications_list: {
                /**
                 * Total no. of notifications that are actionable.
                 */
                count_actionable: number;
                /**
                 * Total no. of notifications.
                 */
                count_total: number;
                /**
                 * Total no. of unread notifications.
                 */
                count_unread: number;
                /**
                 * List of notifications.
                 */
                messages: {
                    /**
                     * `Act` if the notification is actionable.
                     */
                    category: 'act' | 'see';
                    /**
                     * Id of the notification.
                     */
                    id: number;
                    links: {
                        href: string;
                        rel: string;
                    }[];
                    /**
                     * Unique key of the notification.
                     */
                    message_key: string;
                    /**
                     * Contains keys and values use for transforming the notification message.
                     */
                    payload: string;
                    /**
                     * Flag indicating if the notification has been read.
                     */
                    read: boolean;
                    /**
                     * Flag indicating if the notification has been removed.
                     */
                    removed: boolean;
                }[];
            };
            /**
             * Optional field sent in request to map to response, present only when request contains `req_id`.
             */
            req_id?: number;
        };
    };
    notifications_update_status: {
        request: {
            /**
             * Action to call. Must be `read`, `unread`, or `remove`.
             */
            notifications_update_status: 'read' | 'unread' | 'remove';
            /**
             * Array of notification ids to update.
             */
            ids: string[];
        };
        response: {
            /**
             * Echo of the request made.
             */
            echo_req: {
                [k: string]: unknown;
            };
            /**
             * Action name of the request made.
             */
            msg_type: 'notifications_update_status';
            /**
             * List of updated notifications.
             */
            notifications_update_status: string[];
        };
    };
    oauth_apps: {
        request: OAuthApplicationsRequest;
        response: OAuthApplicationsResponse;
    };

    payment_methods: {
        request: PaymentMethodsRequest;
        response: PaymentMethodsResponse;
    };
    paymentagent_create: {
        request: PaymentAgentCreateRequest;
        response: PaymentAgentCreateResponse;
    };
    paymentagent_details: {
        request: PaymentAgentDetailsRequest;
        response: PaymentAgentDetailsResponse;
    };
    paymentagent_list: {
        request: PaymentAgentListRequest;
        response: PaymentAgentListResponse;
    };
    paymentagent_transfer: {
        request: PaymentAgentTransferRequest;
        response: PaymentAgentTransferResponse;
    };
    paymentagent_withdraw: {
        request: PaymentAgentWithdrawRequest;
        response: PaymentAgentWithdrawResponse;
    };
    paymentagent_withdraw_justification: {
        request: PaymentAgentWithdrawJustificationRequest;
        response: PaymentAgentWithdrawJustificationResponse;
    };

    ping: {
        request: PingRequest;
        response: PingResponse;
    };
    portfolio: {
        request: PortfolioRequest;
        response: PortfolioResponse;
    };
    profit_table: {
        request: ProfitTableRequest;
        response: ProfitTableResponse;
    };
    proposal_open_contract: {
        request: PriceProposalOpenContractsRequest;
        response: PriceProposalOpenContractsResponse;
    };
    proposal: {
        request: PriceProposalRequest;
        response: PriceProposalResponse;
    };
    reality_check: {
        request: RealityCheckRequest;
        response: RealityCheckResponse;
    };

    revoke_oauth_app: {
        request: RevokeOauthApplicationRequest;
        response: RevokeOauthApplicationResponse;
    };
    sell_contract_for_multiple_accounts: {
        request: SellContractsMultipleAccountsRequest;
        response: SellContractsMultipleAccountsResponse;
    };
    sell_expired: {
        request: SellExpiredContractsRequest;
        response: SellExpiredContractsResponse;
    };
    sell: {
        request: SellContractRequest;
        response: SellContractResponse;
    };
    set_account_currency: {
        request: SetAccountCurrencyRequest;
        response: SetAccountCurrencyResponse;
    };
    set_financial_assessment: {
        request: SetFinancialAssessmentRequest;
        response: SetFinancialAssessmentResponse;
    };
    set_self_exclusion: {
        request: SetSelfExclusionRequest;
        response: SetSelfExclusionResponse;
    };
    set_settings: {
        request: SetAccountSettingsRequest;
        response: SetAccountSettingsResponse;
    };
    statement: {
        request: StatementRequest;
        response: StatementResponse;
    };

    ticks_history: {
        request: TicksHistoryRequest;
        response: TicksHistoryResponse;
    };
    ticks: {
        request: TicksStreamRequest;
        response: TicksStreamResponse;
    };
    time: {
        request: ServerTimeRequest;
        response: ServerTimeResponse;
    };

    topup_virtual: {
        request: TopUpVirtualMoneyAccountRequest;
        response: TopUpVirtualMoneyAccountResponse;
    };
    trading_durations: {
        request: TradingDurationsRequest;
        response: TradingDurationsResponse;
    };
    trading_platform_password_reset: {
        request: TradingPlatformPasswordResetRequest;
        response: TradingPlatformPasswordResetResponse;
    };
    trading_servers: {
        request: ServerListRequest;
        response: ServerListResponse;
    };
    trading_times: {
        request: TradingTimesRequest;
        response: TradingTimesResponse;
    };
    transaction: {
        request: TransactionsStreamRequest;
        response: TransactionsStreamResponse;
    };
    transfer_between_accounts: {
        request: TransferBetweenAccountsRequest;
        response: TransferBetweenAccountsResponse;
    };
    unsubscribe_email: {
        request: UnsubscribeEmailRequest;
        response: UnsubscribeEmailResponse;
    };
    website_config: {
        request: ServerConfigRequest;
        response: ServerConfigResponse;
    };
};

export type TSocketEndpointNames = keyof TSocketEndpoints;

export type TSocketError<T extends TSocketEndpointNames> = {
    /**
     * Echo of the request made.
     */
    echo_req: {
        [k: string]: unknown;
    };
    /**
     * Error object.
     */
    error: {
        code: string;
        message: string;
    };
    /**
     * Action name of the request made.
     */
    msg_type: T;
    /**
     * [Optional] Used to map request to response.
     */
    req_id?: number;
};

export type TSocketResponse<T extends TSocketEndpointNames> = TSocketEndpoints[T]['response'] & TSocketError<T>;

export type TSocketResponseData<T extends TSocketEndpointNames> = Omit<
    NoStringIndex<TSocketResponse<T>>,
    'req_id' | 'echo_req' | 'subscription'
>;

export type TAccount = {
    balance: number;
    currency: string;
    is_virtual: number;
    loginid: string;
};

export type TAuthData = {
    account_list?: TAccount[];
    balance: number;
    country?: string;
    currency: string;
    email?: string;
    fullname?: string;
    is_virtual: number;

    linked_to?: [];
    local_currencies?: Record<string, unknown>;
    loginid: string;
    preferred_language?: string;
    scopes?: string[];

    user_id?: number;
    token?: string;
};
