import { useFormikContext } from 'formik';
import { observer } from 'mobx-react-lite';
import { rudderStackSendQsRunStrategyEvent } from '@/analytics/rudderstack-quick-strategy';
import { getAccountType, getDeviceType } from '@/analytics/utils';
import Button from '@/components/shared_ui/button';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import useQsSubmitHandler from '../form-wrappers/useQsSubmitHandler';
import { TFormValues } from '../types';
import { QsSteps } from './trade-constants';

type TMobileQSFooter = {
    current_step: QsSteps;
    setCurrentStep: (current_step: QsSteps) => void;
};

export const MobileQSFooter = observer(({ current_step, setCurrentStep }: TMobileQSFooter) => {
    const { quick_strategy } = useStore();
    const { selected_strategy } = quick_strategy;
    const { isValid, values } = useFormikContext<TFormValues>();
    const { handleSubmit } = useQsSubmitHandler();
    const is_verified_or_completed_step =
        current_step === QsSteps.StrategyVerified || current_step === QsSteps.StrategyCompleted;
    const is_selected_strategy_step = current_step === QsSteps.StrategySelect;

    const onRun = () => {
        // Get dynamic account type and device type
        const account_type = getAccountType();
        const device_type = getDeviceType();

        const eventParams: {
            form_values: TFormValues;
            selected_strategy: string;
            device_type?: string;
            account_type?: string;
        } = {
            form_values: values,
            selected_strategy,
            device_type,
        };

        // Only add account_type if it exists
        if (account_type) {
            eventParams.account_type = account_type;
        }

        rudderStackSendQsRunStrategyEvent(eventParams);
        handleSubmit();
    };

    const onBack = () => {
        setCurrentStep(QsSteps.StrategySelect);
    };

    return (
        <>
            {is_verified_or_completed_step && (
                <div className='qs__body__content__footer'>
                    <Button secondary disabled={is_selected_strategy_step} onClick={onBack}>
                        {localize('Back')}
                    </Button>
                    <Button
                        primary
                        data-testid='qs-run-button'
                        type='submit'
                        onClick={e => {
                            e.preventDefault();
                            onRun();
                        }}
                        disabled={!isValid || quick_strategy.is_options_loading}
                    >
                        {localize('Run')}
                    </Button>
                </div>
            )}
        </>
    );
});

export default MobileQSFooter;
