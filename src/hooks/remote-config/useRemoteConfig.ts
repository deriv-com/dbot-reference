// Stub implementation of useRemoteConfig - replaces Growthbook/Analytics remote config
// All feature flags are disabled by default
// Third-party developers can implement their own feature flag system if needed
// See migrate-docs/ANALYTICS_IMPLEMENTATION_GUIDE.md for more information

type TRemoteConfigData = {
    cs_chat_livechat: boolean;
    cs_chat_intercom: boolean;
    marketing_growthbook: boolean;
    tracking_rudderstack: boolean;
    tracking_posthog: boolean;
    [key: string]: boolean;
};

const DEFAULT_CONFIG: TRemoteConfigData = {
    cs_chat_livechat: false,
    cs_chat_intercom: false,
    marketing_growthbook: false,
    tracking_rudderstack: false,
    tracking_posthog: false,
};

/**
 * Stub hook that returns default remote config values
 * All feature flags are disabled by default
 *
 * @param _shouldLoad - Ignored parameter for compatibility
 * @returns Object with data property containing feature flag values
 */
const useRemoteConfig = (_shouldLoad?: boolean): { data: TRemoteConfigData } => {
    return {
        data: DEFAULT_CONFIG,
    };
};

export default useRemoteConfig;
