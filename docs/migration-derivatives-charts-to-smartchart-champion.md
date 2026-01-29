# Migration Plan: @deriv-com/derivatives-charts ➜ smartchart-champion (per docs/SmartChart.md)

Purpose

- This document details the end-to-end migration from the legacy derivatives-charts integration to the SmartChart “champion” API described in docs/SmartChart.md.
- It enumerates all required changes across dependencies, assets, types, functions, props, and implementation details, including concrete adapter code to wire your existing Deriv WS to the new SmartChart contracts.

Assumptions

- Target npm package name: @deriv-com/smartcharts-champion
- The champion API requires:
    - getQuotes (history), subscribeQuotes (live, returns an unsubscribe function), unsubscribeQuotes (explicit server forget)
    - chartData: { activeSymbols, tradingTimes } supplied by the host
    - TQuote/TGetQuotesRequest/TGetQuotesResult types (or equivalents provided by package types)

---

1. Dependencies and Imports

1.1 package.json

- Remove or stop using:
    - @deriv-com/derivatives-charts
- Add:
    - @deriv-com/smartcharts-champion
- Example:

```json
{
    "dependencies": {
        "@deriv-com/smartcharts-champion": "^X.Y.Z"
    }
}
```

1.2 Imports in code

- Replace:
    - import { SmartChart, ChartTitle } from '@deriv-com/derivatives-charts';
    - import '@deriv-com/derivatives-charts/dist/smartcharts.css';
- With:
    - import { SmartChart, ChartTitle, ToolbarWidget, ChartMode, StudyLegend, Views, DrawTools, Share } from '@deriv-com/smartcharts-champion';
    - import '@deriv-com/smartcharts-champion/dist/smartcharts.css'; // if the champion package ships CSS similarly

Note:

- If the champion package uses a different public path initializer than setSmartChartsPublicPath, update accordingly. If no public path API is required, remove the call.

---

2. Assets and Public Path

2.1 Remove derivative-specific copying rules

- In rsbuild.config.ts, remove copy rules referencing node_modules/@deriv-com/derivatives-charts/\*

    2.2 Add champion assets if required

- If @deriv-com/smartcharts-champion provides dist assets, copy them similarly into /js/smartcharts/ (or a new path):

```ts
output: {
  copy: [
    { from: 'node_modules/@deriv-com/smartcharts-champion/dist/*', to: 'js/smartcharts/[name][ext]' },
    { from: 'node_modules/@deriv-com/smartcharts-champion/dist/chart/assets/*', to: 'assets/[name][ext]' },
    { from: 'node_modules/@deriv-com/smartcharts-champion/dist/chart/assets/fonts/*', to: 'assets/fonts/[name][ext]' },
    { from: 'node_modules/@deriv-com/smartcharts-champion/dist/chart/assets/shaders/*', to: 'assets/shaders/[name][ext]' },
    { from: path.join(__dirname, 'public') },
  ],
}
```

2.3 Public path initialization

- If applicable, replace:
    - setSmartChartsPublicPath(getUrlBase('/js/smartcharts/'));
- With champion’s equivalent, or remove if not needed by @deriv-com/smartcharts-champion.

---

3. Types: Add or Align to Champion Contracts

Create a local adapter types file if the package types are not available or you need an internal bridge.

3.1 New SmartChart types (minimal)

```ts
// src/types/smartchart.types.ts
export type TGranularity = 0 | 60 | 120 | 180 | 300 | 600 | 900 | 1800 | 3600 | 7200 | 14400 | 28800 | 86400;

export type TQuote = {
    Date: string; // ISO string or epoch string
    Close: number;
    Open?: number;
    High?: number;
    Low?: number;
    Volume?: number;
    tick?: { epoch: number; quote: number; symbol?: string; id?: string };
    ohlc?: { open: number; high: number; low: number; close: number; open_time: number };
    DT?: Date;
    prevClose?: number;
};

export type TGetQuotesRequest = {
    symbol: string;
    granularity: TGranularity;
    count: number;
    start?: number;
    end?: number;
    style?: 'candles' | 'ticks';
};

export type TGetQuotesResult = {
    candles?: Array<{ open: number; high: number; low: number; close: number; epoch: number }>;
    history?: { prices: number[]; times: number[] }; // ticks
};

export type ActiveSymbol = {
    display_name: string;
    market: string;
    market_display_name: string;
    subgroup: string;
    subgroup_display_name: string;
    submarket: string;
    submarket_display_name: string;
    symbol: string;
    symbol_type: string;
    pip: number;
    exchange_is_open: 0 | 1;
    is_trading_suspended: 0 | 1;
    delay_amount?: number;
};
export type ActiveSymbols = ActiveSymbol[];

export type TradingTimesMap = Record<
    string,
    {
        isOpen: boolean;
        openTime: string;
        closeTime: string;
    }
>;
```

