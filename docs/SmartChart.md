# SmartChart Integration Guide

This document explains how the SmartChart component works, the prerequisites (data and functions) it requires, and the data types/objects exchanged between SmartChart and your app. It is based on the current codebase:

- UI entry: `src/components/SmartChart.tsx` and `src/components/Chart.tsx`
- App state and data flow: `src/store/*` (notably `ChartStore`, `ChartState`, `ChartAdapterStore`)
- Data ingestion and streaming: `src/feed/*` and `src/binaryapi/*`
- Public types: `src/types/*`
- Example usage: `app/index.tsx`

---

## 1) High-level Architecture

- `<SmartChart />` is a thin wrapper that initializes the MobX store context and renders `<Chart />` with your props.
- `<Chart />` consumes props (see TChartProps) and initializes the main store, UI widgets, and the chart container. It passes your props into `ChartStore.init`.
- `ChartStore` wires:
    - BinaryAPI abstraction (wrapping your getQuotes/subscribeQuotes/unsubscribeQuotes)
    - Feed (initial history + streaming, pagination)
    - TradingTimes (market open/close, delayed feeds) using either provided chartData or feed flags
    - Routing and UI settings
- `ChartAdapterStore` is a bridge to the Flutter chart runtime (via `window.jsInterop`), forwarding all history/streaming updates and handling user interactions (scroll/zoom, crosshair, overlays).
- The flow of data:
    1. Props to SmartChart (TChartProps) → ChartStore
    2. ChartStore creates BinaryAPI and Feed
    3. Feed fetches initial data and emits stream updates
    4. ChartAdapterStore forwards quotes to the Flutter chart view

---

## 2) Minimum Prerequisites

You must supply data providers and essential props when embedding SmartChart:

- unsubscribeQuotes: BinaryAPI['unsubscribeQuotes'] (REQUIRED)
- getQuotes: TGetQuotes (RECOMMENDED for history and when endEpoch/static views are used)
- subscribeQuotes: TSubscribeQuotes (RECOMMENDED for live streaming)
- chartData.activeSymbols: ActiveSymbols (RECOMMENDED)
- chartData.tradingTimes: Record<symbol, { isOpen, openTime, closeTime }> (RECOMMENDED)

Notes:

- The internal BinaryAPI wrapper in this repo expects only getQuotes/subscribeQuotes/unsubscribeQuotes. It does not fetch active symbols or trading times by itself here. Pass those via chartData (see example).
- Without getQuotes/subscribeQuotes, SmartChart will render but not load real data.

---

## 3) Props API (TChartProps) Overview

Essential data providers:

- unsubscribeQuotes: BinaryAPI['unsubscribeQuotes']
- getQuotes?: TGetQuotes
- subscribeQuotes?: TSubscribeQuotes

Data context:

- symbol?: string
- granularity?: TGranularity (0 for ticks; see types below)
- chartType?: string (e.g., 'line', 'candles')

Initial data:

- chartData?: {
  activeSymbols?: ActiveSymbols;
  tradingTimes?: Record<string, { isOpen: boolean; openTime: string; closeTime: string }>;
  }

Lifecycle and behavior:

- isLive?: boolean (enable live state styling)
- startEpoch?: number
- endEpoch?: number
- isStaticChart?: boolean
- anchorChartToLeft?: boolean
- scrollToEpoch?: number | null
- enableRouting?: boolean

User settings/state:

- settings?: TSettings
- onSettingsChange?: (newSettings: Omit<TSettings, 'activeLanguages'>) => void
- stateChangeListener?: TStateChangeListener
- chartStatusListener?: (isChartReady: boolean) => boolean

Layout/appearance:

- isMobile?: boolean
- enabledChartFooter?: boolean
- enabledNavigationWidget?: boolean
- yAxisMargin?: { top: number; bottom: number }
- leftMargin?: number
- crosshairState?: number | null
- crosshairTooltipLeftAllow?: number | null
- startWithDataFitMode?: boolean
- isAnimationEnabled?: boolean

Widgets (render props):

- topWidgets?: () => React.ReactElement
- bottomWidgets?: () => React.ReactElement
- toolbarWidget?: () => React.ReactElement
- chartControlsWidgets?: TChartControlsWidgets

