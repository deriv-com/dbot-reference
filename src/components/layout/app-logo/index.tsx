import { standalone_routes } from '@/components/shared';
import { LegacyHomeNewIcon } from '@deriv/quill-icons/Legacy';
import { localize, useTranslations } from '@deriv-com/translations';
import { Text, useDevice } from '@deriv-com/ui';
import './app-logo.scss';

export const AppLogo = () => {
    const { currentLang } = useTranslations();
    const { isDesktop } = useDevice();

    // Always go to the new home dashboard, regardless of login state
    // Logo now shows on both desktop and mobile
    // Add language parameter to the URL
    const logoUrl = currentLang
        ? `${standalone_routes.deriv_app}?lang=${currentLang.toUpperCase()}`
        : standalone_routes.deriv_app;

    // Only render the logo on desktop screens
    if (!isDesktop) return null;

    return (
        <a href={logoUrl} className='app-header__logo' aria-label={localize('Home')}>
            <LegacyHomeNewIcon iconSize='xs' fill='var(--text-general)' />
            <Text className='app-header__logo-text'>{localize('Home')}</Text>
        </a>
    );
};
