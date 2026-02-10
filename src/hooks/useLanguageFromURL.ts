import { useEffect } from 'react';
import { FILTERED_LANGUAGES } from '@/utils/languages';
import { useTranslations } from '@deriv-com/translations';

/**
 * Custom hook to handle language switching from URL parameter
 *
 * This hook:
 * 1. Reads 'lang' parameter from URL
 * 2. Falls back to localStorage if no URL parameter
 * 3. Validates against supported languages
 * 4. Switches to the language and removes the parameter from URL
 * 5. Defaults to 'EN' for unsupported languages
 *
 * @example
 * ```tsx
 * // In your component
 * useLanguageFromURL();
 *
 * // URL: ?lang=es - switches to Spanish
 * // URL: ?lang=invalid - defaults to English
 * ```
 */
export const useLanguageFromURL = () => {
    const { switchLanguage } = useTranslations();

    useEffect(() => {
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
};
