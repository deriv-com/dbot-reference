# Monitoring & Analytics Guide

Complete guide for setting up optional monitoring, error tracking, and analytics packages. These packages were removed from the base application to reduce bundle size — this guide shows how to re-enable them.

## Table of Contents

- [Overview](#overview)
- [Datadog RUM (Real User Monitoring)](#datadog-rum-real-user-monitoring)
- [TrackJS (Error Tracking)](#trackjs-error-tracking)
- [Rudderstack Analytics](#rudderstack-analytics)
  - [Installation](#analytics-installation)
  - [Initial Setup](#analytics-initial-setup)
  - [Creating Analytics Structure](#creating-analytics-structure)
  - [Event Tracking Examples](#event-tracking-examples)
  - [Component Integration](#component-integration)
- [Growthbook Feature Flags](#growthbook-feature-flags)
- [Implementation Checklist](#implementation-checklist)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Cost Considerations](#cost-considerations)

---

## Overview

The following packages are **optional** and not included in the base application:

| Package                  | Purpose                              | Category           |
| ------------------------ | ------------------------------------ | ------------------ |
| `@datadog/browser-rum`   | Session replay, performance monitoring | Monitoring       |
| `trackjs`                | JavaScript error tracking            | Error Tracking     |
| `@deriv-com/analytics`   | User behavior tracking (Rudderstack) | Analytics          |

### What Was Removed

- `src/utils/datadog.ts` - Datadog RUM initialization
- `src/hooks/useTrackjs.ts` - TrackJS error tracking hook
- `src/utils/analytics/` - Analytics initialization (entire directory)
- `src/hooks/growthbook/` - Growthbook feature flag hooks (entire directory)
- Analytics event tracking calls throughout all component files

### Stub Implementation

A stub `useRemoteConfig` hook exists at `src/hooks/remote-config/useRemoteConfig.ts` that returns disabled feature flags by default. This maintains compatibility with code that checks feature flags without requiring the analytics package.

---

## Datadog RUM (Real User Monitoring)

### Purpose

- Session replay and recording
- Performance monitoring (page load, API latency)
- User interaction tracking
- Resource and long task tracking

### Installation

```bash
npm install @datadog/browser-rum@^5.31.1
```

### Setup

#### Step 1: Create the Datadog utility

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
        const config = getConfigValues(is_production);

        datadogRum.init({
            ...config,
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

In your app content component (e.g., `src/app/app-content.tsx`):

```typescript
import initDatadog from '@/utils/datadog';

useEffect(() => {
    initDatadog(true);
}, []);
```

#### Step 3: Environment variables

Add to `.env`:

```bash
DATADOG_APPLICATION_ID=your_application_id
DATADOG_CLIENT_TOKEN=your_client_token
DATADOG_SESSION_REPLAY_SAMPLE_RATE=1
DATADOG_SESSION_SAMPLE_RATE=10
```

Add to `rsbuild.config.ts` `source.define`:

```typescript
'process.env.DATADOG_APPLICATION_ID': JSON.stringify(process.env.DATADOG_APPLICATION_ID),
'process.env.DATADOG_CLIENT_TOKEN': JSON.stringify(process.env.DATADOG_CLIENT_TOKEN),
'process.env.DATADOG_SESSION_REPLAY_SAMPLE_RATE': JSON.stringify(process.env.DATADOG_SESSION_REPLAY_SAMPLE_RATE),
'process.env.DATADOG_SESSION_SAMPLE_RATE': JSON.stringify(process.env.DATADOG_SESSION_SAMPLE_RATE),
```

### Getting Datadog Credentials

1. Sign up at [Datadog](https://www.datadoghq.com/)
2. Navigate to **UX Monitoring** > **RUM Applications**
3. Create a new application
4. Copy the **Application ID** and **Client Token**

---

## TrackJS (Error Tracking)

### Purpose

- JavaScript error tracking in production
- User session context for each error
- Error stack traces and context
- Error deduplication and grouping

### Installation

```bash
npm install trackjs@^3.10.4
```

### Setup

#### Step 1: Create the TrackJS hook

Create `src/hooks/useTrackjs.ts`:

```typescript
import { TrackJS } from 'trackjs';

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
                    token: process.env.TRACKJS_TOKEN!,
                    userId: loginid,
                    version:
                        (document.querySelector('meta[name=version]') as HTMLMetaElement)?.content ??
                        trackjs_version,
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

```typescript
import useTrackjs from '@/hooks/useTrackjs';

const { initTrackJS } = useTrackjs();

useEffect(() => {
    if (client?.loginid) {
        initTrackJS(client.loginid);
    }
}, [client?.loginid]);
```

#### Step 3: Environment variables

Add to `.env`:

```bash
TRACKJS_TOKEN=your_trackjs_token
```

### Getting TrackJS Token

1. Sign up at [TrackJS](https://trackjs.com/)
2. Create a new application
3. Copy the **Application Token** from settings

---

## Rudderstack Analytics

### Purpose

- User behavior tracking and event analytics
- Conversion tracking
- Feature usage monitoring
- Business intelligence data

### Analytics Installation

```bash
npm install @deriv-com/analytics@^1.35.1
```

### Analytics Initial Setup

#### Step 1: Create Analytics Initializer

Create `src/utils/analytics/index.ts`:

```typescript
import Cookies from 'js-cookie';
import { LocalStore, MAX_MOBILE_WIDTH } from '@/components/shared';
import { Analytics } from '@deriv-com/analytics';
import getCountry from '../getCountry';
import FIREBASE_INIT_DATA from '../remote_config.json';

export const AnalyticsInitializer = async () => {
    try {
        const savedAccountType = localStorage.getItem('account_type');
        const account_type = savedAccountType || 'demo';

        // Fetch remote config for feature flags
        const hasValidRemoteConfigUrl =
            process.env.REMOTE_CONFIG_URL &&
            process.env.REMOTE_CONFIG_URL !== '' &&
            process.env.REMOTE_CONFIG_URL !== 'undefined';

        let flags = FIREBASE_INIT_DATA;

        if (hasValidRemoteConfigUrl) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(process.env.REMOTE_CONFIG_URL!, {
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                if (response.ok) {
                    flags = await response.json();
                }
            } catch (fetchError) {
                console.warn('Remote config fetch error, using fallback data');
            }
        }

        const hasRudderStack = !!(process.env.RUDDERSTACK_KEY && flags?.tracking_rudderstack);

        if (hasRudderStack) {
            let ppc_campaign_cookies =
                (Cookies.get('utm_data') as unknown as Record<string, string>) || {
                    utm_source: 'no source',
                    utm_medium: 'no medium',
                    utm_campaign: 'no campaign',
                    utm_content: 'no content',
                };

            const config = {
                rudderstackKey: process.env.RUDDERSTACK_KEY!,
                growthbookOptions: {
                    disableCache: process.env.APP_ENV !== 'production',
                    attributes: {
                        account_type: account_type === 'null' ? 'unlogged' : account_type,
                        device_type: window.innerWidth <= MAX_MOBILE_WIDTH ? 'mobile' : 'desktop',
                        device_language: navigator?.language || 'en-EN',
                        country: await getCountry(),
                        utm_source: ppc_campaign_cookies?.utm_source,
                        utm_medium: ppc_campaign_cookies?.utm_medium,
                        utm_campaign: ppc_campaign_cookies?.utm_campaign,
                        utm_content: ppc_campaign_cookies?.utm_content,
                        domain: window.location.hostname,
                        url: window.location.href,
                    },
                },
            };

            await Analytics?.initialise(config);
        }
    } catch (error) {
        console.error('Analytics initializer error:', error);
    }
};
```

#### Step 2: Initialize in main entry point

Update `src/main.tsx`:

```typescript
import { AnalyticsInitializer } from './utils/analytics';

// Initialize analytics (non-blocking)
AnalyticsInitializer();

ReactDOM.createRoot(document.getElementById('root')!).render(<AuthWrapper />);
```

#### Step 3: Environment variables

Add to `.env`:

```bash
RUDDERSTACK_KEY=your_rudderstack_write_key
REMOTE_CONFIG_URL=https://your-remote-config-url.com
APP_ENV=production
```

Add to `rsbuild.config.ts`:

```typescript
'process.env.RUDDERSTACK_KEY': JSON.stringify(process.env.RUDDERSTACK_KEY),
'process.env.REMOTE_CONFIG_URL': JSON.stringify(process.env.REMOTE_CONFIG_URL),
'process.env.APP_ENV': JSON.stringify(process.env.APP_ENV),
```

### Getting Rudderstack Credentials

1. Sign up at [Rudderstack](https://www.rudderstack.com/)
2. Create a new source (select "JavaScript")
3. Copy the **Write Key** and **Data Plane URL**
4. Add these to your `.env` file

### Creating Analytics Structure

Create the following directory structure:

```
src/analytics/
├── constants.ts                      # Shared constants and types
├── rudderstack-common-events.ts      # Common app events
├── rudderstack-dashboard.ts          # Dashboard-specific events
├── rudderstack-bot-builder.ts        # Bot builder events
├── rudderstack-chart.ts              # Chart interaction events
├── rudderstack-quick-strategy.ts     # Quick strategy events
└── rudderstack-tutorials.ts          # Tutorial events
```

#### Constants File

Create `src/analytics/constants.ts`:

```typescript
export const form_name_v2 = 'ce_bot_form_v2';

export const ACTION = {
    OPEN: 'open',
    CLOSE: 'close',
    RUN_BOT: 'run_bot',
    RUN_QUICK_STRATEGY: 'run_quick_strategy',
    UPLOAD_STRATEGY_START: 'upload_strategy_start',
    UPLOAD_STRATEGY_COMPLETED: 'upload_strategy_completed',
    SWITCH_LOAD_STRATEGY_TAB: 'switch_load_strategy_tab',
    DASHBOARD_CLICK: 'dashboard_click',
} as const;

export type TBotFormV2BaseEvent = {
    subpage_name: string;
    subform_name?: string;
    subform_source?: string;
};

export type TUploadStrategyEvent = {
    upload_provider: string;
    upload_id: string;
    upload_type?: string;
    strategy_name?: string;
    asset?: string;
    trade_type?: string;
    account_type?: string;
    device_type?: string;
};

export type TDashboardClickEvent = {
    dashboard_click_name: string;
    subpage_name: string;
};

export interface AnalyticsTracker {
    trackEvent: (event_name: string, properties: Record<string, any>) => void;
}
```

### Event Tracking Examples

#### Common Events

Create `src/analytics/rudderstack-common-events.ts`:

```typescript
import { Analytics } from '@deriv-com/analytics';
import { ACTION, AnalyticsTracker, form_name_v2, TBotFormV2BaseEvent, TUploadStrategyEvent } from './constants';

const tracker = Analytics as unknown as AnalyticsTracker;

export const rudderStackSendOpenEvent = ({
    subpage_name,
    subform_source,
    subform_name,
}: TBotFormV2BaseEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.OPEN,
        form_name: form_name_v2,
        subpage_name,
        subform_name,
        subform_source,
    });
};

export const rudderStackSendRunBotEvent = ({ subpage_name }: TBotFormV2BaseEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.RUN_BOT,
        form_name: form_name_v2,
        subpage_name,
    });
};

export const rudderStackSendUploadStrategyCompletedEvent = (props: TUploadStrategyEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.UPLOAD_STRATEGY_COMPLETED,
        form_name: form_name_v2,
        subform_name: 'load_strategy',
        subpage_name: 'bot_builder',
        ...props,
    });
};
```

#### Dashboard Events

Create `src/analytics/rudderstack-dashboard.ts`:

```typescript
import { Analytics } from '@deriv-com/analytics';
import { ACTION, AnalyticsTracker, form_name_v2, TDashboardClickEvent } from './constants';

const tracker = Analytics as unknown as AnalyticsTracker;

export const rudderStackSendDashboardClickEvent = ({
    dashboard_click_name,
    subpage_name,
}: TDashboardClickEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.DASHBOARD_CLICK,
        form_name: form_name_v2,
        subpage_name,
        dashboard_click_name,
    });
};
```

#### Chart Events

Create `src/analytics/rudderstack-chart.ts`:

```typescript
import { Analytics } from '@deriv-com/analytics';
import { AnalyticsTracker } from './constants';

const tracker = Analytics as unknown as AnalyticsTracker;

export const STATE_TYPES = {
    CHART_TYPE_CHANGE: 'CHART_TYPE_CHANGE',
    CHART_INTERVAL_CHANGE: 'CHART_INTERVAL_CHANGE',
    INDICATOR_ADDED: 'INDICATOR_ADDED',
    INDICATOR_DELETED: 'INDICATOR_DELETED',
} as const;

export const rudderStackChartAnalyticsData = (
    state: keyof typeof STATE_TYPES,
    options: Record<string, any>
) => {
    switch (state) {
        case STATE_TYPES.CHART_TYPE_CHANGE:
            if (!options.chart_type_name) return;
            tracker.trackEvent('ce_chart_types_form_v2', {
                action: 'choose_chart_type',
                chart_type_name: options.chart_type_name,
                time_interval_name: options.time_interval_name,
            });
            break;

        case STATE_TYPES.INDICATOR_ADDED:
            if (!options.indicator_type_name) return;
            tracker.trackEvent('ce_indicators_types_form_v2', {
                action: 'add_active',
                indicator_type_name: options.indicator_type_name,
                indicators_category_name: options.indicators_category_name,
            });
            break;
    }
};
```

### Component Integration

#### Dashboard Card Click

```typescript
import { rudderStackSendDashboardClickEvent } from '@/analytics/rudderstack-dashboard';

const handleQuickStrategyClick = () => {
    rudderStackSendDashboardClickEvent({
        dashboard_click_name: 'quick_strategy',
        subpage_name: 'dashboard',
    });
    navigate('/quick-strategy');
};
```

#### Chart State Change

```typescript
import { rudderStackChartAnalyticsData, STATE_TYPES } from '@/analytics/rudderstack-chart';

const handleStateChange = (state, options) => {
    if (options !== undefined && state && state in STATE_TYPES) {
        rudderStackChartAnalyticsData(state, options);
    }
};
```

#### Bot Run

```typescript
import { rudderStackSendRunBotEvent } from '@/analytics/rudderstack-common-events';

const handleRunBot = () => {
    rudderStackSendRunBotEvent({ subpage_name: 'bot_builder' });
    run_panel.onRunButtonClick();
};
```

#### Performance Metrics

```typescript
import { Analytics } from '@deriv-com/analytics';

export const startPerformanceEventTimer = (action: string) => {
    if (!window.performance_metrics) window.performance_metrics = {};
    window.performance_metrics[action] = Date.now();
};

export const setPerformanceValue = (action: string) => {
    if (window.performance_metrics?.[action]) {
        const value = (Date.now() - window.performance_metrics[action]) / 1000;
        window.performance_metrics[action] = 0;
        Analytics.trackEvent('ce_traders_hub_performance_metrics', {
            action,
            value,
            device: window.innerWidth <= 768 ? 'mobile' : 'desktop',
        });
    }
};
```

#### Logout with Analytics Reset

```typescript
import { Analytics } from '@deriv-com/analytics';

// In your logout handler
Analytics.reset();
```

### Common Event Names

| Event Name                           | Purpose              | Example Usage                       |
| ------------------------------------ | -------------------- | ----------------------------------- |
| `ce_bot_form_v2`                     | General bot actions  | Opening modals, running bots        |
| `ce_chart_types_form_v2`             | Chart interactions   | Changing chart type, time interval  |
| `ce_indicators_types_form_v2`        | Technical indicators | Adding/removing indicators          |
| `ce_market_types_form_v2`            | Market selection     | Changing markets                    |
| `ce_traders_hub_performance_metrics` | Performance tracking | Page load times, API response times |
| `ce_drawing_tools_form_v2`           | Drawing tools        | Adding/editing drawing tools        |

### Analytics Best Practices

1. **Event Naming** - Use consistent, descriptive `ce_` prefixed event names
2. **Property Names** - Use `snake_case` for all property names
3. **Type Safety** - Define TypeScript types for all event properties
4. **Error Handling** - Wrap analytics calls in try-catch to prevent app crashes
5. **Privacy** - Never track PII (personally identifiable information)
6. **Performance** - Don't track excessive events (can slow down the app)
7. **Testing** - Always test in staging before production

---

## Growthbook Feature Flags

If you need A/B testing and feature flag functionality:

### Installation

Growthbook is included with the analytics package:

```bash
npm install @deriv-com/analytics
```

### Setup

1. **Replace the stub implementation:** Delete `src/hooks/remote-config/useRemoteConfig.ts`

2. **Recreate Growthbook hooks** in `src/hooks/growthbook/`:

   - `useRemoteConfig.ts` - Fetches remote configuration
   - `useGrowthbookGetFeatureValue.ts` - Gets feature flag values
   - `useIsGrowthbookLoaded.ts` - Checks if Growthbook is loaded

3. **Update imports:** Change all imports from `@/hooks/remote-config/useRemoteConfig` to `@/hooks/growthbook/useRemoteConfig`

4. **Re-enable initialization:** The `AnalyticsInitializer()` call in `src/main.tsx` includes Growthbook setup via the `growthbookOptions` config.

### Environment Variables

```bash
GROWTHBOOK_CLIENT_KEY=your_growthbook_client_key
GROWTHBOOK_DECRYPTION_KEY=your_growthbook_decryption_key
```

### Files Using Feature Flags (Stub)

These files currently use the stub and would need updating:

- `src/hooks/useIntercom.ts` - Chat availability check
- `src/components/chat/useLiveChat.ts` - LiveChat integration

---

## Implementation Checklist

### Datadog

- [ ] Install `@datadog/browser-rum` package
- [ ] Create `src/utils/datadog.ts`
- [ ] Add initialization call in app component
- [ ] Set environment variables in `.env`
- [ ] Add variables to `rsbuild.config.ts`
- [ ] Test in staging environment
- [ ] Verify session recordings appear in Datadog dashboard

### TrackJS

- [ ] Install `trackjs` package
- [ ] Create `src/hooks/useTrackjs.ts`
- [ ] Add initialization call in app component
- [ ] Set environment variables in `.env`
- [ ] Add variables to `rsbuild.config.ts`
- [ ] Trigger a test error
- [ ] Verify error appears in TrackJS dashboard

### Rudderstack Analytics

- [ ] Install `@deriv-com/analytics` package
- [ ] Create `src/utils/analytics/index.ts`
- [ ] Call `AnalyticsInitializer()` in `src/main.tsx`
- [ ] Create `src/analytics/` directory with event tracking files
- [ ] Add tracking calls to components
- [ ] Set environment variables in `.env`
- [ ] Add variables to `rsbuild.config.ts`
- [ ] Verify events in Rudderstack dashboard

---

## Testing

### Datadog

1. Open browser DevTools > Network tab
2. Filter for requests to `datadoghq.com`
3. Interact with the app
4. Check the Datadog dashboard for session recordings

### TrackJS

1. Trigger a JavaScript error in the app
2. Check the TrackJS dashboard for the error report
3. Verify user session data is attached

### Rudderstack

1. Open browser DevTools > Network tab
2. Filter by your data plane URL or "rudderstack"
3. Trigger events (click buttons, navigate pages)
4. Verify events appear in the Rudderstack Live Events dashboard

**Test checklist:**

- [ ] Analytics initializes without console errors
- [ ] Events fire on user actions
- [ ] Event properties contain expected values
- [ ] Performance metrics are tracked
- [ ] `Analytics.reset()` is called on logout
- [ ] No analytics-related console errors

---

## Troubleshooting

### Datadog Not Initializing

- Verify `DATADOG_APPLICATION_ID` and `DATADOG_CLIENT_TOKEN` are set
- Check that `APP_ENV` is `'production'` or `'staging'` (not `'development'`)
- Check browser console for initialization errors

### TrackJS Not Tracking Errors

- Verify `TRACKJS_TOKEN` is set
- Ensure `isProduction` evaluates to `true`
- Verify `TrackJS.install()` is called before any errors occur
- Check that `TrackJS.isInstalled()` returns `true`

### Analytics Events Not Sending

- Verify `RUDDERSTACK_KEY` is set correctly
- Check browser console for initialization errors
- Ensure `Analytics.initialise()` is called before tracking events
- Verify events aren't blocked by ad blockers
- Check that `tracking_rudderstack` flag is enabled in remote config

### TypeScript Errors with Analytics

- Cast Analytics to the tracker type: `Analytics as unknown as AnalyticsTracker`
- Update `@deriv-com/analytics` to the latest version
- Add missing type definitions in `constants.ts`

---

## Cost Considerations

| Service      | Free Tier                | Paid Plans                          |
| ------------ | ------------------------ | ----------------------------------- |
| Datadog      | 14-day trial             | Based on sessions and data volume   |
| TrackJS      | Free for small projects  | Based on error volume               |
| Rudderstack  | Free tier available      | Based on event volume               |
| Growthbook   | Free self-hosted         | Cloud plans for managed hosting     |

Evaluate your monitoring needs and budget before enabling these services. For smaller deployments, TrackJS + Rudderstack free tiers may be sufficient. For production-scale applications, Datadog provides the most comprehensive monitoring.

---

## Removed Files Reference

Files removed from the base application that can be recreated using this guide:

| Removed File/Directory          | Recreation Guide Section             |
| ------------------------------- | ------------------------------------ |
| `src/utils/datadog.ts`          | [Datadog RUM](#datadog-rum-real-user-monitoring) |
| `src/hooks/useTrackjs.ts`       | [TrackJS](#trackjs-error-tracking)   |
| `src/utils/analytics/`          | [Rudderstack Analytics](#rudderstack-analytics) |
| `src/hooks/growthbook/`         | [Growthbook Feature Flags](#growthbook-feature-flags) |

**Stub still in codebase:**
- `src/hooks/remote-config/useRemoteConfig.ts` - Returns disabled feature flags by default