3.2 Remove derivatives-charts shim if no longer used

- src/types/derivatives-charts.d.ts can be deleted after migration (or kept until fully removed from code paths).

---

4. Network Provider Adapters

Replace derivatives-charts requestAPI/requestSubscribe/requestForget\* with champion’s:

- getQuotes (one-shot history)
- subscribeQuotes (live; returns a function to unsubscribe)
- unsubscribeQuotes (explicit server forget, optional but recommended)

    4.1 History adapter (getQuotes)

```ts
// src/pages/chart/providers.ts
import chart_api from '@/external/bot-skeleton/services/api/chart-api';
import type { TGetQuotesRequest, TGetQuotesResult } from '@/types/smartchart.types';
import type { TicksHistoryRequest } from '@deriv/api-types';

export const getQuotes = async ({
    symbol,
    granularity,
    count,
    start,
    end,
    style,
}: TGetQuotesRequest): Promise<TGetQuotesResult> => {
    // Deriv WS: ticks_history one-shot
    const is_ticks = !granularity || granularity === 0;
    const req: TicksHistoryRequest = {
        ticks_history: symbol,
        end: end ? String(end) : 'latest',
        adjust_start_time: 1,
        ...(start ? { start: String(start) } : {}),
        ...(is_ticks
            ? { style: 'ticks', count: String(count) }
            : { style: 'candles', granularity, count: String(count) }),
    };

    const resp: any = await chart_api.api.send(req);

    if (is_ticks) {
        // resp.history: { prices: number[], times: number[] }
        const history = resp?.history || resp?.ticks_history || {};
        return {
            history: {
                prices: history.prices || [],
                times: history.times || [],
            },
        };
    }

    // Candles: resp.candles: Array<{ open, high, low, close, epoch }>
    const candles = (resp?.candles || []).map((c: any) => ({
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        epoch: Number(c.epoch || c.open_time),
    }));
    return { candles };
};
```

4.2 Streaming adapter (subscribeQuotes)

```ts
// src/pages/chart/providers.ts (continued)
import type { TQuote, TGranularity } from '@/types/smartchart.types';
import type { TicksStreamRequest } from '@deriv/api-types';

const rxSubscriptions: Record<string, { unsubscribe?: () => void } | undefined> = {};
let lastSubscriptionId: string | null = null;

export const subscribeQuotes = (
    params: { symbol: string; granularity: TGranularity },
    onQuote: (q: TQuote) => void
) => {
    const { symbol, granularity } = params;
    const is_ticks = !granularity || granularity === 0;

    // Build subscribe request
    const req: TicksStreamRequest = is_ticks
        ? { ticks: symbol, subscribe: 1 }
        : ({ ticks_history: symbol, style: 'candles', granularity, subscribe: 1 } as any);

    let currentId: string | null = null;
    let rxSub: { unsubscribe?: () => void } | undefined;

    // Start stream: the first message should contain subscription.id
    chart_api.api
        .send(req)
        .then((first: any) => {
            currentId = first?.subscription?.id || null;
            lastSubscriptionId = currentId;

            // Emit first message as TQuote (if present)
            const data = first;
            const q = toTQuoteFromStream(data, granularity);
            if (q) onQuote(q);

            // Subscribe to subsequent messages and filter by subscription id
            rxSub = chart_api.api.onMessage()?.subscribe(({ data: msg }: { data: any }) => {
                if (msg?.subscription?.id === currentId) {
                    const quote = toTQuoteFromStream(msg, granularity);
                    if (quote) onQuote(quote);
                }
            });

            if (currentId) rxSubscriptions[currentId] = rxSub;
        })
        .catch(() => {
            // No-op; caller can decide how to handle connection errors
        });

    // Return unsubscribe function
    return () => {
        if (currentId) {
            rxSubscriptions[currentId]?.unsubscribe?.();
            delete rxSubscriptions[currentId];
            chart_api.api.forget(currentId);
        }
    };
};

const toTQuoteFromStream = (msg: any, granularity: TGranularity): TQuote | null => {
    const is_ticks = !granularity || granularity === 0;

    if (is_ticks && msg?.tick) {
        const { epoch, quote } = msg.tick;
        return {
            Date: String(epoch),
            Close: Number(quote),
            tick: msg.tick,
        };
    }

    if (!is_ticks && msg?.ohlc) {
        const { open, high, low, close, open_time } = msg.ohlc;
        return {
            Date: String(open_time),
            Open: Number(open),
            High: Number(high),
            Low: Number(low),
            Close: Number(close),
            ohlc: msg.ohlc,
        };
    }

    return null;
};
```

