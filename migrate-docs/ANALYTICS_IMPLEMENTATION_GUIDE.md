# Analytics Implementation Guide

This document provides comprehensive instructions for third-party developers on how to implement analytics tracking using `@deriv-com/analytics` package with Rudderstack.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Initial Setup](#initial-setup)
4. [Creating Analytics Structure](#creating-analytics-structure)
5. [Event Tracking Examples](#event-tracking-examples)
6. [Component Integration](#component-integration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The `@deriv-com/analytics` package provides a unified interface for tracking user behavior, feature usage, and conversions through Rudderstack. This guide shows you how to set up analytics from scratch in your derivative trading bot application.

### Why Analytics Was Removed

Analytics tracking code was removed from the base application to:

- Reduce bundle size
- Remove unnecessary third-party dependencies
- Allow developers to choose their own analytics solution
- Provide flexibility for different tracking requirements

---

## Installation

```bash
npm install @deriv-com/analytics@^1.35.1
```

---

## Initial Setup

### Step 1: Create Analytics Initializer

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
            let ppc_campaign_cookies = Cookies.get('utm_data') as unknown as Record<string, string> | null;

            if (!ppc_campaign_cookies) {
                ppc_campaign_cookies = {
                    utm_source: 'no source',
                    utm_medium: 'no medium',
                    utm_campaign: 'no campaign',
                    utm_content: 'no content',
                };
            }

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

### Step 2: Initialize in Main Entry Point

Update `src/main.tsx`:

```typescript
import { configure } from 'mobx';
import ReactDOM from 'react-dom/client';
import { AuthWrapper } from './app/AuthWrapper';
import { AnalyticsInitializer } from './utils/analytics';
import { performVersionCheck } from './utils/version-check';
import './styles/index.scss';

configure({ isolateGlobalState: true });

performVersionCheck();

// Initialize analytics
AnalyticsInitializer();

ReactDOM.createRoot(document.getElementById('root')!).render(<AuthWrapper />);
```

### Step 3: Environment Variables

Add to `.env`:

```bash
RUDDERSTACK_KEY=your_rudderstack_write_key
REMOTE_CONFIG_URL=https://your-remote-config-url.com
APP_ENV=production
```

Update `rsbuild.config.ts`:

```typescript
export default defineConfig({
    source: {
        define: {
            'process.env.RUDDERSTACK_KEY': JSON.stringify(process.env.RUDDERSTACK_KEY),
            'process.env.REMOTE_CONFIG_URL': JSON.stringify(process.env.REMOTE_CONFIG_URL),
            'process.env.APP_ENV': JSON.stringify(process.env.APP_ENV),
        },
    },
});
```

---

## Creating Analytics Structure

### Directory Structure

Create the following structure:

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

### Constants File

Create `src/analytics/constants.ts`:

```typescript
export const form_name_v2 = 'ce_bot_form_v2';
export const STORED_ITEM_NOT_FOUND = 'STORED_ITEM_NOT_FOUND';

// Action constants
export const ACTION = {
    OPEN: 'open',
    CLOSE: 'close',
    RUN_BOT: 'run_bot',
    RUN_QUICK_STRATEGY: 'run_quick_strategy',
    UPLOAD_STRATEGY_START: 'upload_strategy_start',
    UPLOAD_STRATEGY_COMPLETED: 'upload_strategy_completed',
    SWITCH_LOAD_STRATEGY_TAB: 'switch_load_strategy_tab',
    DASHBOARD_CLICK: 'dashboard_click',
    ANNOUNCEMENT_CLICK: 'announcement_click',
} as const;

// TypeScript types
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

---

## Event Tracking Examples

### Common Events

Create `src/analytics/rudderstack-common-events.ts`:

```typescript
import { Analytics } from '@deriv-com/analytics';
import { ACTION, AnalyticsTracker, form_name_v2, TBotFormV2BaseEvent, TUploadStrategyEvent } from './constants';

const tracker = Analytics as unknown as AnalyticsTracker;

export const rudderStackSendOpenEvent = ({
    subpage_name,
    subform_source,
    subform_name,
    load_strategy_tab,
}: TBotFormV2BaseEvent & { load_strategy_tab?: string }) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.OPEN,
        form_name: form_name_v2,
        subpage_name,
        subform_name,
        subform_source,
        load_strategy_tab,
    });
};

export const rudderStackSendRunBotEvent = ({ subpage_name }: TBotFormV2BaseEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.RUN_BOT,
        form_name: form_name_v2,
        subpage_name,
    });
};

