# SmartChart: Workflow, Lifecycle, Required Props, Functions, and Data Contracts

This document provides a detailed, workflow-first reference for integrating SmartChart into your application. It focuses on:

- End-to-end workflow and lifecycle (mount → data load → updates → unmount)
- Required props and function contracts (with types)
- Exact request/response object shapes and streaming model
- Practical integration sequence and examples

Key sources:

- src/components/SmartChart.tsx
- src/components/Chart.tsx
- src/types/props.types.ts
- src/binaryapi/BinaryAPI.ts

---

## 1) High-level Workflow

SmartChart does not fetch data by itself. Your app provides network functions and data; SmartChart orchestrates requests using those functions.

Top-level flow:

1. Initialization
    - SmartChart initializes a MobX store context (initContext) once, then renders Chart within Provider.
    - Chart mounts the chart adapter, prepares UI, and pushes initial props to the store.

2. Data provisioning
    - You must provide network functions for one-shot requests and streaming.
    - SmartChart will use these to retrieve:
        - Active Symbols
        - Trading Times
        - Tick/Candle History (one-shot and/or streaming)
    - You may preload some data via initialData/chartData props to reduce API calls.

3. User interactions/prop changes
    - Changing symbol, granularity, or chart type triggers history reloads and (re)subscriptions.
    - Crosshair, controls, widgets, and dialogs update via store.

4. Unsubscribe/cleanup
    - On unmount, SmartChart tears down adapters, cancels streams (via your forget functions), and cleans internal state.

---

## 2) Lifecycle Timeline

From src/components/SmartChart.tsx and src/components/Chart.tsx

- SmartChart.tsx
    - Creates context (initContext) at first render
    - Provides store via React Context Provider
    - Renders Chart with all props you pass

- Chart.tsx (observer):
    - On first mount:
        - initGA(); logPageView();
        - updateProps(props) → put latest props into store
        - init(rootEl, props) → initializes internal chart state
        - chartAdapter.onMount(chartContainerEl) → connect DOM to renderer
    - On every render:
        - updateProps(props) → props changes are propagated to store
    - On unmount:
        - destroy() → cleans store, forgets streams, disposes resources
        - chartAdapter.onUnmount()

Additional lifecycle behaviors:

- Mobile: crosshair forced visible (state=2) to show price info
- Contracts markers updated when contracts_array changes
- UI dialogs and widgets mounted, with a dedicated modal portal (#smartcharts_modal)

---

## 3) Required Functions and Data Contracts

These functions are required. SmartChart calls them; you implement how they talk to your backend (e.g., Deriv WebSocket API).

Type aliases (from src/types/props.types.ts):

- TBinaryAPIRequest: generic request object
- TBinaryAPIResponse: generic response envelope
- TResponseAPICallback: (response: TBinaryAPIResponse) => void

Function contracts:

- requestAPI: (request: TBinaryAPIRequest) => Promise<TBinaryAPIResponse>
    - One-shot calls (e.g., active_symbols, trading_times, time, ticks_history without subscribe)

- requestSubscribe: (request: TBinaryAPIRequest, callback: TResponseAPICallback) => void
    - Start a stream and call callback(response) for each update
    - Keep association of request ↔ callback to allow requestForget

- requestForget: (request: TBinaryAPIRequest, callback: TResponseAPICallback) => void
    - Stop the stream that was begun with requestSubscribe using the same pair

- requestForgetStream?: (id: string) => void
    - Optional. If you manage subscription ids (e.g., from response.subscription.id), you can forget by id

Generic envelopes:

- TBinaryAPIRequest
    - passthrough?: Record<string, unknown>
    - req_id?: number
    - [key: string]: unknown
- TBinaryAPIResponse
    - echo_req: Record<string, unknown>
    - req_id?: number
    - msg_type: string
    - [key: string]: unknown

Practical notes:

- SmartChart forwards request objects as-is (no internal fetch). You must recognize these request shapes.
- For streaming, your transport should deliver responses to the provided callback continuously.
- Prefer requestForgetStream if you have subscription ids; otherwise rely on requestForget with the original request+callback.

---

## 4) Request/Response Shapes and Streaming Model

SmartChart (often via BinaryAPI helper) uses Deriv-like payloads for ticks history.

Ticks History (one-shot):

- Ticks (granularity 0 or undefined):

```json
{
    "ticks_history": "SYMBOL",
    "style": "ticks",
    "end": "latest",
    "count": 1000,
    "adjust_start_time": 1
}
```

- Candles (granularity > 0):

```json
{
    "ticks_history": "SYMBOL",
    "style": "candles",
    "granularity": 60,
    "end": "latest",
    "count": 1000,
    "adjust_start_time": 1
}
```

Streaming variant:

- Add `"subscribe": 1` to the above. You should then call the callback for each incoming tick/candle:

```json
{
    "msg_type": "tick",
    "tick": {
        "symbol": "SYMBOL",
        "epoch": 1725700000,
        "quote": 123.45,
        "id": "sub-123"
    },
    "subscription": { "id": "sub-123" }
}
```

Request building logic reference:

- src/binaryapi/BinaryAPI.ts (createTickHistoryRequest)
    - style = 'ticks' if granularity falsy, otherwise 'candles'
    - default count = 1000 unless start is set (then omit count)
    - end default 'latest'
    - optional start/end/subscribe/adjust_start_time

Other one-shot requests SmartChart may make via your requestAPI:

- Active Symbols:

```json
{ "active_symbols": "brief" }
```

- Trading Times:

```json
{ "trading_times": "today" }
```

- Server Time:

```json
{ "time": 1 }
```

Unsubscribe

- By request pair:
    - requestForget(request, callback)
- By subscription id (optional):
    - requestForgetStream("sub-123")

---

## 5) Props Catalog (Types and Behavior)

Full type: TChartProps (see src/types/props.types.ts). Summary by category:

Required network functions:

- requestAPI: BinaryAPI['requestAPI']
- requestSubscribe: BinaryAPI['requestSubscribe']
- requestForget: BinaryAPI['requestForget']
- requestForgetStream?: BinaryAPI['requestForgetStream']

Core identification & data:

- id?: string
    - Unique chart identifier for layout persistence; if omitted, no persistence
- symbol?: string
- granularity?: TGranularity (0 = ticks, >0 = candle size in seconds)
- chartType?: string (see ChartTypes in src/Constant.tsx)
- feedCall?: { activeSymbols?: boolean; tradingTimes?: boolean }
    - Hint for what SmartChart may request

Settings & behavior:

- settings?: TSettings
    - { countdown?, historical?, lang?, language?, minimumLeftBars?, position?, enabledNavigationWidget?, isAutoScale?, isHighestLowestMarkerEnabled?, theme?, activeLanguages?, whitespace? }
- onSettingsChange?: (newSettings: Omit<TSettings, 'activeLanguages'>) => void
- isAnimationEnabled?: boolean
- isVerticalScrollEnabled?: boolean
- isMobile?: boolean
- enableRouting?: boolean
- allowTickChartTypeOnly?: boolean
- isConnectionOpened?: boolean
    - If provided, SmartChart patches/refreshes based on reconnection and granularity
- shouldFetchTradingTimes?: boolean (default true)
- shouldFetchTickHistory?: boolean (default true)
- shouldDrawTicksFromContractInfo?: boolean
- isLive?: boolean
- startWithDataFitMode?: boolean
- enableScroll?: boolean|null
- enableZoom?: boolean|null
- zoom?: number
- yAxisMargin?: { bottom: number; top: number }
- leftMargin?: number
- anchorChartToLeft?: boolean
- margin?: number
- scrollToEpoch?: number|null
- startEpoch?: number
- endEpoch?: number
- crosshairState?: number|null
- onCrosshairChange?: (state?: number) => void
- onGranularityChange?: (granularity?: TGranularity) => void
- onChartTypeChange?: (chartType?: string) => void

Data injection/preload:

- initialData?: TInitialChartData
- chartData?: TInitialChartData
    - TInitialChartData = { masterData?: TQuote[]; tradingTimes?: TradingTimesResponse['trading_times']; activeSymbols?: ActiveSymbols }
- networkStatus?: TNetworkConfig ({ class: string; tooltip: string })

Contracts & overlays:

- contracts_array?: any[] (markers)
- contractInfo?: ProposalOpenContract
- allTicks?: keyof AuditDetailsForExpiredContract | []
- barriers?: TBarrierUpdateProps[]
    - Has visual config and onChange({ high?, low? })

Callbacks and helpers:

- onMessage?: (message: TNotification) => void
- clearChart?: () => void
- refreshActiveSymbols?: ChartState['refreshActiveSymbols']
- chartStatusListener?: ChartState['chartStatusListener']

Widgets and composition:

- topWidgets?: () => React.ReactElement (default renders ChartTitle)
- bottomWidgets?: () => React.ReactElement
- toolbarWidget?: () => React.ReactElement
- chartControlsWidgets?: (({ isMobile?: boolean }) => React.ReactElement) | null
- enabledChartFooter?: boolean (default true)
- enabledNavigationWidget?: boolean (default true)
- children?: React.ReactNode
- historical?: boolean (affects height on mobile)

Refs (imperative handle):

- ref?: React.RefObject<{ hasPredictionIndicators(): void; triggerPopup(arg: () => void): void }>

---

## 6) Quotes, History, and Pagination

Quote shape used internally (TQuote):

```ts
type TQuote = {
    Date: string; // epoch or ISO as string
    Close: number;
    Open?: number;
    High?: number;
    Low?: number;
    Volume?: number;
    tick?: TicksStreamResponse['tick']; // for tick streams
    ohlc?: OHLCStreamResponse['ohlc']; // for candle streams
    DT?: Date;
    prevClose?: number;
};
```

Pagination & loading older history (JS Interop):

- SmartChart can request more history via window.jsInterop.loadHistory(params)
- Type: TLoadHistoryParams = { count: number; end: number }
- Typical host behavior:
    - Handle loadHistory by calling your requestAPI with a ticks_history request that sets end to the provided epoch, to fetch older data, then pass it back to SmartChart via the normal "history" response flow.

---

## 7) Concrete Implementation Example (TypeScript)

Below is a practical Deriv WebSocket-style implementation for the required functions, including subscribe/forget handling with subscription ids.

```ts
type Request = Record<string, unknown>;
type Response = {
    msg_type: string;
    echo_req?: Record<string, unknown>;
    req_id?: number;
    subscription?: { id: string };
} & Record<string, any>;

const ws = new WebSocket('wss://deriv.example/ws');
let nextReqId = 1;

const pending = new Map<number, { resolve: (resp: Response) => void; reject: (e: any) => void }>();
const subIdToCallback = new Map<string, (resp: Response) => void>();
const requestToSubId = new Map<string, string>(); // JSON.stringify(request) -> subscription id

ws.onmessage = ev => {
    const msg: Response = JSON.parse(ev.data);

    // Resolve one-shot requests by req_id
    if (msg.req_id && pending.has(msg.req_id)) {
        const { resolve } = pending.get(msg.req_id)!;
        resolve(msg);
        pending.delete(msg.req_id);
    }

    // Dispatch streaming updates by subscription id
    const subId = msg.subscription?.id;
    if (subId && subIdToCallback.has(subId)) {
        subIdToCallback.get(subId)!(msg);
    }
};

export const requestAPI = (request: Request): Promise<Response> => {
    const req_id = nextReqId++;
    ws.send(JSON.stringify({ ...request, req_id }));
    return new Promise((resolve, reject) => pending.set(req_id, { resolve, reject }));
};

export const requestSubscribe = (request: Request, callback: (resp: Response) => void): void => {
    // Ensure subscribe flag
    const subRequest = { ...request, subscribe: 1 };
    ws.send(JSON.stringify(subRequest));

    // Bridge first response to learn subscription id and bind callback
    const req_id = nextReqId++;
    ws.send(JSON.stringify({ ping: 1, req_id })); // dummy to allocate a req_id if needed; optional pattern

    // In practice, you will receive a first stream message containing subscription.id:
    // When that message arrives, bind subId -> callback and store request -> subId mapping.
    // If your backend emits subscription.id on the first data message, handle that in ws.onmessage.
    // Example binding logic (pseudo):
    // on first message for this request:
    //   const id = message.subscription.id;
    //   subIdToCallback.set(id, callback);
    //   requestToSubId.set(JSON.stringify(subRequest), id);
};

export const requestForget = (request: Request, _callback: (resp: Response) => void): void => {
    // If you can derive subId from the request, prefer id-based forget:
    const key = JSON.stringify({ ...request, subscribe: 1 });
    const subId = requestToSubId.get(key);
    if (subId) {
        requestForgetStream(subId);
        requestToSubId.delete(key);
        subIdToCallback.delete(subId);
        return;
    }

    // Fallback: if your transport supports sending a "forget" with the original request/callback shape, do it here.
    // Otherwise ensure your requestSubscribe stored enough info to forget reliably.
};

export const requestForgetStream = (subscription_id: string): void => {
    ws.send(JSON.stringify({ forget: subscription_id }));
};
```

Notes:

- The exact mechanics of capturing the first stream message to learn subscription.id depend on your backend and message routing logic. The important part: bind subscription.id -> callback so you can forget by id later.

---

## 8) End-to-end Integration Sequence

Initial render:

1. Include CSS and chunks, set the public path:
    - import { setSmartChartsPublicPath } from '@deriv-com/derivatives-charts'
    - setSmartChartsPublicPath('/dist/')
    - Ensure /dist/smartcharts.css and _.smartcharts._ are deployed and accessible

2. Provide required functions and minimal props:

```tsx
<SmartChart
    requestAPI={requestAPI}
    requestSubscribe={requestSubscribe}
    requestForget={requestForget}
    requestForgetStream={requestForgetStream} // optional
    id='main-chart'
    symbol='R_100'
    granularity={0}
/>
```

3. SmartChart mounts:
    - Initializes context
    - Chart mounts, chartAdapter connects to DOM
    - updateProps pushes props into store

4. Data requests made through your functions:
    - active_symbols (optional; or preload via initialData)
    - trading_times (optional; or preload via initialData)
    - ticks_history (one-shot and/or subscribe) for symbol/granularity

5. User changes symbol or granularity:
    - SmartChart will:
        - requestForget/requestForgetStream old streams
        - issue new history and subscribe requests for the new state

6. Unmount:
    - destroy() tears down state
    - Adapter unmounted
    - All streams are forgotten via your functions

---

## 9) DOM and CSS Structure (Essentials)

Containers/classes:

- Root: .smartcharts.smartcharts-{theme}
- Mode: .smartcharts-mobile or .smartcharts-desktop
- Responsive: .smartcharts-{containerWidth} (on desktop)
- Modal root: #smartcharts_modal (portals)

Always include smartcharts.css on the page.

---

## 10) Troubleshooting and Best Practices

- Missing chunks (_.smartcharts._ 404):
    - Call setSmartChartsPublicPath('/dist/') to match deployed path
    - Copy chunks from node_modules package to your public dist

- No styles / broken layout:
    - Ensure smartcharts.css is included

- Double or dangling subscriptions:
    - Key your subscriptions by (request+callback) or by derived subscription id
    - Implement requestForgetStream if possible

- Reconnect behavior:
    - Provide isConnectionOpened so SmartChart can patch/refresh appropriately

- Preloading:
    - Use initialData/chartData to cut round trips for activeSymbols/tradingTimes/masterData

---

## 11) Reference Types (Selected)

From src/types/props.types.ts (see file for full declarations):

- TRequestAPI, TRequestSubscribe, TRequestForget, TRequestForgetStream
- TBinaryAPIRequest, TBinaryAPIResponse
- TQuote
- TInitialChartData
- TSettings
- TBarrierUpdateProps, TBarrierChangeParam
- TLoadHistoryParams
- TNetworkConfig
- TNotification

BinaryAPI helper: src/binaryapi/BinaryAPI.ts

- Provides createTickHistoryRequest, getActiveSymbols, getTradingTimes, subscribeTickHistory, forget, forgetStream
- Uses a key of "symbol-granularity" to group streams

---

This guide is designed to map 1:1 with the codebase responsibilities and expected contracts, so you can integrate SmartChart deterministically and debug issues quickly.