4.3 Explicit server forget (unsubscribeQuotes)

```ts
// src/pages/chart/providers.ts (continued)
import type { TGetQuotesRequest } from '@/types/smartchart.types';

// Optional helper: If you track symbol+granularity ➜ subscription id mapping,
// you can forget by derived id here. For now, this is a no-op wrapper since
// subscribeQuotes returns an unsubscribe function that already forgets by id.
export const unsubscribeQuotes = (_request?: TGetQuotesRequest, _cb?: (data: any) => void) => {
    // Intentionally left generic. Prefer to rely on the unsubscribe() function
    // returned from subscribeQuotes, which calls api.forget(currentId).
};
```

---

5. chartData: Provide activeSymbols and tradingTimes

Champion expects the host to pass both lists, rather than auto-fetch internally.

5.1 Build chartData in your Chart page

```ts
// src/pages/chart/chart.tsx (new champion wiring highlights)
import { SmartChart, ChartTitle, ToolbarWidget, ChartMode, StudyLegend, Views, DrawTools, Share } from '@deriv-com/smartcharts-champion';
import '@deriv-com/smartcharts-champion/dist/smartcharts.css';
import { getQuotes, subscribeQuotes, unsubscribeQuotes } from './providers';
import type { ActiveSymbols, TradingTimesMap } from '@/types/smartchart.types';
import { ApiHelpers } from '@/external/bot-skeleton';
// You likely already have a TradingTimes service; create a tiny adapter to TradingTimesMap.

const toTradingTimesMap = (source: any): TradingTimesMap => {
  // Source from your existing trading-times.js service
  const map: TradingTimesMap = {};
  Object.keys(source || {}).forEach(symbol => {
    const info = source[symbol];
    map[symbol] = {
      isOpen: !!info?.is_opened,
      openTime: String(info?.times?.open_time || ''),
      closeTime: String(info?.times?.close_time || ''),
    };
  });
  return map;
};

const Chart = observer(({ show_digits_stats }: { show_digits_stats: boolean }) => {
  // Existing stores, settings, etc...

  // Acquire active symbols and trading times from existing helpers/services
  const activeSymbols: ActiveSymbols =
    (ApiHelpers?.instance?.active_symbols?.active_symbols as any[]) ||
    (ApiHelpers?.instance?.active_symbols as any)?.active_symbols ||
    [];

  // Suppose you have a trading_times service instance or cache
  // Pass a compatible record down here (adapt from current trading-times.js data)
  const tradingTimesRaw = /* retrieve from your trading-times service/cache */;
  const tradingTimes = toTradingTimesMap(tradingTimesRaw);

  const chartData = { activeSymbols, tradingTimes };

  return (
    <SmartChart
      id="dbot"
      symbol={symbol}
      chartType={chart_type}
      granularity={granularity}
      isMobile={isMobile}
      settings={settings}
      // Champion data providers:
      getQuotes={getQuotes}
      subscribeQuotes={subscribeQuotes}
      unsubscribeQuotes={unsubscribeQuotes}
      // Preloaded data:
      chartData={chartData}
      topWidgets={() => <ChartTitle onChange={onSymbolChange} />}
      toolbarWidget={() => (
        <ToolbarWidget>
          <ChartMode />
          <StudyLegend />
          <Views />
          <DrawTools />
          <Share />
        </ToolbarWidget>
      )}
      enabledNavigationWidget={isDesktop}
      enabledChartFooter={false}
      isLive
      leftMargin={80}
    />
  );
});
```

