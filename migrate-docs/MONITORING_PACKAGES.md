# Monitoring & Analytics Packages Configuration Guide

This document provides instructions for third-party developers on how to configure optional monitoring and analytics packages that have been removed from the base application to reduce bundle size and dependencies.

## Overview

The following packages have been removed as they are not essential for core functionality:

1. **@datadog/browser-rum** - Real User Monitoring (RUM) and session replay
2. **trackjs** - Error tracking and monitoring
3. **@deriv-com/analytics** - User behavior analytics (Rudderstack)

These packages can be re-enabled on demand if you need monitoring, error tracking, or analytics capabilities.

---

## 1. Datadog RUM (Real User Monitoring)

### Purpose

- Session replay and recording
- Performance monitoring
- User interaction tracking
- Resource and long task tracking

### Installation

```bash
npm install @datadog/browser-rum@^5.31.1
```

### Configuration

#### Step 1: Create the Datadog utility file

Create `src/utils/datadog.ts`:

```typescript
import { datadogRum } from '@datadog/browser-rum';

const getConfigValues = (is_production: boolean) => {
    if (is_production) {
        return {
            service: 'your-app.domain.com',
            version: `v${process.env.REF_NAME}`,
            sessionReplaySampleRate: Number(process.env.DATADOG_SESSION_REPLAY_SAMPLE_RATE ?? 1),
            sessionSampleRate: Number(process.env.DATADOG_SESSION_SAMPLE_RATE ?? 10),
            env: 'production',
            applicationId: process.env.DATADOG_APPLICATION_ID ?? '',
            clientToken: process.env.DATADOG_CLIENT_TOKEN ?? '',
        };
    }
    return {
        service: 'staging-your-app.domain.com',
        version: `v${process.env.REF_NAME}`,
        sessionReplaySampleRate: 0,
        sessionSampleRate: 100,
        env: 'staging',
        applicationId: process.env.DATADOG_APPLICATION_ID ?? '',
        clientToken: process.env.DATADOG_CLIENT_TOKEN ?? '',
    };
};

const initDatadog = (is_datadog_enabled: boolean) => {
    if (!is_datadog_enabled) return;
    if (process.env.APP_ENV === 'production' || process.env.APP_ENV === 'staging') {
        const is_production = process.env.APP_ENV === 'production';
        const {
            service,
            version,
            sessionReplaySampleRate,
            sessionSampleRate,
            env,
            applicationId = '',
            clientToken = '',
        } = getConfigValues(is_production) ?? {};

        datadogRum.init({
            service,
            version,
            sessionReplaySampleRate,
            sessionSampleRate,
            env,
            applicationId,
            clientToken,
            site: 'datadoghq.com',
            trackUserInteractions: true,
            trackResources: true,
            trackLongTasks: true,
            defaultPrivacyLevel: 'mask-user-input',
            enableExperimentalFeatures: ['clickmap'],
        });
    }
};

export default initDatadog;
```

#### Step 2: Initialize in your app

In `src/app/app-content.jsx`, add:

```javascript
import initDatadog from '@/utils/datadog';

// Inside your component's useEffect:
useEffect(() => {
    initDatadog(true); // Set to false to disable
}, []);
```

#### Step 3: Environment Variables

Add to your `.env` file:

```bash
DATADOG_APPLICATION_ID=your_application_id
DATADOG_CLIENT_TOKEN=your_client_token
DATADOG_SESSION_REPLAY_SAMPLE_RATE=1
DATADOG_SESSION_SAMPLE_RATE=10
```

### Getting Datadog Credentials