Other:

- feedCall?: { activeSymbols?: boolean; tradingTimes?: boolean } (not typically needed if you pass chartData)
- onMessage?: (message: TNotification) => void
- networkStatus?: TNetworkConfig
- clearChart?: () => void
- shouldGetQuotes?: boolean
- allowTickChartTypeOnly?: boolean
- shouldFetchTradingTimes?: boolean
- shouldDrawTicksFromContractInfo?: boolean
- allTicks?: AuditDetailsForExpiredContract['all_ticks']
- contractInfo?: ProposalOpenContract
- maxTick?: number | null
- zoom?: number
- enableZoom?: boolean | null
- enableScroll?: boolean | null
- historical?: boolean
- contracts_array?: any[] (see Contracts markers below)
- children?: React.ReactNode (e.g., markers via FastMarker)

See `src/types/props.types.ts` for the complete reference.

---

## 4) Data Provider Contracts

### 4.1 TGetQuotes (History fetch)

Signature:

```
type TGetQuotes = (params: {
  symbol: string;
  granularity: number;   // 0 for ticks, >0 for candles in seconds
  count: number;
  start?: number;
  end?: number;
  style?: string;        // 'ticks' or 'candles' (optional)
}) => Promise<TGetQuotesResult>;
```

Return type (TGetQuotesResult):

```
type TGetQuotesResult = {
  candles?: Array<{
    open: number; high: number; low: number; close: number; epoch: number;
  }>;
  history?: {
    prices: number[];
    times: number[];   // epoch in seconds
  };
};
```

Behavior:

- If granularity > 0, return candles.
- If granularity = 0, return history (ticks). One of candles or history must be provided.

### 4.2 TSubscribeQuotes (Live streaming)

Signature:

```
type TSubscribeQuotes = (
  params: { symbol: string; granularity: TGranularity },
  callback: (quote: TQuote) => void
) => () => void; // returns unsubscribe function
```

Callback TQuote:

```
type TQuote = {
  Date: string;        // ISO-like, SmartChart will parse with 'Z' as UTC
  Open?: number;
  High?: number;
  Low?: number;
  Close: number;
  tick?: TicksStreamResponse['tick']; // for ticks
  ohlc?: OHLCStreamResponse['ohlc'];  // for candles
  DT?: Date;
  prevClose?: number;
  Volume?: number;
};
```

Notes:

- For ticks: supply `tick` and `Close` with the spot quote; set `Date` using the epoch from the tick.
- For candles: supply `ohlc` and OHLC/Close; set `Date` using `open_time` or equivalent.

### 4.3 unsubscribeQuotes

Signature:

```
type TUnsubscribeQuotes = (request?: TGetQuotesRequest, callback?: TResponseAPICallback) => void;
```

Used internally alongside subscription management. Implement to stop streaming on symbol/timeframe changes or component unmount.

---

## 5) Core Types in Use

From `src/types/api-types.ts` and `src/types/props.types.ts`:

- TGranularity = 0 | 60 | 120 | 180 | 300 | 600 | 900 | 1800 | 3600 | 7200 | 14400 | 28800 | 86400
    - 0 → ticks (no aggregation). Any non-zero value is seconds per candle.

- TGetQuotesRequest (used by BinaryAPI wrapper):

```
type TGetQuotesRequest = {
  symbol: string;
  ticks_history?: string;
  adjust_start_time?: number;
  count?: string | number;
  end?: string;
  granularity?: (see list above);
  start?: string | number;
  style?: 'candles' | 'ticks';
  subscribe?: 0 | 1;
};
```

- ActiveSymbols (required to populate market/symbol selection and decimals/pip sizes):

```
type ActiveSymbols = Array<{
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
  // ...
}>;
```

- TradingTimesResponse (if you fetch it yourself) is the raw form; in this repo we pass a simplified shape into `chartData`:

```
type TradingTimesMap = Record<string, { isOpen: boolean; openTime: string; closeTime: string }>;
```

- TSettings (user preferences that can be persisted):