5.2 Remove derivatives-charts props

- Delete requestAPI, requestSubscribe, requestForget, requestForgetStream from your SmartChart invocation.

---

6. Remove Derivatives-specific Lifecycle Code

6.1 Component unmount cleanup

- You no longer need to call forgetAll('ticks') if all streams are managed by returning unsubscribe from subscribeQuotes.
- Ensure your subscribeQuotes cleanup unsubscribes Rx listeners and sends api.forget(subscription_id).

    6.2 isConnectionOpened

- Champion does not rely on isConnectionOpened prop (based on docs/SmartChart.md). Remove it unless the package specifies otherwise.

---

7. Toolbar/Widgets Compatibility

- If you used derivatives-charts ToolbarWidget/Views/DrawTools/etc, import them from the champion package if provided:
    - From docs/SmartChart.md, public exports include ChartMode, StudyLegend, Views, DrawTools, Share, ToolbarWidget.
- If any component names differ, adjust accordingly.

---

8. Markers and contracts_array

- The champion doc keeps contracts_array behavior. Continue passing your contracts overlay if used.
- Ensure each marker epoch is in seconds; omit quote to allow interpolation.

---

9. Testing and Verification

- Start app and verify:
    - CSS loads for @deriv-com/smartcharts-champion (or your champion name).
    - Active symbols/trading times are provided via chartData (symbol menu works, open/close status correct).
    - History loads for both ticks (granularity 0) and candles (>0).
    - Live streaming works; switching symbol/timeframe resubscribes cleanly with no console noise.
    - Pagination: Scroll left should trigger jsInterop.loadHistory path if provided by the champion package (validate integration need).
    - Unmount and navigation do not leak subscriptions (confirm no onMessage events after unmount).

---

10. Diff Checklist (Concrete To-Do)

- Dependencies
    - Remove @deriv-com/derivatives-charts
    - Add @deriv-com/smartcharts-champion

- Imports and CSS
    - Update SmartChart, widgets imports to new module
    - Update CSS import to @deriv-com/smartcharts-champion/dist/smartcharts.css

- Assets and public path
    - Update rsbuild.config.ts copy rules to champion’s dist/assets
    - Remove setSmartChartsPublicPath unless champion requires a similar call

- Types
    - Add src/types/smartchart.types.ts (TQuote, TGetQuotesRequest, TGetQuotesResult, ActiveSymbols, TradingTimesMap)
    - Remove derivatives-charts d.ts shim if unused

- Providers
    - Add src/pages/chart/providers.ts with getQuotes, subscribeQuotes, unsubscribeQuotes
    - Ensure subscribeQuotes returns an unsubscribe function and calls api.forget(id)

- Chart page
    - Replace SmartChart props: remove requestAPI/requestSubscribe/requestForget\*
    - Add getQuotes/subscribeQuotes/unsubscribeQuotes and chartData
    - Adapt toolbarWidget and topWidgets to champion exports

- Trading times map
    - Create an adapter from your trading-times.js structure to TradingTimesMap (isOpen/openTime/closeTime)

- Cleanup
    - Remove explicit forgetAll('ticks') if redundant
    - Ensure unsubscribe closures fully release Rx subscriptions

---

Appendix A: Full providers.ts (combined)

// src/pages/chart/providers.ts
import chart_api from '@/external/bot-skeleton/services/api/chart-api';
import type { TicksHistoryRequest, TicksStreamRequest } from '@deriv/api-types';
import type {
TGetQuotesRequest,
TGetQuotesResult,
TQuote,
TGranularity,
} from '@/types/smartchart.types';

const rxSubscriptions: Record<string, { unsubscribe?: () => void } | undefined> = {};

