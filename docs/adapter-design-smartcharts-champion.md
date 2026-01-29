# Adapter Design: Client App ➜ @deriv-com/smartcharts-champion

Objective

- Keep existing data sources and WS transport in the client app unchanged.
- Introduce a thin adapter that transforms existing requests/responses and reference data to the shape and function contracts required by smartcharts-champion as specified in docs/SmartChart.md.
- Expose a stable adapter interface used only by the Chart page so the rest of the app remains untouched.

What smartcharts-champion expects (from docs/SmartChart.md)

- Functions:
    - getQuotes(params): Promise<TGetQuotesResult>
    - subscribeQuotes(params, callback): () => void // MUST return an unsubscribe function
    - unsubscribeQuotes(request?, callback?) => void // optional; a convenience forget
- Data passed via chartData:
    - activeSymbols: ActiveSymbols
    - tradingTimes: TradingTimesMap
- Types (minimum set):
    - TGranularity
    - TGetQuotesRequest, TGetQuotesResult
    - TQuote for streaming callbacks
    - ActiveSymbols, TradingTimesMap

---

Existing codebase: what we can reuse

Transport (WebSocket + helpers)

- chart_api.api (src/external/bot-skeleton/services/api/chart-api.js) provides:
    - send(request): Promise<any>
    - onMessage(): Observable<{ data: any }> | undefined
    - forget(subscription_id: string): void
    - forgetAll('ticks'): void (exists but should be avoided in favor of targeted forget by id)
- Shaping:
    - send is used for both one-shot and subscribe requests.
    - onMessage streams ALL WS frames; we must filter by subscription.id to isolate the stream.

Reference data (Active Symbols + Trading Times)

- Active symbols enrichment pipeline (src/external/bot-skeleton/services/api/api-base.ts and active-symbols.js):
    - ApiHelpers.instance.active_symbols.[active_symbols] holds the computed list ready for UI.
    - Includes pip sizes and display names. Backward-compat guard: some places use underlying_symbol vs symbol.
- Trading times (src/external/bot-skeleton/services/api/trading-times.js):
    - trading_times structure contains is_opened and times (open/close).
    - We must map to { isOpen, openTime, closeTime } per symbol.

Chart page today (src/pages/chart/chart.tsx)

- Currently wires @deriv-com/derivatives-charts with requestAPI/requestSubscribe/requestForget\*.
- We will replace the SmartChart provider props with adapter.getQuotes/subscribeQuotes/unsubscribeQuotes and pass chartData from adapter.

---

Adapter high-level design

Create a single module that binds the existing transport and services to champion contracts:

- File: src/adapters/smartcharts-champion/index.ts
- Public API:
    - buildSmartchartsChampionAdapter(deps): SmartchartsChampionAdapter
- Deps signature:
    - transport: { send: (req: any) => Promise<any>; onMessage: () => { subscribe(cb): Subscription }; forget: (id: string) => void; }
    - services: { getActiveSymbols(): Promise<ActiveSymbols> | ActiveSymbols; getTradingTimes(): Promise<any> | any; }
- Returns:
    - getQuotes(params): Promise<TGetQuotesResult>
    - subscribeQuotes(params, onQuote): () => void
    - unsubscribeQuotes?(request?, cb?)
    - getChartData(): Promise<{ activeSymbols: ActiveSymbols; tradingTimes: TradingTimesMap }>

---

Interfaces required for the transformation

Types (ts interfaces for adapter boundaries)

- src/types/smartchart.types.ts (new)
    - TGranularity
    - TGetQuotesRequest
    - TGetQuotesResult
    - TQuote
    - ActiveSymbol, ActiveSymbols
    - TradingTimesMap

Minimal definitions:

```ts
// [AI] src/types/smartchart.types.ts (summary, see migration doc for full)
export type TGranularity = 0 | 60 | 120 | 180 | 300 | 600 | 900 | 1800 | 3600 | 7200 | 14400 | 28800 | 86400;

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
    history?: { prices: number[]; times: number[] };
};

export type TQuote = {
    Date: string;
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

export type TradingTimesMap = Record<string, { isOpen: boolean; openTime: string; closeTime: string }>;
// [/AI]
```