export const rudderStackSendUploadStrategyStartEvent = ({ upload_provider, upload_id }: TUploadStrategyEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.UPLOAD_STRATEGY_START,
        form_name: form_name_v2,
        subform_name: 'load_strategy',
        subpage_name: 'bot_builder',
        upload_provider,
        upload_id,
    });
};

export const rudderStackSendUploadStrategyCompletedEvent = ({
    upload_provider,
    upload_id,
    upload_type,
    strategy_name,
    asset,
    trade_type,
    account_type,
    device_type,
}: TUploadStrategyEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.UPLOAD_STRATEGY_COMPLETED,
        form_name: form_name_v2,
        subform_name: 'load_strategy',
        subpage_name: 'bot_builder',
        upload_provider,
        upload_id,
        upload_type,
        strategy_name,
        asset,
        trade_type,
        account_type,
        device_type,
    });
};
```

### Dashboard Events

Create `src/analytics/rudderstack-dashboard.ts`:

```typescript
import { Analytics } from '@deriv-com/analytics';
import { ACTION, AnalyticsTracker, form_name_v2, TDashboardClickEvent } from './constants';

const tracker = Analytics as unknown as AnalyticsTracker;

export const rudderStackSendDashboardClickEvent = ({ dashboard_click_name, subpage_name }: TDashboardClickEvent) => {
    tracker.trackEvent('ce_bot_form_v2', {
        action: ACTION.DASHBOARD_CLICK,
        form_name: form_name_v2,
        subpage_name,
        dashboard_click_name,
    });
};
```

### Chart Events

Create `src/analytics/rudderstack-chart.ts`:

```typescript
import { Analytics } from '@deriv-com/analytics';
import { TChartStateChangeOption } from '@deriv-com/smartcharts-champion';
import { AnalyticsTracker } from './constants';
import { getAccountType, getDeviceType } from '@/utils/account-helpers';

const tracker = Analytics as AnalyticsTracker;

export const STATE_TYPES = {
    CHART_TYPE_CHANGE: 'CHART_TYPE_CHANGE',
    CHART_INTERVAL_CHANGE: 'CHART_INTERVAL_CHANGE',
    SYMBOL_CHANGE: 'SYMBOL_CHANGE',
    INDICATOR_ADDED: 'INDICATOR_ADDED',
    INDICATOR_DELETED: 'INDICATOR_DELETED',
} as const;

export const CHART_ACTION = {
    CHOOSE_CHART_TYPE: 'choose_chart_type',
    CHOOSE_TIME_INTERVAL: 'choose_time_interval',
    CHOOSE_MARKET_TYPE: 'choose_market_type',
    ADD_ACTIVE: 'add_active',
    DELETE_ACTIVE: 'delete_active',
} as const;

export const rudderStackChartAnalyticsData = (
    state: keyof typeof STATE_TYPES,
    options: TChartStateChangeOption
): { event_type: string; data: Record<string, any> } => {
    const account_type = getAccountType();
    const device_type = getDeviceType();

    switch (state) {
        case STATE_TYPES.CHART_TYPE_CHANGE:
            if (!options.chart_type_name) return { event_type: '', data: {} };

            const chartData = {
                action: CHART_ACTION.CHOOSE_CHART_TYPE,
                chart_type_name: options.chart_type_name,
                time_interval_name: options.time_interval_name,
                account_type,
                device_type,
            };

            tracker.trackEvent('ce_chart_types_form_v2', chartData);
            return { event_type: 'ce_chart_types_form_v2', data: chartData };

        case STATE_TYPES.INDICATOR_ADDED:
            if (!options.indicator_type_name) return { event_type: '', data: {} };

            const indicatorData = {
                action: CHART_ACTION.ADD_ACTIVE,
                indicator_type_name: options.indicator_type_name,
                indicators_category_name: options.indicators_category_name,
                account_type,
                device_type,
            };

            tracker.trackEvent('ce_indicators_types_form_v2', indicatorData);
            return { event_type: 'ce_indicators_types_form_v2', data: indicatorData };

        default:
            return { event_type: '', data: {} };
    }
};
```

---

## Component Integration

### Example 1: Dashboard Component

```typescript
// src/pages/dashboard/cards.tsx
import { rudderStackSendDashboardClickEvent } from '@/analytics/rudderstack-dashboard';