export const getQuotes = async ({
symbol,
granularity,
count,
start,
end,
style,
}: TGetQuotesRequest): Promise<TGetQuotesResult> => {
const is_ticks = !granularity || granularity === 0;
const req: TicksHistoryRequest = {
ticks_history: symbol,
end: end ? String(end) : 'latest',
adjust_start_time: 1,
...(start ? { start: String(start) } : {}),
...(is_ticks
? { style: 'ticks', count: String(count) }
: { style: 'candles', granularity, count: String(count) }),
};

const resp: any = await chart_api.api.send(req);

if (is_ticks) {
const history = resp?.history || resp?.ticks_history || {};
return {
history: {
prices: history.prices || [],
times: history.times || [],
},
};
}

const candles = (resp?.candles || []).map((c: any) => ({
open: Number(c.open),
high: Number(c.high),
low: Number(c.low),
close: Number(c.close),
epoch: Number(c.epoch || c.open_time),
}));
return { candles };
};

export const subscribeQuotes = (
params: { symbol: string; granularity: TGranularity },
onQuote: (q: TQuote) => void
) => {
const { symbol, granularity } = params;
const is_ticks = !granularity || granularity === 0;

const req: TicksStreamRequest = is_ticks
? { ticks: symbol, subscribe: 1 }
: { ticks_history: symbol, style: 'candles', granularity, subscribe: 1 } as any;

let currentId: string | null = null;
let rxSub: { unsubscribe?: () => void } | undefined;

chart_api.api
.send(req)
.then((first: any) => {
currentId = first?.subscription?.id || null;

      const firstQuote = toTQuoteFromStream(first, granularity);
      if (firstQuote) onQuote(firstQuote);

      rxSub = chart_api.api.onMessage()?.subscribe(({ data: msg }: { data: any }) => {
        if (msg?.subscription?.id === currentId) {
          const q = toTQuoteFromStream(msg, granularity);
          if (q) onQuote(q);
        }
      });

      if (currentId) rxSubscriptions[currentId] = rxSub;
    })
    .catch(() => { /* noop */ });

return () => {
if (currentId) {
rxSubscriptions[currentId]?.unsubscribe?.();
delete rxSubscriptions[currentId];
chart_api.api.forget(currentId);
}
};
};

export const unsubscribeQuotes = (\_request?: TGetQuotesRequest) => {
// Optional global forget; prefer per-subscription unsubscribe returned by subscribeQuotes
};

const toTQuoteFromStream = (msg: any, granularity: TGranularity): TQuote | null => {
const is_ticks = !granularity || granularity === 0;

if (is_ticks && msg?.tick) {
const { epoch, quote } = msg.tick;
return {
Date: String(epoch),
Close: Number(quote),
tick: msg.tick,
};
}

if (!is_ticks && msg?.ohlc) {
const { open, high, low, close, open_time } = msg.ohlc;
return {
Date: String(open_time),
Open: Number(open),
High: Number(high),
Low: Number(low),
Close: Number(close),
ohlc: msg.ohlc,
};
}
return null;
};

---

Appendix B: Chart page diff (high level)

- Before (derivatives-charts):
    - Props: requestAPI, requestSubscribe, requestForget, requestForgetStream, isConnectionOpened
    - CSS: @deriv-com/derivatives-charts/dist/smartcharts.css
    - Public path: setSmartChartsPublicPath

- After (champion):
    - Props: getQuotes, subscribeQuotes, unsubscribeQuotes, chartData
    - CSS: @deriv-com/smartcharts-champion/dist/smartcharts.css
    - Public path: remove or champion-equivalent
    - Widgets: import from @deriv-com/smartcharts-champion

---

Deliverable

After completing the checklist above:

- The app no longer references @deriv-com/derivatives-charts.
- SmartChart is sourced from @deriv-com/smartcharts-champion.
- Data providers implement champion contracts and are backed by your Deriv WS transport.
- ActiveSymbols and TradingTimes are provided via chartData.
- Streams are isolated by subscription id and cleaned up using the returned unsubscribe function.

This plan ensures parity with docs/SmartChart.md and positions the integration for future enhancements with the champion SmartChart API.
