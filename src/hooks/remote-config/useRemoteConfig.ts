// Remote config hook stub
// Add your own feature flags or remote configuration here as needed
// Example:
//   type TRemoteConfigData = { my_feature_flag: boolean };
//   const DEFAULT_CONFIG: TRemoteConfigData = { my_feature_flag: false };

type TRemoteConfigData = {
    [key: string]: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const useRemoteConfig = (_shouldLoad?: boolean): { data: TRemoteConfigData } => {
    return {
        data: {},
    };
};

export default useRemoteConfig;