Adapter interfaces:

```ts
// [AI] Suggested adapter surface (src/adapters/smartcharts-champion/types.ts)
import {
    TGranularity,
    TGetQuotesRequest,
    TGetQuotesResult,
    TQuote,
    ActiveSymbols,
    TradingTimesMap,
} from '@/types/smartchart.types';

export type TTransport = {
    send: (req: any) => Promise<any>;
    onMessage: () => { subscribe: (cb: (payload: { data: any }) => void) => { unsubscribe?: () => void } };
    forget: (id: string) => void;
};

export type TServices = {
    getActiveSymbols: () => Promise<ActiveSymbols> | ActiveSymbols;
    getTradingTimes: () => Promise<any> | any; // source internal type, we will map to TradingTimesMap
};

export type SmartchartsChampionAdapter = {
    getQuotes: (params: TGetQuotesRequest) => Promise<TGetQuotesResult>;
    subscribeQuotes: (
        params: { symbol: string; granularity: TGranularity },
        onQuote: (q: TQuote) => void
    ) => () => void;
    unsubscribeQuotes?: (request?: TGetQuotesRequest, cb?: (resp: any) => void) => void;
    getChartData: () => Promise<{ activeSymbols: ActiveSymbols; tradingTimes: TradingTimesMap }>;
};
// [/AI]
```

---

Transformations (exact mapping rules)

1. One-shot history → TGetQuotesResult

- Input: Deriv WS ticks_history (for ticks or candles)
- If granularity = 0:
    - Request: { ticks_history: symbol, end: 'latest' or end, adjust_start_time: 1, count: String(count), ...(start?) }
    - Response: resp.history: { prices: number[], times: number[] }
    - Output: { history: { prices, times } }
- If granularity > 0:
    - Request: { ticks_history: symbol, style: 'candles', granularity, count, end, adjust_start_time: 1, ...(start?) }
    - Response: resp.candles: Array<{ open, high, low, close, epoch|open_time }>
    - Output: { candles: map each to { open, high, low, close, epoch } } (epoch := c.epoch || c.open_time as number)

2. Streaming → TQuote

- First response to subscribe request often contains subscription.id and a data payload (tick or ohlc).
- Ticks (granularity = 0):
    - Input: msg.msg_type === 'tick' and msg.tick: { epoch, quote, symbol, id? }, subscription.id present
    - Output TQuote: { Date: String(epoch), Close: Number(quote), tick: msg.tick }
- Candles (granularity > 0):
    - Input: msg.msg_type === 'ohlc' and msg.ohlc: { open, high, low, close, open_time }, subscription.id present
    - Output TQuote: { Date: String(open_time), Open: Number(open), High: Number(high), Low: Number(low), Close: Number(close), ohlc: msg.ohlc }
- Isolation: Only forward messages where data.subscription.id === currentId to onQuote.

3. ActiveSymbols → ActiveSymbols (champion)

- Source: ApiHelpers.instance.active_symbols.active_symbols (already enriched)
- Ensure each object includes fields used by UI and pip size. If only symbol exists (no underlying_symbol), keep symbol. If both exist in app, prefer symbol for champion.
- Champion list can be passed as-is if it already matches fields defined above; otherwise map keys to match.

4. Trading Times → TradingTimesMap

- Source: trading-times.js structure per symbol:
    - { is_opened, times: { open_time, close_time }, is_open_all_day?, is_closed_all_day? ... }
- Output per symbol:
    - { isOpen: Boolean(is_opened), openTime: String(times.open_time), closeTime: String(times.close_time) }

---

Adapter Implementation Outline

File: src/adapters/smartcharts-champion/index.ts

