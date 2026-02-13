import config_data from '../../../../../brand.config.json';

type TPlatform = {
    name: string;
    logo: string;
};

export const getBrandWebsiteName = () => {
    return config_data.domain_name;
};

export const getPlatformConfig = (): TPlatform => {
    return config_data.platform;
};

export const getPlatformName = () => {
    return config_data.platform.name;
};