const DashboardCards = () => {
    const handleQuickStrategyClick = () => {
        rudderStackSendDashboardClickEvent({
            dashboard_click_name: 'quick_strategy',
            subpage_name: 'dashboard',
        });

        // Navigate to quick strategy
        navigate('/quick-strategy');
    };

    return (
        <div onClick={handleQuickStrategyClick}>
            Quick Strategy Card
        </div>
    );
};
```

### Example 2: Chart Component

```typescript
// src/pages/chart/chart.tsx
import { rudderStackChartAnalyticsData, STATE_TYPES } from '@/analytics/rudderstack-chart';

const Chart = () => {
    const handleStateChange = (state, options) => {
        // Track chart state changes
        if (options !== undefined && state && state in STATE_TYPES) {
            rudderStackChartAnalyticsData(state as keyof typeof STATE_TYPES, options);
        }

        // Handle other state logic
        if (state === 'READY') {
            setChartStatus(true);
        }
    };

    return (
        <SmartChart
            stateChangeListener={handleStateChange}
            // ... other props
        />
    );
};
```

### Example 3: Load Modal Store

```typescript
// src/stores/load-modal-store.ts
import { v4 as uuidv4 } from 'uuid';
import {
    rudderStackSendUploadStrategyStartEvent,
    rudderStackSendUploadStrategyCompletedEvent,
} from '@/analytics/rudderstack-common-events';

class LoadModalStore {
    loadStrategyFromFile = async (file: File, provider: string) => {
        const upload_id = uuidv4();

        // Track upload start
        rudderStackSendUploadStrategyStartEvent({
            upload_provider: provider,
            upload_id,
        });

        try {
            // Load strategy logic...
            const strategy = await loadStrategy(file);

            // Track upload completion
            rudderStackSendUploadStrategyCompletedEvent({
                upload_provider: provider,
                upload_id,
                upload_type: 'new',
                strategy_name: strategy.name,
                asset: strategy.asset,
                trade_type: strategy.tradeType,
                account_type: getAccountType(),
                device_type: getDeviceType(),
            });

            return strategy;
        } catch (error) {
            console.error('Strategy load failed', error);
        }
    };
}
```

### Example 4: Bot Builder Toolbar

```typescript
// src/pages/bot-builder/toolbar/toolbar.tsx
import { rudderStackSendOpenEvent } from '@/analytics/rudderstack-common-events';

const Toolbar = () => {
    const handleLoadModalOpen = () => {
        rudderStackSendOpenEvent({
            subpage_name: 'bot_builder',
            subform_name: 'load_strategy',
            subform_source: 'toolbar',
        });

        setIsLoadModalOpen(true);
    };

    return (
        <button onClick={handleLoadModalOpen}>
            Load Strategy
        </button>
    );
};
```

### Example 5: Run Bot

```typescript
// src/pages/bot-builder/quick-strategy/form-wrappers/mobile-qs-footer.tsx
import { rudderStackSendRunBotEvent } from '@/analytics/rudderstack-common-events';
import { getAccountType, getDeviceType } from '@/utils/account-helpers';

const MobileQSFooter = () => {
    const handleRunBot = () => {
        rudderStackSendRunBotEvent({
            subpage_name: 'bot_builder',
        });

        // Start bot execution
        run_panel.onRunButtonClick();
    };

    return (
        <button onClick={handleRunBot}>
            Run Bot
        </button>
    );
};
```

### Example 6: Performance Metrics

```typescript
// src/components/shared/services/performance-metrics-methods.ts
import { Analytics } from '@deriv-com/analytics';
import { isMobile } from '../utils/screen';

export const startPerformanceEventTimer = (action: string) => {
    if (!window.performance_metrics) {
        window.performance_metrics = {};
    }
    window.performance_metrics[action] = Date.now();
};

