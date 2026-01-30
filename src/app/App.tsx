import { initSurvicate } from '../public-path';
import { lazy, Suspense } from 'react';
import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import ChunkLoader from '@/components/loader/chunk-loader';
import LocalStorageSyncWrapper from '@/components/localStorage-sync-wrapper';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { crypto_currencies_display_order, fiat_currencies_display_order } from '@/components/shared';
import { clearCSRFToken,validateCSRFToken } from '@/components/shared/utils/config/config';
import { StoreProvider } from '@/hooks/useStore';
import Endpoint from '@/pages/endpoint';
import { TAuthData } from '@/types/api-types';
import { clearAuthData } from '@/utils/auth-utils';
import { FILTERED_LANGUAGES } from '@/utils/languages';
import { initializeI18n, localize, TranslationProvider, useTranslations } from '@deriv-com/translations';
import CoreStoreProvider from './CoreStoreProvider';
import './app-root.scss';

const Layout = lazy(() => import('../components/layout'));
const AppRoot = lazy(() => import('./app-root'));

const { TRANSLATIONS_CDN_URL, R2_PROJECT_NAME, CROWDIN_BRANCH_NAME } = process.env;
const i18nInstance = initializeI18n({
    cdnUrl: `${TRANSLATIONS_CDN_URL || 'https://translations.deriv.com'}/${R2_PROJECT_NAME}/${CROWDIN_BRANCH_NAME}`,
});

// Component to handle language URL parameter
const LanguageHandler = ({ children }: { children: React.ReactNode }) => {
    const { switchLanguage } = useTranslations();

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        let langParam = urlParams.get('lang');

        // If no URL param, check localStorage
        if (!langParam) {
            const storedLang = localStorage.getItem('i18n_language');
            if (storedLang) {
                try {
                    // Try to parse as JSON first (in case it's stored as JSON string)
                    langParam = JSON.parse(storedLang);
                } catch {
                    // If parsing fails, use the raw value
                    langParam = storedLang;
                }
            }
        }

        if (langParam) {
            // Convert to uppercase to match our language codes
            const langCodeCandidate = langParam.toUpperCase();

            // Use FILTERED_LANGUAGES to check supported languages
            const supportedLangCodes = FILTERED_LANGUAGES.map(lang => lang.code);

            // Redirect any unsupported language to EN (English)
            if (!supportedLangCodes.includes(langCodeCandidate)) {
                try {
                    switchLanguage('EN');
                    // Remove lang parameter after processing to avoid URL pollution
                    const url = new URL(window.location.href);
                    url.searchParams.delete('lang');
                    window.history.replaceState({}, '', url.toString());
                } catch (error) {
                    console.error('Failed to switch language:', error);
                }
                return;
            }

            // If language is supported, switch to it
            const langCode = langCodeCandidate as (typeof FILTERED_LANGUAGES)[number]['code'];
            try {
                switchLanguage(langCode);
                // Remove lang parameter after processing to avoid URL pollution
                const url = new URL(window.location.href);
                url.searchParams.delete('lang');
                window.history.replaceState({}, '', url.toString());
            } catch (error) {
                console.error('Failed to switch language:', error);
            }
        }
    }, [switchLanguage]);

    return <>{children}</>;
};

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            path='/'
            element={
                <Suspense
                    fallback={<ChunkLoader message={localize('Please wait while we connect to the server...')} />}
                >
                    <TranslationProvider defaultLang='EN' i18nInstance={i18nInstance}>
                        <LanguageHandler>
                            <StoreProvider>
                                <LocalStorageSyncWrapper>
                                    <RoutePromptDialog />
                                    <CoreStoreProvider>
                                        <Layout />
                                    </CoreStoreProvider>
                                </LocalStorageSyncWrapper>
                            </StoreProvider>
                        </LanguageHandler>
                    </TranslationProvider>
                </Suspense>
            }
        >
            {/* All child routes will be passed as children to Layout */}
            <Route index element={<AppRoot />} />
            <Route path='endpoint' element={<Endpoint />} />
        </Route>
    )
);

function App() {
    // [AI]
    // Validate CSRF token on app initialization (for OAuth callback flow)
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const csrfTokenFromUrl = urlParams.get('state');
        
        // Only validate if we have a state parameter (OAuth callback scenario)
        if (csrfTokenFromUrl) {
            if (!validateCSRFToken(csrfTokenFromUrl)) {
                console.error('CSRF token validation failed - potential security threat');
                clearAuthData();
                // Redirect to home page without the state parameter
                window.location.replace(window.location.origin);
                return;
            }
            // Clear CSRF token after successful validation
            clearCSRFToken();
            
            // Remove state parameter from URL after validation
            const url = new URL(window.location.href);
            url.searchParams.delete('state');
            window.history.replaceState({}, '', url.toString());
        }
    }, []);
    // [/AI]

    React.useEffect(() => {
        // Use the invalid token handler hook to automatically retrigger OIDC authentication
        // when an invalid token is detected and the cookie logged state is true

        initSurvicate();
        window?.dataLayer?.push({ event: 'page_load' });
        return () => {
            // Clean up the invalid token handler when the component unmounts
            const survicate_box = document.getElementById('survicate-box');
            if (survicate_box) {
                survicate_box.style.display = 'none';
            }
        };
    }, []);

    React.useEffect(() => {
        const accounts_list = localStorage.getItem('accountsList');
        const client_accounts = localStorage.getItem('clientAccounts');
        const url_params = new URLSearchParams(window.location.search);
        const account_currency = url_params.get('account');
        const validCurrencies = [...fiat_currencies_display_order, ...crypto_currencies_display_order];

        const is_valid_currency = account_currency && validCurrencies.includes(account_currency?.toUpperCase());

        if (!accounts_list || !client_accounts) return;

        try {
            const parsed_accounts = JSON.parse(accounts_list);
            const parsed_client_accounts = JSON.parse(client_accounts) as TAuthData['account_list'];

            const updateLocalStorage = (token: string, loginid: string) => {
                localStorage.setItem('authToken', token);
                localStorage.setItem('active_loginid', loginid);
            };

            // Handle demo account
            if (account_currency?.toUpperCase() === 'DEMO') {
                const demo_account = Object.entries(parsed_accounts).find(([key]) => key.startsWith('VR'));

                if (demo_account) {
                    const [loginid, token] = demo_account;
                    updateLocalStorage(String(token), loginid);
                    return;
                }
            }

            // Handle real account with valid currency
            if (account_currency?.toUpperCase() !== 'DEMO' && is_valid_currency) {
                const real_account = Object.entries(parsed_client_accounts).find(
                    ([loginid, account]) =>
                        !loginid.startsWith('VR') && account.currency.toUpperCase() === account_currency?.toUpperCase()
                );

                if (real_account) {
                    const [loginid, account] = real_account;
                    if ('token' in account) {
                        updateLocalStorage(String(account?.token), loginid);
                    }
                    return;
                }
            }
        } catch (e) {
            console.warn('Error', e); // eslint-disable-line no-console
        }
    }, []);

    return <RouterProvider router={router} />;
}

export default App;
