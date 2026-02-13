import config_data from '../../../../../brand.config.json';

const domain_url = config_data.brand_domain;

export const brand_urls = Object.freeze({
    BRAND_HOST_NAME: domain_url,
    BRAND_PRODUCTION: `https://${domain_url}`,
    BRAND_PRODUCTION_EU: `https://eu.${domain_url}`,
});