```ts
import type { SmartchartsChampionAdapter, TTransport, TServices } from './types';
import type {
    TGranularity,
    TGetQuotesRequest,
    TGetQuotesResult,
    TQuote,
    TradingTimesMap,
} from '@/types/smartchart.types';

const toTGetQuotesResult = (resp: any, granularity: TGranularity): TGetQuotesResult => {
    const is_ticks = !granularity || granularity === 0;
    if (is_ticks) {
        const history = resp?.history || resp?.ticks_history || {};
        return { history: { prices: history.prices || [], times: history.times || [] } };
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

const toTQuoteFromStream = (msg: any, granularity: TGranularity): TQuote | null => {
    const is_ticks = !granularity || granularity === 0;
    if (is_ticks && msg?.tick) {
        const { epoch, quote } = msg.tick;
        return { Date: String(epoch), Close: Number(quote), tick: msg.tick };
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

const toTradingTimesMap = (src: any): TradingTimesMap => {
    const map: TradingTimesMap = {};
    if (!src) return map;
    Object.keys(src).forEach(symbol => {
        const info = src[symbol];
        map[symbol] = {
            isOpen: !!info?.is_opened,
            openTime: String(info?.times?.open_time || ''),
            closeTime: String(info?.times?.close_time || ''),
        };
    });
    return map;
};

export const buildSmartchartsChampionAdapter = (
    transport: TTransport,
    services: TServices
): SmartchartsChampionAdapter => {
    const getQuotes = async ({
        symbol,
        granularity,
        count,
        start,
        end,
    }: TGetQuotesRequest): Promise<TGetQuotesResult> => {
        const is_ticks = !granularity || granularity === 0;
        const req: any = {
            ticks_history: symbol,
            end: end ? String(end) : 'latest',
            adjust_start_time: 1,
            ...(start ? { start: String(start) } : {}),
            ...(is_ticks
                ? { style: 'ticks', count: String(count) }
                : { style: 'candles', granularity, count: String(count) }),
        };
        const resp = await transport.send(req);
        return toTGetQuotesResult(resp, granularity);
    };

    const subscribeQuotes = (
        { symbol, granularity }: { symbol: string; granularity: TGranularity },
        onQuote: (q: TQuote) => void
    ) => {
        const is_ticks = !granularity || granularity === 0;
        const req: any = is_ticks
            ? { ticks: symbol, subscribe: 1 }
            : { ticks_history: symbol, style: 'candles', granularity, subscribe: 1 };
        let currentId: string | null = null;
        let rxSub: { unsubscribe?: () => void } | undefined;

        transport.send(req).then((first: any) => {
            currentId = first?.subscription?.id || null;
            const firstQuote = toTQuoteFromStream(first, granularity);
            if (firstQuote) onQuote(firstQuote);

            rxSub = transport.onMessage()?.subscribe(({ data }: { data: any }) => {
                if (data?.subscription?.id === currentId) {
                    const q = toTQuoteFromStream(data, granularity);
                    if (q) onQuote(q);
                }
            });
        });

        return () => {
            rxSub?.unsubscribe?.();
            if (currentId) transport.forget(currentId);
        };
    };

    const unsubscribeQuotes = (_req?: TGetQuotesRequest) => {
        // Optional convenience: if you keep a request->id map, forget by id here.
        // Default approach: rely on the unsubscribe function returned by subscribeQuotes.
    };

    const getChartData = async () => {
        const activeSymbols = await services.getActiveSymbols();
        const rawTradingTimes = await services.getTradingTimes();
        const tradingTimes = toTradingTimesMap(rawTradingTimes);
        return { activeSymbols, tradingTimes };
    };

    return { getQuotes, subscribeQuotes, unsubscribeQuotes, getChartData };
};
```

---

Wiring the adapter in the Chart page

Replace @deriv-com/derivatives-charts with @deriv-com/smartcharts-champion and use the adapter’s functions.

- Create a builder for services:
    - getActiveSymbols: use ApiHelpers.instance.active_symbols.active_symbols (array)
    - getTradingTimes: read from your trading-times service or cache (src/external/bot-skeleton/services/api/trading-times.js)

- Build the adapter once (React useMemo) and pass functions to SmartChart.

Example integration:

```tsx
// [AI] src/pages/chart/chart.tsx (highlights)
import {
    SmartChart,
    ChartTitle,
    ToolbarWidget,
    ChartMode,
    StudyLegend,
    Views,
    DrawTools,
    Share,
} from '@deriv-com/smartcharts-champion';
import '@deriv-com/smartcharts-champion/dist/smartcharts.css';
import chart_api from '@/external/bot-skeleton/services/api/chart-api';
import { ApiHelpers } from '@/external/bot-skeleton';
import { buildSmartchartsChampionAdapter } from '@/adapters/smartcharts-champion';
import type { ActiveSymbols } from '@/types/smartchart.types';

const adapter = buildSmartchartsChampionAdapter(
    {
        send: (req: any) => chart_api.api.send(req),
        onMessage: () => chart_api.api.onMessage(),
        forget: (id: string) => chart_api.api.forget(id),
    },
    {
        getActiveSymbols: () => {
            const maybe = ApiHelpers?.instance?.active_symbols as any;
            const list: ActiveSymbols =
                maybe?.active_symbols ?? // api-helpers.js style
                maybe ??
                []; // already an array
            return list;
        },
        getTradingTimes: () => {
            // Hook into your trading-times service/cache (ensure the raw structure has is_opened and times fields)
            // e.g., trading_times_service.trading_times
            return window.__trading_times_cache__ || {};
        },
    }
);

const Chart = observer(() => {
    // ... stores, settings, symbol, chart_type, granularity, etc.
    const [chartData, setChartData] = React.useState({ activeSymbols: [], tradingTimes: {} });

    React.useEffect(() => {
        adapter.getChartData().then(setChartData);
    }, []);

    return (
        <SmartChart
            id='dbot'
            symbol={symbol}
            chartType={chart_type}
            granularity={granularity}
            isMobile={isMobile}
            settings={settings}
            getQuotes={adapter.getQuotes}
            subscribeQuotes={adapter.subscribeQuotes}
            unsubscribeQuotes={adapter.unsubscribeQuotes}
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
// [/AI]
```

---

Edge cases and behavior alignment

- Market closed:
    - Current code sometimes returns an empty array on 'MarketIsClosed'. For champion, preserve the behavior by not emitting quotes; chart will show no updates. getQuotes should still return the last available history.
- Delayed markets (delay_amount):
    - Include delay_amount in ActiveSymbols so SmartChart can handle delayed subscription UX if it supports it. No special handling needed in adapter.
- Re-subscription on symbol/granularity change:
    - Champion will call subscribeQuotes again; ensure unsubscribe function from the previous call is executed in the page logic or by SmartChart. The adapter already returns a proper unsubscribe closure.
- Pagination:
    - Champion may use jsInterop.loadHistory; you don’t need to expose anything extra—getQuotes supports start/end and count. Ensure your getQuotes handles past ranges by setting end to the requested epoch and omitting count accordingly.
- Connection state:
    - The adapter relies on transport; reconnection is handled at the transport layer (chart_api.api.init/reconnect). No extra work needed in adapter.

---

Validation checklist

- Functions:
    - getQuotes returns candles/history aligned with granularity.
    - subscribeQuotes emits only subscription-specific messages and returns an unsubscribe that calls forget(id) and unsubscribes Rx.
    - unsubscribeQuotes is available (even as a passthrough), not required if you rely on the returned unsubscribe.
- chartData:
    - activeSymbols populated and includes pip, display_name, symbol fields.
    - tradingTimes mapped to { isOpen, openTime, closeTime } per symbol string.
- UI:
    - Symbol changes and interval changes rewire correctly with no ghost updates.
    - CSS/assets loaded from @deriv-com/smartcharts-champion.
- No dangling subscriptions after unmount/navigation.

---

Implementation tasks (concise)

- Add src/types/smartchart.types.ts (as per types above).
- Add src/adapters/smartcharts-champion/types.ts and index.ts with the adapter implementation.
- Update src/pages/chart/chart.tsx:
    - Swap package to @deriv-com/smartcharts-champion and CSS path.
    - Replace previous requestAPI/requestSubscribe/requestForget\* with adapter’s getQuotes/subscribeQuotes/unsubscribeQuotes.
    - Fetch chartData via adapter.getChartData(), pass to SmartChart.
- Ensure services:
    - Expose a way to retrieve the current active symbols array and trading times map (or cache).
- Remove legacy forgetAll('ticks') in component cleanup if redundant.
- Keep subscription isolation and proper cleanup in the adapter.

This adapter approach lets the app keep its existing WS and services, while presenting the exact functions and data contracts required by smartcharts-champion. It centralizes transformations, reduces risk during migration, and keeps the rest of the app stable.