export const setPerformanceValue = (action: string) => {
    if (window.performance_metrics?.[action]) {
        const value = (Date.now() - window.performance_metrics[action]) / 1000;
        window.performance_metrics[action] = 0;

        Analytics.trackEvent('ce_traders_hub_performance_metrics', {
            action,
            value,
            device: isMobile() ? 'mobile' : 'desktop',
        });
    }
};
```

### Example 7: Logout with Analytics Reset

```typescript
// src/stores/client-store.ts
import { Analytics } from '@deriv-com/analytics';

class ClientStore {
    logout = async () => {
        try {
            // Reset analytics data
            Analytics.reset();

            // Clear local storage
            localStorage.clear();

            // API logout
            await api.logout();

            // Redirect to login
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed', error);
        }
    };
}
```

---

## Testing

### 1. Check Network Requests

Open browser DevTools → Network tab:

- Filter by "rudderstack" or your data plane URL
- Trigger events in your app
- Verify requests are being sent with correct payloads

### 2. Console Logging

Add temporary logging to verify events:

```typescript
export const rudderStackSendOpenEvent = params => {
    console.log('Analytics Event:', 'ce_bot_form_v2', params);
    tracker.trackEvent('ce_bot_form_v2', params);
};
```

### 3. Rudderstack Dashboard

1. Log into your Rudderstack account
2. Go to Live Events
3. Trigger events in your app
4. Verify events appear in real-time

### 4. Test Checklist

- [ ] Analytics initializes without errors
- [ ] Events are sent on user actions
- [ ] Event properties are correct
- [ ] Performance metrics are tracked
- [ ] Analytics resets on logout
- [ ] No console errors related to analytics

---

## Troubleshooting

### Events Not Sending

**Problem**: No events appear in Rudderstack dashboard

**Solutions**:

1. Verify `RUDDERSTACK_KEY` is set correctly
2. Check browser console for errors
3. Ensure Analytics.initialise() is called before tracking events
4. Verify network requests aren't blocked by ad blockers
5. Check that `tracking_rudderstack` flag is enabled

### Analytics Not Initializing

**Problem**: Analytics.initialise() fails

**Solutions**:

1. Check if all required environment variables are set
2. Verify remote config URL is accessible
3. Check for CORS issues if fetching remote config
4. Add try-catch blocks and log errors

### Type Errors

**Problem**: TypeScript errors with Analytics package

**Solutions**:

1. Cast Analytics to AnalyticsTracker type: `Analytics as unknown as AnalyticsTracker`
2. Use `@ts-expect-error` comment for known type issues
3. Update @deriv-com/analytics to latest version

### Missing Event Properties

**Problem**: Events are sent but missing expected properties

**Solutions**:

1. Check that utility functions (getAccountType, getDeviceType) are working
2. Verify localStorage has required values
3. Add default values for optional properties
4. Log event data before sending to debug

---

## Getting Rudderstack Credentials

1. Sign up at [Rudderstack](https://www.rudderstack.com/)
2. Create a new source:
    - Select "JavaScript" as the source type
    - Name it (e.g., "Deriv Bot - Production")
3. Copy the **Write Key**
4. Copy the **Data Plane URL**
5. Add these to your `.env` file

---

## Common Event Names

| Event Name                           | Purpose              | Example Usage                       |
| ------------------------------------ | -------------------- | ----------------------------------- |
| `ce_bot_form_v2`                     | General bot actions  | Opening modals, running bots        |
| `ce_chart_types_form_v2`             | Chart interactions   | Changing chart type, time interval  |
| `ce_indicators_types_form_v2`        | Technical indicators | Adding/removing indicators          |
| `ce_market_types_form_v2`            | Market selection     | Changing markets, favorites         |
| `ce_traders_hub_performance_metrics` | Performance tracking | Page load times, API response times |
| `ce_drawing_tools_form_v2`           | Drawing tools        | Adding/editing drawing tools        |

---

## Best Practices

1. **Event Naming**: Use consistent, descriptive event names
2. **Property Names**: Use snake_case for property names
3. **Type Safety**: Define TypeScript types for event properties
4. **Error Handling**: Wrap analytics calls in try-catch to prevent app crashes
5. **Privacy**: Don't track PII (personally identifiable information)
6. **Performance**: Don't track too many events (can slow down app)
7. **Testing**: Always test analytics in staging before production

---

**Last Updated**: 2026-02-09
**Version**: 2.0.0
