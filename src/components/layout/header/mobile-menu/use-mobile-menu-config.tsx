import { ComponentProps, ReactNode, useEffect, useMemo, useState } from 'react';
import { standalone_routes } from '@/components/shared';
import { useFirebaseCountriesConfig } from '@/hooks/firebase/useFirebaseCountriesConfig';
import useThemeSwitcher from '@/hooks/useThemeSwitcher';
import RootStore from '@/stores/root-store';
import { handleTraderHubRedirect } from '@/utils/traders-hub-redirect';
import { LabelPairedFileMdRegularIcon } from '@deriv/quill-icons/LabelPaired';
import { LegacyHomeNewIcon, LegacyLogout1pxIcon, LegacyTheme1pxIcon } from '@deriv/quill-icons/Legacy';
import { useTranslations } from '@deriv-com/translations';
import { ToggleSwitch } from '@deriv-com/ui';

export type TSubmenuSection = 'accountSettings' | 'cashier' | 'reports';

//IconTypes
type TMenuConfig = {
    LeftComponent: React.ElementType;
    RightComponent?: ReactNode;
    as: 'a' | 'button';
    href?: string;
    label: ReactNode;
    onClick?: () => void;
    removeBorderBottom?: boolean;
    submenu?: TSubmenuSection;
    target?: ComponentProps<'a'>['target'];
    isActive?: boolean;
}[];

const useMobileMenuConfig = (client?: RootStore['client'], onLogout?: () => void) => {
    const { localize, currentLang } = useTranslations();
    const { is_dark_mode_on, toggleTheme } = useThemeSwitcher();
    const { hubEnabledCountryList } = useFirebaseCountriesConfig();

    const [redirect_url_str, setRedirectUrlStr] = useState<null | string>(null);

    // Get current account information for dependency tracking
    const is_virtual = client?.is_virtual;
    const currency = client?.getCurrency?.();
    const is_logged_in = client?.is_logged_in;
    const client_residence = client?.residence;

    useEffect(() => {
        if (client?.is_logged_in) {
            const redirectParams = {
                product_type: 'tradershub' as const,
                has_wallet: false,
                is_virtual: client?.is_virtual,
                residence: client?.residence,
                hubEnabledCountryList,
            };
            setRedirectUrlStr(handleTraderHubRedirect(redirectParams));
        }
    }, [client?.is_virtual, client?.residence, hubEnabledCountryList, client?.is_logged_in]);

    const menuConfig = useMemo((): TMenuConfig[] => {
        // Create home URL with language parameter
        const homeUrl = currentLang
            ? `${standalone_routes.deriv_app}?lang=${currentLang.toUpperCase()}`
            : standalone_routes.deriv_app;

        return [
            [
                {
                    as: 'a',
                    label: localize('Home'),
                    LeftComponent: LegacyHomeNewIcon,
                    href: homeUrl,
                },
                client?.is_logged_in && {
                    as: 'button',
                    label: localize('Reports'),
                    LeftComponent: LabelPairedFileMdRegularIcon,
                    submenu: 'reports',
                    onClick: () => {},
                },
                {
                    as: 'button',
                    label: localize('Dark theme'),
                    LeftComponent: LegacyTheme1pxIcon,
                    RightComponent: <ToggleSwitch value={is_dark_mode_on} onChange={toggleTheme} />,
                },
            ].filter(Boolean) as TMenuConfig,
            [
                client?.is_logged_in &&
                    onLogout && {
                        as: 'button',
                        label: localize('Log out'),
                        LeftComponent: LegacyLogout1pxIcon,
                        onClick: onLogout,
                        removeBorderBottom: true,
                    },
            ].filter(Boolean) as TMenuConfig,
        ].filter(section => section.length > 0);
    }, [
        is_virtual,
        currency,
        is_logged_in,
        client_residence,
        client,
        onLogout,
        is_dark_mode_on,
        toggleTheme,
        localize,
        currentLang,
        redirect_url_str,
        hubEnabledCountryList,
    ]);

    return {
        config: menuConfig,
    };
};

export default useMobileMenuConfig;
