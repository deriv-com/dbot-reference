import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { generateOAuthURL, standalone_routes } from '@/components/shared';
import Button from '@/components/shared_ui/button';
import useActiveAccount from '@/hooks/api/account/useActiveAccount';
import { useOauth2 } from '@/hooks/auth/useOauth2';
import { useApiBase } from '@/hooks/useApiBase';
import { useLogout } from '@/hooks/useLogout';
import { useStore } from '@/hooks/useStore';
import { navigateToTransfer } from '@/utils/transfer-utils';
import { Localize, useTranslations } from '@deriv-com/translations';
import { Header, useDevice, Wrapper } from '@deriv-com/ui';
import { AppLogo } from '../app-logo';
import AccountsInfoLoader from './account-info-loader';
import AccountSwitcher from './account-switcher';
import MenuItems from './menu-items';
import MobileMenu from './mobile-menu';
import './header.scss';

type TAppHeaderProps = {
    isAuthenticating?: boolean;
};

const AppHeader = observer(({ isAuthenticating }: TAppHeaderProps) => {
    const { isDesktop } = useDevice();
    const { isAuthorizing, isAuthorized, activeLoginid, setIsAuthorizing, authData } = useApiBase();
    const { client } = useStore() ?? {};
    const [authTimeout, setAuthTimeout] = useState(false);
    const is_account_regenerating = client?.is_account_regenerating || false;

    const { data: activeAccount } = useActiveAccount({
        allBalanceData: client?.all_accounts_balance,
        directBalance: client?.balance,
    });
    const { is_virtual } = client ?? {};

    // Get currency from API base instead of client store
    const currency = authData?.currency || '';
    const { localize } = useTranslations();

    const { isSingleLoggingIn } = useOauth2({ handleLogout: async () => client?.logout(), client });
    const handleLogout = useLogout();

    // Handle direct URL access with token
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const account_id = urlParams.get('account_id');

        // If there's a token in the URL, set authorizing to true
        if (account_id) {
            setIsAuthorizing(true);
        }
    }, [setIsAuthorizing]);

    // Add fallback timeout to show login button if auth never fires
    useEffect(() => {
        const timer = setTimeout(() => {
            // If still authorizing after 10 seconds and no activeLoginid, show login button
            if (isAuthorizing && !activeLoginid) {
                setAuthTimeout(true);
                setIsAuthorizing(false);
            }
        }, 5000); // 5 second timeout

        // Clear timeout if user gets authenticated or if not authorizing
        if (activeLoginid || !isAuthorizing) {
            setAuthTimeout(false);
            clearTimeout(timer);
        }

        return () => clearTimeout(timer);
    }, [isAuthorizing, activeLoginid, setIsAuthorizing]);

    // [AI]
    const handleLogin = useCallback(async () => {
        try {
            // Set authorizing state immediately when login is clicked
            setIsAuthorizing(true);
            
            // Generate OAuth URL with CSRF token and PKCE parameters
            const oauthUrl = await generateOAuthURL();
            
            if (oauthUrl) {
                // Redirect to OAuth URL
                window.location.replace(oauthUrl);
            } else {
                console.error('Failed to generate OAuth URL');
                setIsAuthorizing(false);
            }
        } catch (error) {
            console.error('Login redirection failed:', error);
            // Reset authorizing state if redirection fails
            setIsAuthorizing(false);
        }
    }, [setIsAuthorizing]);
    // [/AI]

    const renderAccountSection = useCallback(
        (position: 'left' | 'right' = 'right') => {
            // Show account switcher and logout when user is fully authenticated
            if (activeLoginid && !is_account_regenerating) {
                if (position === 'left' && !isDesktop) {
                    // For mobile left section - only account switcher
                    return (
                        <div className='auth-actions'>
                            <div className='account-info'>
                                <AccountSwitcher activeAccount={activeAccount} />
                            </div>
                        </div>
                    );
                } else if (position === 'right') {
                    // For right section - transfer button (and account switcher on desktop)
                    return (
                        <div className='auth-actions'>
                            {isDesktop && (
                                <div className='account-info'>
                                    <AccountSwitcher activeAccount={activeAccount} />
                                </div>
                            )}
                            <Button
                                primary
                                disabled={client?.is_logging_out || !authData?.currency}
                                onClick={() => {
                                    const transferCurrency = authData?.currency;
                                    if (!transferCurrency) {
                                        console.error('No currency available for transfer');
                                        return;
                                    }
                                    // Navigate to transfer page
                                    navigateToTransfer(transferCurrency);
                                }}
                            >
                                <Localize i18n_default_text='Transfer' />
                            </Button>
                        </div>
                    );
                }
            }
            // Show login button when not authorizing, or when auth timeout occurred
            else if (
                position === 'right' &&
                ((!is_account_regenerating && !isAuthorizing && !activeLoginid) || authTimeout)
            ) {
                return (
                    <div className='auth-actions'>
                        <Button tertiary onClick={handleLogin}>
                            <Localize i18n_default_text='Log in' />
                        </Button>
                    </div>
                );
            }
            // Default: Show loader during loading states or when authorizing
            else if (position === 'right') {
                return <AccountsInfoLoader isLoggedIn isMobile={!isDesktop} speed={3} />;
            }

            return null;
        },
        [
            isAuthenticating,
            isAuthorizing,
            isSingleLoggingIn,
            isDesktop,
            activeLoginid,
            isAuthorized,
            standalone_routes,
            client,
            currency,
            localize,
            activeAccount,
            is_virtual,
            handleLogout,
            authTimeout,
            is_account_regenerating,
        ]
    );

    if (client?.should_hide_header) return null;

    return (
        <>
            <Header
                className={clsx('app-header', {
                    'app-header--desktop': isDesktop,
                    'app-header--mobile': !isDesktop,
                })}
            >
                <Wrapper variant='left'>
                    <MobileMenu onLogout={handleLogout} />
                    <AppLogo />
                    {isDesktop ? <MenuItems /> : renderAccountSection('left')}
                </Wrapper>
                <Wrapper variant='right'>{renderAccountSection('right')}</Wrapper>
            </Header>
        </>
    );
});

export default AppHeader;
