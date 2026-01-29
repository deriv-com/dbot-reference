import { useMemo } from 'react';
import { isVirtualAccount } from '@/analytics/utils';
import { CurrencyIcon } from '@/components/currency/currency-icon';
import { addComma, getDecimalPlaces } from '@/components/shared';
import { useApiBase } from '@/hooks/useApiBase';
import { Balance } from '@deriv/api-types';

/** A custom hook that returns the account object for the current active account. */
const useActiveAccount = ({
    allBalanceData,
    directBalance,
}: {
    allBalanceData: Balance | null;
    directBalance?: string;
}) => {
    const { accountList, activeLoginid } = useApiBase();

    const activeAccount = useMemo(
        () => accountList?.find(account => account.loginid === activeLoginid),
        [activeLoginid, accountList]
    );

    const currentBalanceData = allBalanceData?.accounts?.[activeAccount?.loginid ?? ''];

    const modifiedAccount = useMemo(() => {
        if (!activeAccount) return undefined;

        // Use centralized utility to determine if demo account
        const isVirtual = isVirtualAccount(activeAccount.loginid);

        return {
            ...activeAccount,
            balance: currentBalanceData?.balance
                ? addComma(currentBalanceData.balance.toFixed(getDecimalPlaces(currentBalanceData.currency)))
                : directBalance
                  ? addComma(parseFloat(directBalance).toFixed(getDecimalPlaces(activeAccount.currency)))
                  : addComma(parseFloat('0').toFixed(getDecimalPlaces(activeAccount.currency))),
            currencyLabel: isVirtual ? 'Demo' : activeAccount?.currency,
            icon: <CurrencyIcon currency={activeAccount?.currency?.toLowerCase()} isVirtual={isVirtual} />,
            isVirtual: isVirtual,
            isActive: activeAccount?.loginid === activeLoginid,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeAccount, activeLoginid, allBalanceData, directBalance]);

    return {
        /** User's current active account. */
        data: modifiedAccount,
    };
};

export default useActiveAccount;
