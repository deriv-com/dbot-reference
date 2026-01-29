// NOTE: Language codes use uppercase format (EN, AR, etc.) instead of standard ISO 639-1
// lowercase format (en, ar, etc.). This is a project convention for consistency with
// the translation system. Ensure i18n/translation systems correctly map these codes.
export const LANGUAGES = [
    {
        code: 'EN',
        displayName: 'English',
    },
    {
        code: 'AR',
        displayName: 'العربية',
    },
    {
        code: 'BN',
        displayName: 'বাংলা',
    },
    {
        code: 'DE',
        displayName: 'Deutsch',
    },
    {
        code: 'ES',
        displayName: 'Español',
    },
    {
        code: 'FR',
        displayName: 'Français',
    },
    {
        code: 'IT',
        displayName: 'Italiano',
    },
    {
        code: 'SW',
        displayName: 'Kiswahili',
    },
    {
        code: 'KM',
        displayName: 'ខ្មែរ',
    },
    {
        code: 'KO',
        displayName: '한국어',
    },
    {
        code: 'MN',
        displayName: 'Монгол',
    },
    {
        code: 'PL',
        displayName: 'Polski',
    },
    {
        code: 'PT',
        displayName: 'Português',
    },
    {
        code: 'RU',
        displayName: 'Русский',
    },
    {
        code: 'SI',
        displayName: 'සිංහල',
    },
    {
        code: 'TA',
        displayName: 'தமிழ்',
    },
    {
        code: 'TR',
        displayName: 'Türkçe',
    },
    {
        code: 'VI',
        displayName: 'Tiếng Việt',
    },
    {
        code: 'ZH_CN',
        displayName: '简体中文',
    },
    {
        code: 'ZH_TW',
        displayName: '繁體中文',
    },
];

// Available languages for the language switcher
// This filter exists to control which languages are shown in the UI, allowing for
// gradual rollout of new languages or temporary removal of languages if needed
//
// COMPLIANCE NOTE: The following languages have been excluded from V2 websites
// based on compliance recommendations:
// - KM (Khmer) - Compliance restriction
// - TR (Turkish) - Compliance restriction
// - UZ (Uzbek) - Compliance restriction
// - TH (Thai) - Not implemented, compliance restriction
// - ID (Indonesian) - Not implemented, compliance restriction
// - Burmese - Not implemented, compliance restriction
// - Tagalog/Filipino - Not implemented, compliance restriction
export const FILTERED_LANGUAGES = LANGUAGES.filter(lang =>
    [
        'EN',
        'ES',
        'FR',
        'PT',
        'AR',
        'IT',
        'RU',
        'VI',
        'ZH_CN',
        'ZH_TW',
        'DE',
        'BN',
        'SW',
        'KO',
        'PL',
        'SI',
        'TA',
        'MN',
    ].includes(lang.code)
);
