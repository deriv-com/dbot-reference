import config_data from '../../../../../brand.config.json';

type TPlatform = {
    name: string;
    logo: string;
};

const isDomainAllowed = (domain_name: string) => {
    // This regex will match any official deriv production and testing domain names.
    // Allowed deriv domains: localhost, binary.sx, binary.com, deriv.com, deriv.be, deriv.me and their subdomains.
    return /^(((.*)\.)?(localhost:8444|pages.dev|binary\.(sx|com)|deriv.(com|me|be|dev)))$/.test(domain_name);
};

export const getBrandWebsiteName = () => {
    return config_data.domain_name;
};

export const getPlatformConfig = (): TPlatform => {
    const allowed_config_data = config_data.platform;

    if (!isDomainAllowed(window.location.host)) {
        // Remove all official platform logos if the app is hosted under unofficial domain
        allowed_config_data.logo = '';
    }

    return allowed_config_data;
};
