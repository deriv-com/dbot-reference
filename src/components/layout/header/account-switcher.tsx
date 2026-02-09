// Removed unused React import - React 17+ JSX transform doesn't require it
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { getCurrencyDisplayCode } from '@/components/shared';
import Text from '@/components/shared_ui/text';
import { Localize } from '@deriv-com/translations';
import { TAccountSwitcher } from './common/types';
import AccountInfoWrapper from './account-info-wrapper';
import './account-switcher.scss';

const AccountSwitcher = observer(({ activeAccount }: TAccountSwitcher) => {
    if (!activeAccount) return null;

    const { currency, isVirtual, balance } = activeAccount;
    const is_disabled = false; // Since the original had isDisabled={true}, we keep it non-interactive

    return (
        <div className='acc-info__wrapper'>
            <AccountInfoWrapper is_disabled={is_disabled}>
                <div
                    data-testid='dt_acc_info'
                    id='dt_core_account-info_acc-info'
                    className={classNames('acc-info', {
                        'acc-info--is-virtual': isVirtual,
                        'acc-info--is-disabled': is_disabled,
                    })}
                >
                    <span className='acc-info__id'></span>
                    <div className='acc-info__content'>
                        <div className='acc-info__account-type-header'>
                            <Text as='p' size='xxxs' className='acc-info__account-type'>
                                {isVirtual ? 'Demo account' : 'Real account'}
                            </Text>
                        </div>
                        {(typeof balance !== 'undefined' || !currency) && (
                            <div className='acc-info__balance-section'>
                                <p
                                    data-testid='dt_balance'
                                    className={classNames('acc-info__balance', {
                                        'acc-info__balance--no-currency': !currency && !isVirtual,
                                    })}
                                >
                                    {!currency ? (
                                        <Localize i18n_default_text='No currency assigned' />
                                    ) : (
                                        `${balance} ${getCurrencyDisplayCode(currency)}`
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </AccountInfoWrapper>
        </div>
    );
});

export default AccountSwitcher;
