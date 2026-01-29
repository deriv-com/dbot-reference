import React from 'react';
import classNames from 'classnames';
import debounce from 'debounce';
import { Field, FieldProps, useFormikContext } from 'formik';
import { observer } from 'mobx-react-lite';
import Autocomplete from '@/components/shared_ui/autocomplete';
import { TItem } from '@/components/shared_ui/dropdown-list';
import Text from '@/components/shared_ui/text';
import { getLocalizedErrorMessage } from '@/constants/backend-error-messages';
import { api_base } from '@/external/bot-skeleton';
import { requestProposalForQS } from '@/external/bot-skeleton/scratch/accumulators-proposal-handler';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { TDropdownItems, TFormData } from '../types';

// TRANSLATION EXTRACTION HINTS
// These translation keys are required for the CLI extraction tool (npx deriv-extract-translations)
// to detect dynamically used error messages from getLocalizedErrorMessage() calls.
// The actual translations are used at runtime in the error handling logic below (lines 160-170).
// DO NOT REMOVE - Required for proper i18n extraction and translation coverage.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TRANSLATION_KEYS = {
    LimitOrderAmountTooLow: localize('Enter an amount equal to or higher than {{param1}}.'),
    ContractBuyValidationError: localize('Contract purchase validation failed'),
    MinimumTickCount: localize('Minimum tick count allowed is {{ min }}'),
    MaximumTickCount: localize('Maximum tick count allowed is {{ max }}'),
    InvalidMinStake: localize("Please enter a stake amount that's at least {{param1}}."),
};

type TContractTypes = {
    name: string;
    attached?: boolean;
};

type TProposalRequest = {
    amount: number;
    currency: string;
    growth_rate: number;
    symbol: string;
    limit_order: {
        take_profit?: number;
    };
    boolean_tick_count: boolean;
};

type TErrorResponse = {
    message?: string;
    error?: {
        code?: string;
        subcode?: string;
        message?: string;
        code_args?: any[];
        details?: {
            field?: string;
        };
    };
};

/**
 * Helper function to get localized error message with subcode priority
 * Prioritizes subcode over code for consistency with centralized error handling
 */
const getLocalizedError = (typedError: TErrorResponse): string => {
    if (typedError?.error?.subcode) {
        return getLocalizedErrorMessage(typedError.error.subcode, typedError.error);
    } else if (typedError?.error?.code) {
        return getLocalizedErrorMessage(typedError.error.code, typedError.error);
    }
    return typedError?.error?.message || '';
};

