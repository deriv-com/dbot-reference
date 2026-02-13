import { brand_urls } from './constants';

let default_language: string;

export const reset = () => {
    // Reset function for test utilities
};

export const getUrlBase = (path = '') => {
    const l = window.location;

    if (!/^\/(br_)/.test(l.pathname)) return path;

    return `/${l.pathname.split('/')[1]}${/^\//.test(path) ? path : `/${path}`}`;
};

export const setUrlLanguage = (lang: string) => {
    default_language = lang;
};

export const getStaticUrl = (path = '', is_document = false, is_eu_url = false) => {
    const host = is_eu_url ? brand_urls.BRAND_PRODUCTION_EU : brand_urls.BRAND_PRODUCTION;
    let lang = default_language?.toLowerCase();

    if (lang && lang !== 'en') {
        lang = `/${lang}`;
    } else {
        lang = '';
    }

    const normalizePath = (p: string) => (p ? p.replace(/(^\/|\/$|[^a-zA-Z0-9-_./()#])/g, '') : '');

    if (is_document) return `${host}/${normalizePath(path)}`;

    if (host === brand_urls.BRAND_PRODUCTION && lang.includes('_')) {
        lang = lang.replace('_', '-');
    }

    return `${host}${lang}/${normalizePath(path)}`;
};