1. Sign up at [Datadog](https://www.datadoghq.com/)
2. Navigate to **UX Monitoring** → **RUM Applications**
3. Create a new application
4. Copy the **Application ID** and **Client Token**

---

## 2. TrackJS (Error Tracking)

### Purpose

- JavaScript error tracking
- User session tracking
- Error context and stack traces
- Production error monitoring

### Installation

```bash
npm install trackjs@^3.10.4
```

### Configuration

#### Step 1: Create the TrackJS hook

Create `src/hooks/useTrackjs.ts`:

```typescript
import { TrackJS } from 'trackjs';

const { TRACKJS_TOKEN } = process.env;

/**
 * Custom hook to initialize TrackJS.
 * @returns {Object} An object containing the `init` function.
 */
const useTrackjs = () => {
    const isProduction = process.env.APP_ENV === 'production';
    const trackjs_version = process.env.REF_NAME ?? 'undefined';

    const initTrackJS = (loginid: string) => {
        try {
            if (!TrackJS.isInstalled()) {
                TrackJS.install({
                    application: 'your-application-name',
                    dedupe: false,
                    enabled: isProduction,
                    token: TRACKJS_TOKEN!,
                    userId: loginid,
                    version:
                        (document.querySelector('meta[name=version]') as HTMLMetaElement)?.content ?? trackjs_version,
                });
            }
        } catch (error) {
            console.error('Failed to initialize TrackJS', error);
        }
    };

    return { initTrackJS };
};

export default useTrackjs;
```

#### Step 2: Initialize in your app

In `src/app/app-content.jsx`:

```javascript
import useTrackjs from '@/hooks/useTrackjs';

// Inside your component:
const { initTrackJS } = useTrackjs();

// Initialize with user login ID
useEffect(() => {
    if (client?.loginid) {
        initTrackJS(client.loginid);
    }
}, [client?.loginid]);
```

#### Step 3: Environment Variables

Add to your `.env` file:

```bash
TRACKJS_TOKEN=your_trackjs_token
```

### Getting TrackJS Token

1. Sign up at [TrackJS](https://trackjs.com/)
2. Create a new application
3. Copy the **Application Token** from settings

---

## 3. Deriv Analytics (@deriv-com/analytics with Rudderstack & Growthbook)

### Purpose

- User behavior tracking with Rudderstack
- Event analytics
- Feature flags and A/B testing with Growthbook
- Feature usage monitoring
- Conversion tracking
- Business intelligence

### What Was Removed

The following have been completely removed from the codebase:

1. **`@deriv-com/analytics` package** - Analytics initialization and event tracking
2. **Growthbook integration** - Feature flags and A/B testing
3. **`src/utils/analytics/` directory** - All analytics initialization code
4. **`src/hooks/growthbook/` directory** - All Growthbook-related hooks
5. **Analytics event tracking** - All event tracking calls throughout components

### Stub Implementation

A stub implementation of `useRemoteConfig` has been provided at `src/hooks/remote-config/useRemoteConfig.ts` that returns disabled feature flags by default. This allows the application to run without the analytics dependency while maintaining compatibility with existing code.

**Files using the stub:**
- `src/hooks/useIntercom.ts` - Chat availability check
- `src/components/chat/useLiveChat.ts` - LiveChat integration

### Installation

```bash
npm install @deriv-com/analytics@^1.35.1
```

### Quick Start

For a comprehensive implementation guide with detailed code examples, see:

**📚 [ANALYTICS_IMPLEMENTATION_GUIDE.md](./ANALYTICS_IMPLEMENTATION_GUIDE.md)**

The detailed guide includes:

- Complete setup instructions
- Full code examples for all analytics files
- Component integration examples
- Event tracking patterns
- Testing procedures
- Troubleshooting tips

### Summary

1. **Initialize Analytics**: Create `src/utils/analytics/index.ts` and call it in `src/main.tsx`
2. **Create Analytics Structure**: Set up `src/analytics/` directory with tracking files
3. **Define Events**: Create event tracking functions for different features
4. **Integrate in Components**: Add analytics calls where user actions occur
5. **Test**: Verify events in Rudderstack dashboard

### Environment Variables

Add to your `.env` file:

```bash
RUDDERSTACK_KEY=your_rudderstack_write_key
REMOTE_CONFIG_URL=https://your-remote-config-url.com
APP_ENV=production
```

### Getting Rudderstack Credentials

1. Sign up at [Rudderstack](https://www.rudderstack.com/)
2. Create a new source (JavaScript)
3. Copy the **Write Key** and **Data Plane URL**

### Key Integration Points

Components that commonly need analytics:

- Dashboard cards and navigation
- Bot builder actions (load, save, run)
- Chart interactions (type changes, indicators)
- Quick strategy form submissions
- Tutorial navigation and searches
- Modal opens/closes

See the [detailed guide](./ANALYTICS_IMPLEMENTATION_GUIDE.md) for complete implementation examples.

### Recreating Growthbook Feature Flags

If you need feature flags functionality:

1. **Install the Analytics package** (includes Growthbook):
   ```bash
   npm install @deriv-com/analytics
   ```

2. **Replace stub with real implementation**: Delete `src/hooks/remote-config/useRemoteConfig.ts` and recreate the original Growthbook hooks in `src/hooks/growthbook/`:
   - `useRemoteConfig.ts` - Fetches remote configuration
   - `useGrowthbookGetFeatureValue.ts` - Gets feature flag values
   - `useIsGrowthbookLoaded.ts` - Checks if Growthbook is loaded

3. **Update imports**: Change all imports from `@/hooks/remote-config/useRemoteConfig` back to `@/hooks/growthbook/useRemoteConfig`

4. **Re-enable initialization**: Uncomment the `AnalyticsInitializer()` call in `src/main.tsx` and recreate `src/utils/analytics/index.ts` with proper Growthbook configuration.

See the Analytics Implementation Guide for complete setup instructions.

---

## Implementation Checklist

### For Datadog:

- [ ] Install `@datadog/browser-rum` package
- [ ] Create `src/utils/datadog.ts`
- [ ] Add initialization in `src/app/app-content.jsx`
- [ ] Set environment variables
- [ ] Test in staging environment

### For TrackJS:

- [ ] Install `trackjs` package
- [ ] Create `src/hooks/useTrackjs.ts`
- [ ] Add initialization in `src/app/app-content.jsx`
- [ ] Set environment variables
- [ ] Test error tracking

### For Analytics:

- [ ] Install `@deriv-com/analytics` package
- [ ] Import Analytics in required files
- [ ] Add tracking events where needed
- [ ] Set environment variables
- [ ] Test event tracking

---

## Testing

### Datadog

1. Open browser DevTools → Network tab
2. Look for requests to `datadoghq.com`
3. Check Datadog dashboard for session recordings

### TrackJS

1. Trigger an error in your app
2. Check TrackJS dashboard for error reports
3. Verify user session data

### Analytics

1. Trigger tracked events
2. Check Rudderstack dashboard
3. Verify events are being sent with correct properties

---

## Troubleshooting

### Datadog not initializing

- Verify `DATADOG_APPLICATION_ID` and `DATADOG_CLIENT_TOKEN` are set
- Check browser console for errors
- Ensure `APP_ENV` is set to 'production' or 'staging'

### TrackJS not tracking errors

- Verify `TRACKJS_TOKEN` is set
- Check that `isProduction` is true
- Ensure TrackJS.install() is called before errors occur

### Analytics events not sending

- Verify Rudderstack credentials
- Check browser console for network errors
- Ensure Analytics is initialized before tracking events

---

## Cost Considerations

- **Datadog**: Paid service, pricing based on sessions and data volume
- **TrackJS**: Paid service, pricing based on error volume
- **Rudderstack**: Free tier available, paid plans for higher volume

Consider your budget and monitoring needs before enabling these services.

---

## Removed Files Reference

The following files and directories were removed and can be recreated using the guides above:

### Monitoring Tools
- `src/utils/datadog.ts` - Datadog RUM initialization
- `src/hooks/useTrackjs.ts` - TrackJS error tracking hook

### Analytics & Growthbook (Completely Removed)
- `src/utils/analytics/` - **Entire directory removed**
  - `index.ts` - Analytics initialization with Rudderstack and Growthbook
- `src/hooks/growthbook/` - **Entire directory removed**
  - `useRemoteConfig.ts` - Remote config fetching
  - `useGrowthbookGetFeatureValue.ts` - Feature flag value getter
  - `useIsGrowthbookLoaded.ts` - Growthbook loading state checker
  - `remote_config.json` - Default remote config values
- Analytics event tracking removed from:
  - All component files throughout the codebase
  - `src/components/shared/services/performance-metrics-methods.ts`
  - `src/pages/dashboard/announcements/config.tsx`
  - And many other files (see git history for full list)

### Stub Implementations (Added for Compatibility)
- `src/hooks/remote-config/useRemoteConfig.ts` - Stub that returns disabled feature flags

---

## Support

For issues with:

- **Datadog**: https://docs.datadoghq.com/
- **TrackJS**: https://docs.trackjs.com/
- **Rudderstack**: https://www.rudderstack.com/docs/

---

**Last Updated**: 2026-02-09
**Version**: 2.0.0
