// Updated to use brand configuration for footer elements visibility
// Controls language settings and theme toggle via brand.config.json
import brandConfig from '@/../brand.config.json';
import { useApiBase } from '@/hooks/useApiBase';
import useModalManager from '@/hooks/useModalManager';
import { getActiveTabUrl } from '@/utils/getActiveTabUrl';
import { FILTERED_LANGUAGES } from '@/utils/languages';
import { useTranslations } from '@deriv-com/translations';
import { DesktopLanguagesModal } from '@deriv-com/ui';
import ChangeTheme from './ChangeTheme';
import FullScreen from './FullScreen';
import LanguageSettings from './LanguageSettings';
import LogoutFooter from './LogoutFooter';
import NetworkStatus from './NetworkStatus';
import ServerTime from './ServerTime';
import './footer.scss';

const Footer = () => {
    const { currentLang = 'EN', localize, switchLanguage } = useTranslations();
    const { hideModal, isModalOpenFor, showModal } = useModalManager();
    const { isAuthorized } = useApiBase();

    // Get footer configuration from brand.config.json
    const enableLanguageSettings = brandConfig.platform.footer?.enable_language_settings ?? true;
    const enableThemeToggle = brandConfig.platform.footer?.enable_theme_toggle ?? true;

    const openLanguageSettingModal = () => showModal('DesktopLanguagesModal');
    return (
        <footer className='app-footer'>
            <FullScreen />
            {isAuthorized && <LogoutFooter />}
            {/* [AI] Conditionally render language settings based on brand config */}
            {enableLanguageSettings && (
                <>
                    <LanguageSettings openLanguageSettingModal={openLanguageSettingModal} />
                    <div className='app-footer__vertical-line' />
                </>
            )}
            {/* [/AI] */}
            {/* [AI] Conditionally render theme toggle based on brand config */}
            {enableThemeToggle && (
                <>
                    <ChangeTheme />
                    <div className='app-footer__vertical-line' />
                </>
            )}
            {/* [/AI] */}
            <ServerTime />
            <div className='app-footer__vertical-line' />
            <NetworkStatus />

            {/* [AI] Only show language modal if language settings are enabled */}
            {enableLanguageSettings && isModalOpenFor('DesktopLanguagesModal') && (
                <DesktopLanguagesModal
                    headerTitle={localize('Select Language')}
                    isModalOpen
                    languages={FILTERED_LANGUAGES}
                    onClose={hideModal}
                    onLanguageSwitch={code => {
                        try {
                            switchLanguage(code);
                            hideModal();
                            // Page reload is necessary because Blockly is outside React lifecycle
                            // and won't re-render with new language without full page refresh
                            // Use replace() to navigate to the active tab URL which will reload the page
                            window.location.replace(getActiveTabUrl());
                        } catch (error) {
                            console.error('Failed to switch language:', error);
                            hideModal();
                        }
                    }}
                    selectedLanguage={currentLang}
                />
            )}
            {/* [/AI] */}
        </footer>
    );
};

export default Footer;
