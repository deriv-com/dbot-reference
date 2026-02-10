// Updated to use brand configuration from brand.config.json
// Logo is now customizable for white-labeling
import brandConfig from '@/../brand.config.json';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import { BrandLogo } from './BrandLogo';
import './app-logo.scss';

export const AppLogo = () => {
    const { isDesktop } = useDevice();

    // Get logo configuration from brand.config.json
    const logoConfig = brandConfig.platform.logo;
    const logoUrl = logoConfig.link_url || '/';

    // Only render the logo on desktop screens
    if (!isDesktop) return null;

    return (
        <a href={logoUrl} className='app-header__logo' aria-label={localize('Home')}>
            {/* [AI] Use configurable brand logo from brand.config.json */}
            <BrandLogo width={120} height={32} fill='var(--text-general)' />
            {/* [/AI] */}
        </a>
    );
};