const GrowthRateSelect: React.FC<TContractTypes> = observer(({ name }) => {
    const { ui, client } = useStore();
    const { is_desktop } = ui;
    const [list, setList] = React.useState<TDropdownItems[]>([]);
    const { quick_strategy } = useStore();
    const { setValue, setAdditionalData } = quick_strategy;
    const { setFieldValue, values, setFieldError, errors } = useFormikContext<TFormData>();

    const prev_proposal_payload = React.useRef<TProposalRequest | null>(null);
    const ref_max_payout = React.useRef<TProposalRequest | null>(null);
    const prev_error = React.useRef<{
        tick_count: string | null;
        take_profit: string | null;
    }>({
        tick_count: null,
        take_profit: null,
    });

    React.useEffect(() => {
        setList([
            { text: '1%', value: '0.01' },
            { text: '2%', value: '0.02' },
            { text: '3%', value: '0.03' },
            { text: '4%', value: '0.04' },
            { text: '5%', value: '0.05' },
        ]);
        setFieldValue?.('tradetype', 'accumulator');
        setValue('tradetype', 'accumulator');
    }, []);

    React.useEffect(() => {
        if (values.boolean_tick_count) {
            setFieldValue('take_profit', 0);
            setFieldError('tick_count', prev_error.current?.tick_count ?? undefined);
            setFieldError('take_profit', undefined);
        } else {
            setFieldValue('tick_count', 0);
            setFieldError('take_profit', prev_error.current?.take_profit ?? undefined);
            setFieldError('tick_count', undefined);
        }
    }, [values, errors.take_profit, errors.tick_count, values.boolean_tick_count, setFieldValue, setFieldError]);

    const validateMinMaxForAccumulators = async (values: TFormData) => {
        const growth_rate = Number(values.growth_rate);
        const amount = Number(values.stake);
        const take_profit = Number(values.take_profit);
        const request_proposal = {
            amount,
            currency: client?.currency,
            growth_rate,
            symbol: values.symbol,
            limit_order: {
                ...(!values.boolean_tick_count && { take_profit }),
            },
        };

        prev_proposal_payload.current = {
            ...request_proposal,
            symbol: String(request_proposal.symbol),
            boolean_tick_count: Boolean(values.boolean_tick_count),
        };
        try {
            const response = await requestProposalForQS(request_proposal, api_base.api);
            const min_ticks = 1;
            const max_ticks = response?.proposal?.validation_params?.max_ticks;

            // Extract max_stake from the correct path in the API response
            const max_stake = response?.proposal?.contract_details?.maximum_stake;
            const min_stake = response?.proposal?.contract_details?.minimum_stake;

            let min_error = '';
            let max_error = '';
            setAdditionalData({
                max_payout: ref_max_payout.current,
                max_ticks,
                max_stake: Number(max_stake) || 1000,
                min_stake: Number(min_stake) || 1,
            });
            ref_max_payout.current = response?.proposal?.validation_params?.max_payout;
            const current_tick_count = Number(values.tick_count);

            if (!isNaN(current_tick_count) && current_tick_count > max_ticks) {
                max_error = localize('Maximum tick count allowed is {{ max }}', { max: max_ticks });
                setFieldError('tick_count', max_error);
                prev_error.current.tick_count = max_error;
            } else if (!isNaN(current_tick_count) && current_tick_count < min_ticks) {
                min_error = localize('Minimum tick count allowed is {{ min }}', { min: min_ticks });
                setFieldError('tick_count', min_error);
                prev_error.current.tick_count = min_error;
            } else {
                prev_error.current.tick_count = null;
                setFieldError('tick_count', undefined);
            }
            prev_error.current.take_profit = null;
        } catch (error_response) {
            const typedError = error_response as TErrorResponse;
            let error_message = typedError?.message ?? typedError?.error?.message;

            // Use centralized error message handling for consistency
            error_message = getLocalizedError(typedError);

            if (values.boolean_tick_count) {
                setFieldError('tick_count', error_message);
                prev_error.current.tick_count = error_message || null;

                // Force rerender by updating the field value
                const current_value = Number(values.tick_count);
                if (current_value > 1000) {
                    setFieldValue('tick_count', 1000);
                } else if (current_value < 1) {
                    setFieldValue('tick_count', 1);
                }
            } else {
                // Handle take_profit field errors
                if (typedError?.error?.details?.field === 'take_profit') {
                    if (Number(values.take_profit) === 0) {
                        // Use centralized error message handling
                        error_message = getLocalizedError(typedError);
                    } else {
                        if (values?.take_profit && values.stake && ref_max_payout.current) {
                            const totalPayout = Number(values.take_profit) + Number(values.stake);
                            error_message = localize(
                                'Your total payout is {{total}}. Enter amount less than {{max}}.',
                                {
                                    total: totalPayout,
                                    max: ref_max_payout.current,
                                }
                            );
                            const hint = localize('By changing your initial stake and/or take profit.');
                            error_message = `${error_message} ${hint}`;
                        }
                    }
                    setFieldError('take_profit', error_message);
                    prev_error.current.take_profit = error_message || null;
                }
                // Handle other field errors with clearer logic
                else {
                    const errorField = typedError?.error?.details?.field;

                    if (errorField === 'stake' || errorField === 'amount') {
                        // Use centralized error message handling
                        error_message = getLocalizedError(typedError) || error_message;

                        // For 'amount' field from backend, only show error if stake has a value
                        // For 'stake' field, always show error
                        const shouldShowError =
                            errorField === 'stake' ||
                            (values.stake !== '' && values.stake !== undefined && values.stake !== null);

                        if (shouldShowError) {
                            setFieldError('stake', error_message);
                        }
                    } else {
                        // Default to take_profit for unknown fields
                        setFieldError('take_profit', error_message);
                        prev_error.current.take_profit = error_message || null;
                    }
                }
            }
        }
    };

    const debounceChange = React.useCallback(
        debounce(validateMinMaxForAccumulators, 1000, {
            immediate: false,
        }),
        []
    );

    React.useEffect(() => {
        if (
            prev_proposal_payload.current?.symbol !== values.symbol ||
            prev_proposal_payload.current?.amount !== values.stake ||
            prev_proposal_payload.current?.limit_order?.take_profit !== values.take_profit ||
            prev_proposal_payload.current?.currency !== client?.currency ||
            prev_proposal_payload.current?.growth_rate !== values.growth_rate ||
            prev_proposal_payload.current?.boolean_tick_count !== values.boolean_tick_count
        ) {
            debounceChange(values);
        }
    }, [
        values.take_profit,
        values.tick_count,
        values.stake,
        values.growth_rate,
        client?.currency,
        values.boolean_tick_count,
        values,
        debounceChange,
    ]);

    const handleChange = async (value: string) => {
        setFieldValue?.(name, value);
        setValue(name, value);
    };

    const key = `qs-contract-type-${name}`;

    return (
        <div className='qs__form__field qs__form__field__input no-top-spacing'>
            <Field name={name} key={key} id={key}>
                {({ field }: FieldProps) => {
                    const selected_item = list?.find(item => item?.value === field?.value);
                    if (!is_desktop) {
                        return (
                            <ul className='qs__form__field__list' data-testid='dt_qs_contract_types'>
                                {list.map(item => {
                                    const is_active = selected_item?.value === item?.value;
                                    return (
                                        <li
                                            key={item?.value}
                                            className={classNames('qs__form__field__list__item', {
                                                'qs__form__field__list__item--active': is_active,
                                            })}
                                            onClick={() => {
                                                handleChange(item?.value);
                                            }}
                                            onChange={() => {
                                                handleChange(item?.value);
                                            }}
                                        >
                                            <Text size='xs' color='prominent' weight={is_active ? 'bold ' : 'normal'}>
                                                {item?.text}
                                            </Text>
                                        </li>
                                    );
                                })}
                            </ul>
                        );
                    }
                    return (
                        <Autocomplete
                            {...field}
                            readOnly
                            data_testid='dt_qs_contract_type'
                            autoComplete='off'
                            className='qs__select contract-type'
                            value={selected_item?.text || ''}
                            list_items={list}
                            onItemSelection={(item: TItem) => {
                                const { value } = item as TDropdownItems;
                                if (value) {
                                    handleChange(value);
                                }
                            }}
                            dropdown_offset={'0'}
                            historyValue={''}
                            input_id={key}
                            is_alignment_top={false}
                            is_list_visible={false}
                            list_height={''}
                            list_portal_id={''}
                            not_found_text={''}
                            onHideDropdownList={() => {}}
                            onShowDropdownList={() => {}}
                            should_filter_by_char={false}
                        />
                    );
                }}
            </Field>
        </div>
    );
});

export default GrowthRateSelect;