```
type TSettings = {
  countdown?: boolean;
  historical?: boolean;
  lang?: string;
  language?: string;
  minimumLeftBars?: number;
  position?: string;
  enabledNavigationWidget?: boolean;
  isAutoScale?: boolean;
  isHighestLowestMarkerEnabled?: boolean;
  isSmoothChartEnabled?: boolean;
  theme?: string;
  activeLanguages?: Array<string | TLanguage> | null;
  whitespace?: number;
};
```

---

## 6) Contracts/Markers (contracts_array)

Use the `contracts_array` prop to send markers/overlays to the chart. These are forwarded to the Flutter chart via `ChartAdapterStore.updateContracts`.

- Minimal marker item:

```
{
  markers: Array<{
    epoch: number;    // seconds
    quote?: number;   // optional; SmartChart will interpolate if missing
    // ... any additional fields consumed by your Flutter chart integration
  }>;
  // optional flags (e.g., isLive) depending on your Flutter chart
}
```

Behavior:

- If a marker lacks `quote`, SmartChart interpolates a price using the nearest ticks/candles before forwarding to the underlying chart.
- The full structure is consumed by the Flutter chart config (`flutterChart.config.updateContracts`), so keep extra fields compatible with your Flutter side.

---

## 7) Lifecycle and Data Flow Details

1. Mount:

- SmartChart initializes the MobX store context.
- Chart mounts, calls `ChartStore.init` with your props.
- ChartStore:
    - Creates `BinaryAPI` from your data providers.
    - Prepares `TradingTimes` and builds a symbol map using `chartData.activeSymbols`.
    - Initializes `Feed` and `ChartAdapterStore`.
    - Kicks off the Flutter chart engine and then triggers `newChart()`.

2. Initial fetch:

- `Feed.fetchInitialData` builds a `TGetQuotesRequest` from `symbol/granularity/start/end`.
- If `end` is set (historical/static), it fetches history only (no stream).
- If live:
    - For delayed markets, uses DelayedSubscription (with notifications).
    - Otherwise uses RealtimeSubscription.
- On resolution, Feed pushes quotes to ChartAdapterStore (`onTickHistory`) → Flutter chart renders.

3. Streaming:

- Subscription pushes new `TQuote` items to Feed → `ChartAdapterStore.onTick` → Flutter chart.
- Connection events (close/reopen) are handled; on reopen the chart is refreshed.

4. Pagination:

- Flutter chart requests more history via `jsInterop.loadHistory` → `ChartAdapterStore.loadHistory` → `Feed.fetchPaginationData` → update.

5. Symbol/timeframe changes:

- `ChartState` detects changes (e.g., via Views/ChartMode UI) and calls `ChartStore.changeSymbol/newChart`, re-wiring feed and pushing the new series to the chart.

---

## 8) Events and Callbacks

- chartStatusListener?: (isChartReady: boolean) => boolean
    - Called when the chart core becomes ready. Return value is ignored by the chart; use it to trigger app-level side-effects.

- stateChangeListener?: TStateChangeListener
    - Called with granular state tags, e.g. interval change, market open/close, etc.

- onCrosshairChange?: (state?: number) => void
    - Receives crosshair state changes.

- onSettingsChange?: (newSettings: Omit<TSettings, 'activeLanguages'>) => void
    - Persist and/or react to user setting changes. Example: language or theme updates.

- getIndicatorHeightRatio?: (chart_height: number, indicator_count: number) => { height: number; percent: number }
    - Allows custom vertical allocation of bottom studies.

---

## 9) Quick Start Example

Here is a condensed example inspired by `app/index.tsx`. It shows how to wire data providers and pass required props:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import {
    SmartChart,
    ChartMode,
    StudyLegend,
    Views,
    DrawTools,
    Share,
    ToolbarWidget,
    ChartSetting,
    ChartTitle,
} from '@deriv-com/smartcharts';
import { TQuote, TGranularity, TGetQuotesResult, ActiveSymbols } from 'src/types';

// 1) Implement data providers:
const subscribeQuotes = (
    { symbol, granularity }: { symbol: string; granularity?: number },
    callback: (quote: TQuote) => void
) => {
    // Subscribe to your WS and convert into TQuote in the callback.
    // Return function to unsubscribe.
    return () => {
        /* unsubscribe logic */
    };
};

