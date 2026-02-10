// Updated to use brand configuration for mobile menu elements visibility
// Controls language settings and theme toggle via brand.config.json
import { useState } from 'react';
import brandConfig from '@/../brand.config.json';
import useModalManager from '@/hooks/useModalManager';
// [AI] Import useStore to check if menu has items
import { useStore } from '@/hooks/useStore';
// [/AI]
import { getActiveTabUrl } from '@/utils/getActiveTabUrl';
import { FILTERED_LANGUAGES } from '@/utils/languages';
import { useTranslations } from '@deriv-com/translations';
import { Drawer, MobileLanguagesDrawer, useDevice } from '@deriv-com/ui';
import NetworkStatus from './../../footer/NetworkStatus';
import ServerTime from './../../footer/ServerTime';
import BackButton from './back-button';
import MenuContent from './menu-content';
import MenuHeader from './menu-header';
import ReportsSubmenu from './reports-submenu';
import ToggleButton from './toggle-button';
// [AI] Import hook to check if menu has items
import useMobileMenuConfig from './use-mobile-menu-config';
// [/AI]
import './mobile-menu.scss';

type TMobileMenuProps = {
    onLogout?: () => void;
};

const MobileMenu = ({ onLogout }: TMobileMenuProps) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const { currentLang = 'EN', localize, switchLanguage } = useTranslations();
    const { hideModal, isModalOpenFor, showModal } = useModalManager();
    const { isDesktop } = useDevice();
    // [AI] Get client from store to check menu items
    const { client } = useStore() ?? {};
    // [/AI]

    // Get mobile menu configuration from brand.config.json
    const enableLanguageSettings = brandConfig.platform.footer?.enable_language_settings ?? true;
    const enableThemeToggle = brandConfig.platform.footer?.enable_theme_toggle ?? true;

    // Check if menu has any items to determine if mobile menu should be shown
    const { hasMenuItems } = useMobileMenuConfig(client, onLogout, enableThemeToggle);

    const openDrawer = () => setIsDrawerOpen(true);
    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setActiveSubmenu(null);
    };

    const openSubmenu = (submenu: string) => setActiveSubmenu(submenu);
    const closeSubmenu = () => setActiveSubmenu(null);
    const openLanguageSetting = () => showModal('MobileLanguagesDrawer');
    const isLanguageSettingVisible = Boolean(isModalOpenFor('MobileLanguagesDrawer'));

    if (isDesktop) return null;
    // [AI] Hide mobile menu if there are no menu items to display
    if (!hasMenuItems) return null;
    // [/AI]
    return (
        <div className='mobile-menu'>
            <div className='mobile-menu__toggle'>
                <ToggleButton onClick={openDrawer} />
            </div>

            <Drawer isOpen={isDrawerOpen} onCloseDrawer={closeDrawer} width='29.5rem'>
                <Drawer.Header onCloseDrawer={closeDrawer}>
                    {/* [AI] Conditionally render language settings in header based on brand config */}
                    <MenuHeader
                        hideLanguageSetting={!enableLanguageSettings || isLanguageSettingVisible}
                        openLanguageSetting={openLanguageSetting}
                    />
                    {/* [/AI] */}
                </Drawer.Header>

                <Drawer.Content>
                    {/* [AI] Conditionally render language drawer based on brand config */}
                    {enableLanguageSettings && isLanguageSettingVisible ? (
                        <>
                            <div className='mobile-menu__back-btn'>
                                <BackButton buttonText={localize('Language')} onClick={hideModal} />
                            </div>

                            <MobileLanguagesDrawer
                                isOpen
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
                                wrapperClassName='mobile-menu__language-drawer'
                            />
                        </>
                    ) : activeSubmenu === 'reports' ? (
                        <>
                            <div className='mobile-menu__back-btn'>
                                <BackButton buttonText={localize('Reports')} onClick={closeSubmenu} />
                            </div>
                            <ReportsSubmenu />
                        </>
                    ) : (
                        <MenuContent
                            enableThemeToggle={enableThemeToggle}
                            onOpenSubmenu={openSubmenu}
                            onLogout={() => {
                                closeDrawer();
                                onLogout?.();
                            }}
                        />
                    )}
                    {/* [/AI] */}
                </Drawer.Content>

                <Drawer.Footer className='mobile-menu__footer'>
                    <ServerTime />
                    <NetworkStatus />
                </Drawer.Footer>
            </Drawer>
        </div>
    );
};

export default MobileMenu;
