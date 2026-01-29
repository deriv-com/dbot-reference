import React from 'react';
import classNames from 'classnames';
import debounce from 'debounce';
import { Field, FieldProps, useFormikContext } from 'formik';
import { observer } from 'mobx-react-lite';
import Autocomplete from '@/components/shared_ui/autocomplete';
import { TItem } from '@/components/shared_ui/dropdown-list';
import Text from '@/components/shared_ui/text';
import { ApiHelpers } from '@/external/bot-skeleton';
import { api_base } from '@/external/bot-skeleton';
import { requestOptionsProposalForQS } from '@/external/bot-skeleton/scratch/options-proposal-handler';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import { TApiHelpersInstance, TDropdownItems, TFormData } from '../types';

type TContractTypes = {
    name: string;
    attached?: boolean;
};

type TProposalRequest = {
    amount: number;
    currency: string | undefined;
    underlying_symbol: string;
    contract_type: string;
    duration_unit: string;
    duration: number;
    basis: string;
};

const ContractTypes: React.FC<TContractTypes> = observer(({ name }) => {
    const { isDesktop } = useDevice();
    const [list, setList] = React.useState<TDropdownItems[]>([]);
    const { quick_strategy, client } = useStore();
    const { setValue } = quick_strategy;
    const { setFieldValue, values, setFieldError } = useFormikContext<TFormData>();
    const { symbol, tradetype } = values;

    React.useEffect(() => {
        if (tradetype && symbol) {
            const selected = values?.type;
            const getContractTypes = async () => {
                const { contracts_for } = (ApiHelpers?.instance as unknown as TApiHelpersInstance) ?? {};
                const categories = await contracts_for?.getContractTypes?.(tradetype);
                setList(categories);
                const has_selected = categories?.some(contract => contract.value === selected);
                if (!has_selected) {
                    setFieldValue?.(name, categories?.[0]?.value);
                    setValue(name, categories?.[0]?.value);
                }
            };
            getContractTypes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, tradetype]);

    // Define the validation function
    const validateMinMaxForOptions = async (values: TFormData) => {
        if (!values.type || !values.symbol || !values.durationtype) return;

        // Set loading state to true before API call
        quick_strategy.setOptionsLoading(true);

        const amount = Number(values.stake) || 0;
        const contract_type = values.type;
        const duration_unit = values.durationtype;
        const duration = Number(values.duration) || 0;

        const request_proposal: TProposalRequest = {
            amount,
            currency: client?.currency,
            underlying_symbol: values.symbol as string,
            contract_type: contract_type as string,
            duration_unit: duration_unit as string,
            duration,
            basis: 'stake',
        };
        try {
            await requestOptionsProposalForQS(request_proposal, api_base.api);

            // Clear previous errors if validation passes
            setFieldError('stake', undefined);
        } catch (error_response: any) {
            // Enhanced error handling for ContractBuyValidationError and other API errors
            let error_message = 'An error occurred while validating your input';
            let should_show_error = false;

            // Handle different error response formats
            if (error_response?.message) {
                error_message = error_response.message;
            } else if (error_response?.error?.message) {
                error_message = error_response.error.message;
            }

            // Handle ContractBuyValidationError specifically
            if (
                error_response?.code === 'ContractBuyValidationError' ||
                error_response?.error?.code === 'ContractBuyValidationError'
            ) {
                // This is a stake amount validation error - always show it if stake has a value
                should_show_error = values.stake !== '' && values.stake !== undefined && values.stake !== null;
            } else if (error_response?.code === 'MarketIsClosed' || error_response?.error?.code === 'MarketIsClosed') {
                // Don't show market closed errors as field errors - these are handled elsewhere
                should_show_error = false;
            } else if (
                error_response?.code === 'InvalidSymbol' ||
                error_response?.code === 'InvalidContractType' ||
                error_response?.code === 'InvalidDuration' ||
                error_response?.error?.code === 'InvalidSymbol' ||
                error_response?.error?.code === 'InvalidContractType' ||
                error_response?.error?.code === 'InvalidDuration'
            ) {
                // Show validation errors for invalid selections
                should_show_error = true;
            } else if (
                error_message.includes('connection') ||
                error_message.includes('network') ||
                error_message.includes('timeout')
            ) {
                // Don't show network errors as field errors - these are temporary
                should_show_error = false;
                console.warn('Network error during proposal validation:', error_message);
            } else {
                // For other errors, show them if stake has a value
                should_show_error = values.stake !== '' && values.stake !== undefined && values.stake !== null;
            }

            console.warn('Proposal validation error:', should_show_error);
            if (should_show_error) {
                // Handle stake amount validation errors with proper translation
                let translated_error_message = error_message;

                // Check if this is a minimum stake validation error
                if (error_message.includes("Please enter a stake amount that's at least")) {
                    // Extract the minimum amount from the error message
                    const amountMatch = error_message.match(/at least (\d+\.?\d*)/);
                    if (amountMatch && amountMatch[1]) {
                        const minAmount = amountMatch[1];
                        // Use the translation key with parameter substitution
                        translated_error_message = localize("Please enter a stake amount that's at least {{param1}}.", {
                            param1: minAmount,
                        });
                    } else {
                        // Fallback to direct translation if we can't extract the amount
                        translated_error_message = localize(error_message);
                    }
                }
                // Check if this is a maximum stake/payout validation error
                else if (error_message.includes('Minimum stake of') && error_message.includes('maximum payout of')) {
                    // Extract minimum stake and maximum payout values
                    const minStakeMatch = error_message.match(/Minimum stake of (\d+\.?\d*)/);
                    const maxPayoutMatch = error_message.match(/maximum payout of (\d+\.?\d*)/);
                    const currentPayoutMatch = error_message.match(/Current payout is (\d+\.?\d*)/);

                    if (minStakeMatch && maxPayoutMatch && currentPayoutMatch) {
                        const minStake = minStakeMatch[1];
                        const maxPayout = maxPayoutMatch[1];
                        const currentPayout = currentPayoutMatch[1];
                        // Use the translation key with parameter substitution
                        translated_error_message = localize(
                            'Minimum stake of {{param1}} and maximum payout of {{param2}}. Current payout is {{param3}}.',
                            {
                                param1: minStake,
                                param2: maxPayout,
                                param3: currentPayout,
                            }
                        );
                    } else {
                        // Fallback to direct translation if we can't extract the values
                        translated_error_message = localize(error_message);
                    }
                }
                // Check if this is a maximum stake validation error (alternative format)
                else if (error_message.includes("Please enter a stake amount that's at most")) {
                    // Extract the maximum amount from the error message
                    const amountMatch = error_message.match(/at most (\d+\.?\d*)/);
                    if (amountMatch && amountMatch[1]) {
                        const maxAmount = amountMatch[1];
                        // Use the translation key with parameter substitution
                        translated_error_message = localize("Please enter a stake amount that's at most {{param1}}.", {
                            param1: maxAmount,
                        });
                    } else {
                        // Fallback to direct translation if we can't extract the amount
                        translated_error_message = localize(error_message);
                    }
                } else {
                    // For other error messages, use direct translation
                    translated_error_message = localize(error_message);
                }

                setFieldError('stake', translated_error_message);
            }
        } finally {
            // Set loading state to false after API call (whether it succeeded or failed)
            quick_strategy.setOptionsLoading(false);
        }
    };

    // Store the latest version of validateMinMaxForOptions in a ref
    const validateMinMaxForOptionsRef = React.useRef(validateMinMaxForOptions);

    // Update the ref whenever the function changes
    React.useEffect(() => {
        validateMinMaxForOptionsRef.current = validateMinMaxForOptions;
    }, [validateMinMaxForOptions]);

    // Create a stable debounced function that uses the ref to always access the latest function
    const debounceChange = React.useMemo(() => {
        return debounce(
            values => {
                return validateMinMaxForOptionsRef.current(values);
            },
            1000,
            {
                immediate: false,
            }
        );
    }, []);

    React.useEffect(() => {
        if (values.type && values.symbol && values.durationtype) {
            // Set loading state to true before API call
            quick_strategy.setOptionsLoading(true);
            debounceChange(values);

            // Add cleanup function to prevent loading state from getting stuck
            return () => {
                // Cancel the debounced function call
                debounceChange.clear();
                // Reset loading state in case component unmounts before debounced function executes
                quick_strategy.setOptionsLoading(false);
            };
        }
    }, [
        values.stake,
        values.type,
        values.symbol,
        values.durationtype,
        values.duration,
        client?.currency,
        values,
        debounceChange,
    ]);

    React.useEffect(() => {
        setFieldError('stake', undefined);
    }, [values.stake]);

    const handleChange = (value: string) => {
        setFieldValue?.(name, value);
        setValue(name, value);
    };

    const key = `qs-contract-type-${name}`;

    return (
        <div className='qs__form__field qs__form__field__input no-top-spacing'>
            <Field name={name} key={key} id={key}>
                {({ field }: FieldProps) => {
                    const selected_item = list?.find(item => item?.value === field?.value);
                    if (!isDesktop) {
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
                            data-testid='dt_qs_contract_type'
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
                        />
                    );
                }}
            </Field>
        </div>
    );
});

export default ContractTypes;