const getQuotes = async ({
    symbol,
    granularity,
    count,
    start,
    end,
}: {
    symbol: string;
    granularity: number;
    count: number;
    start?: number;
    end?: number;
}): Promise<TGetQuotesResult> => {
    // Fetch history via REST/WS, then convert to {candles} or {history}.
    return { candles: [] };
};

const unsubscribeQuotes = (/* request?: TGetQuotesRequest */) => {
    // Stop streaming by subscription id
};

// 2) Provide initial lists (ActiveSymbols + TradingTimes map):
const chartData = {
    activeSymbols: [] as ActiveSymbols,
    tradingTimes: {} as Record<string, { isOpen: boolean; openTime: string; closeTime: string }>,
};

const App = () => {
    const isMobile = /mobi/i.test(navigator.userAgent);
    const [settings, setSettings] = React.useState({
        language: 'en',
        theme: 'dark',
    });

    return (
        <SmartChart
            id='chart-1'
            symbol='R_100'
            isMobile={isMobile}
            settings={settings}
            onSettingsChange={setSettings}
            chartType='line'
            granularity={0 as TGranularity}
            getQuotes={getQuotes}
            subscribeQuotes={subscribeQuotes}
            unsubscribeQuotes={unsubscribeQuotes}
            chartData={chartData}
            topWidgets={() => <ChartTitle />}
            toolbarWidget={() => (
                <ToolbarWidget>
                    <ChartMode />
                    <StudyLegend />
                    <Views />
                    <DrawTools />
                    <Share />
                </ToolbarWidget>
            )}
            chartControlsWidgets={() => <ChartSetting />}
            enabledChartFooter
            isLive
        />
    );
};

createRoot(document.getElementById('root')!).render(<App />);
```

---

## 10) Implementation Notes and Best Practices

- Always return a proper unsubscribe function from `subscribeQuotes`, and also implement `unsubscribeQuotes` to forget server-side subscriptions.
- When emitting TQuote in live callbacks:
    - For ticks, set `tick` and `Close` accordingly; set `Date` using the tick epoch.
    - For candles, set `ohlc` and OHLC/Close; set `Date` using `open_time` or start of the candle.
- Provide both `activeSymbols` and `tradingTimes` via `chartData`. SmartChart builds symbol maps, decimal places (pip), and open/close behavior from them.
- Delayed markets: If `delay_amount` exists for a symbol, SmartChart will notify and route through a delayed subscription; quotes are still streamed but delayed.
- Contracts/markers: Provide `epoch` per marker; omit `quote` to let SmartChart interpolate the Y position at that epoch. Keep any extra fields consistent with your Flutter chart handler.
- Language/theme changes: If your app toggles settings, call `onSettingsChange` with a new TSettings; SmartChart will update theme and re-render accordingly.
- Pagination: The chart will ask for older data when the user scrolls; SmartChart calls your providers automatically via Feed → BinaryAPI abstraction.

---

## 11) Where to Look in Code

- SmartChart wrapper: `src/components/SmartChart.tsx`
- Chart body and layout: `src/components/Chart.tsx`
- Main store wiring: `src/store/index.ts` (MainStore) and `src/store/ChartStore.ts`
- Chart state machine and prop propagation: `src/store/ChartState.ts`
- Flutter chart adapter/interop: `src/store/ChartAdapterStore.ts`
- Data ingestion: `src/feed/Feed.ts` and `src/binaryapi/BinaryAPI.ts`
- Types: `src/types/props.types.ts` and `src/types/api-types.ts`
- Full working sample: `app/index.tsx`

---

## 12) Troubleshooting

- No data showing:
    - Ensure `getQuotes` returns candles or history according to granularity.
    - Ensure `subscribeQuotes` is invoked and invokes its callback with TQuote.
    - Pass `chartData.activeSymbols` with correct `pip`/`symbol` fields.
- Markers not visible:
    - Check `contracts_array` markers contain `epoch` and that the epoch fits within the visible range.
- Crosshair/scroll issues on mobile:
    - See `ChartAdapterStore` logic for `isVerticalScrollEnabled`, scroll blocking, and touch handling.

---

This guide should be sufficient to integrate SmartChart with your own data transport and UI, using the public TChartProps and type contracts provided by the library.
