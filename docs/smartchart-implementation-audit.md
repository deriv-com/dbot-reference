# SmartChart Implementation Audit vs docs/derivative-chart.md

Scope

- Goal: Verify current integration of @deriv-com/derivatives-charts SmartChart in this repo matches the contracts and workflow prescribed by docs/derivative-chart.md.
- Key areas:
    - Required network functions (requestAPI/requestSubscribe/requestForget/requestForgetStream)
    - Request/response shapes and streaming behavior
    - Lifecycle and cleanup
    - Assets and public path
    - Type contract and version alignment

Summary Verdict

- Status: Partially compliant
- Strong matches:
    - SmartChart usage is present with correct CSS import and asset public path.
    - requestAPI and requestSubscribe are implemented and passed to SmartChart.
- Conflicts to address (highest impact first):
    1. requestForget and requestForgetStream passed as no-ops (prevents library-driven unsubscription).
    2. requestSubscribe forwards all websocket messages (no filtering by subscription id).
    3. Local type declarations for SmartChart contracts diverge from docs (can hide runtime contract mismatches).
    4. isConnectionOpened is evaluated only as “instance exists”, not actual WS open state.
    5. Cleanup uses forgetAll('ticks') but does not unsubscribe local Rx subscriptions per stream id (risk of dangling listeners).

If these are fixed, the integration will align closely with the documented behavior.

---

Evidence Mapping

1. Where SmartChart is used

- File: src/pages/chart/chart.tsx

Key excerpt (abbreviated):

```tsx
import { ChartTitle, SmartChart } from '@deriv-com/derivatives-charts';
import '@deriv-com/derivatives-charts/dist/smartcharts.css';

const requestAPI = (req: ServerTimeRequest | ActiveSymbolsRequest | TradingTimesRequest) => {
    return chart_api.api.send(req);
};
const requestForgetStream = (subscription_id: string) => {
    subscription_id && chart_api.api.forget(subscription_id);
};

const requestSubscribe = async (req: TicksStreamRequest, callback: (data: any) => void) => {
    try {
        requestForgetStream(chartSubscriptionIdRef.current);
        const history = await chart_api.api.send(req);
        setChartSubscriptionId(history?.subscription.id);
        if (history) callback(history);
        if (req.subscribe === 1) {
            subscriptions[history?.subscription.id] = chart_api.api
                .onMessage()
                ?.subscribe(({ data }: { data: TicksHistoryResponse }) => {
                    callback(data);
                });
        }
    } catch (e) {
        /* ... */
    }
};

<SmartChart
    id='dbot'
    /* ... */
    requestAPI={requestAPI}
    requestForget={() => {}}
    requestForgetStream={() => {}}
    requestSubscribe={requestSubscribe}
    /* ... */
/>;
```

Observations:

- requestAPI implemented correctly (forwards opaque request object).
- requestSubscribe present, sets a subscription id and hooks a global onMessage() stream.
- requestForget and requestForgetStream are passed as no-ops despite working requestForgetStream being defined locally (not passed).
- A component-level unmount cleanup calls chart_api.api.forgetAll('ticks') (via useEffect cleanup).

2. Assets and public path

- File: src/app/app-content.jsx

```tsx
import { setSmartChartsPublicPath } from '@deriv-com/derivatives-charts';
/* ... */
React.useEffect(() => {
    setSmartChartsPublicPath(getUrlBase('/js/smartcharts/'));
}, []);
```

- File: rsbuild.config.ts

```ts
output: {
  copy: [
    { from: 'node_modules/@deriv-com/derivatives-charts/dist/*', to: 'js/smartcharts/[name][ext]' },
    { from: 'node_modules/@deriv-com/derivatives-charts/dist/chart/assets/*', to: 'assets/[name][ext]' },
    { from: 'node_modules/@deriv-com/derivatives-charts/dist/chart/assets/fonts/*', to: 'assets/fonts/[name][ext]' },
    { from: 'node_modules/@deriv-com/derivatives-charts/dist/chart/assets/shaders/*', to: 'assets/shaders/[name][ext]' },
    { from: path.join(__dirname, 'public') },
  ],
},
```

Observations:

- Matches the doc: CSS is imported and chunks are on /js/smartcharts/, with setSmartChartsPublicPath pointing there.
- Required assets (fonts, shaders) are correctly copied.

3. Local Type Declarations (shim)

- File: src/types/derivatives-charts.d.ts

```ts
export interface SmartChartProps {
    /* ... */
    requestAPI?: (req: any) => Promise<any>;
    requestForget?: () => void;
    requestForgetStream?: () => void;
    requestSubscribe?: (req: any, callback: (data: any) => void) => Promise<void>;
    /* ... */
}
```

Observations:

- Diverges from the doc (which specifies requestForget(req, cb), requestForgetStream(id: string), requestSubscribe returns void).
- This can mask contract mismatches at compile-time.

4. Package Version Alignment

- package.json: "@deriv-com/derivatives-charts": "^1.1.3"
- package-lock.json resolved: 1.1.4

Observations:

- A newer version is installed than declared. Not a direct issue but relevant when aligning contracts; ensure docs reflect the package’s runtime behavior.

---

Conflicts vs docs/derivative-chart.md

1. requestForget and requestForgetStream not wired

- Doc Requires:
    - requestForget: (request, callback) => void
    - requestForgetStream?: (id: string) => void
- Current Code:
    - Passes requestForget={() => {}} and requestForgetStream={() => {}} to SmartChart.
    - A working requestForgetStream is defined locally but not passed.
- Impact:
    - SmartChart cannot explicitly instruct the host to forget the old streams on symbol/granularity changes or during its own destroy() lifecycle.
    - Current workaround:
        - requestSubscribe() proactively forgets the last stream id.
        - Unmount cleanup calls forgetAll('ticks').
    - Risks:
        - Dangling subscriptions if library invokes requestForget/requestForgetStream which are no-ops.
        - Possible unintended messages received by the chart after symbol/timeframe changes.

2. requestSubscribe message dispatch is not filtered by subscription.id

- Doc Guidance:
    - Keep association of request ↔ callback OR subscription id ↔ callback.
    - Dispatch only the stream updates for that subscription id to the supplied callback.
- Current Code:
    - Subscribes to chart_api.api.onMessage() globally and forwards every incoming data event to the SmartChart callback.
- Impact:
    - The chart callback may receive unrelated messages (e.g., proposal, balance, open contract, other subscriptions), violating the “per-stream” isolation.
    - Increased risk of race conditions, wrong symbol updates, or chart glitches on multi-source traffic.

3. Type contract divergence in local declarations

- Doc Contracts:
    - requestSubscribe returns void.
    - requestForget(request, cb) and requestForgetStream(id: string) exist.
- Current Type Shim:
    - requestSubscribe returns Promise<void>;
    - requestForget: () => void and requestForgetStream: () => void (no parameters).
- Impact:
    - Type signatures no longer help catch incorrect wiring.
    - At runtime, SmartChart may invoke with arguments; the provided functions ignore them.

4. isConnectionOpened semantics

- Doc:
    - isConnectionOpened guides reconnection patch behaviors.
- Current Code:
    - const is_connection_opened = !!chart_api?.api;
- Impact:
    - A truthy api instance doesn’t guarantee WS connection is open (readyState === 1).
    - SmartChart may misinterpret connection state and skip/trigger patches incorrectly.

5. Cleanup robustness

- Current Cleanup:
    - On component unmount: chart_api.api.forgetAll('ticks').
    - No explicit unsubscribe on the Rx subscription stored under subscriptions[subscription.id].
- Impact:
    - Rx subscription may continue listening until GC or WS close, even after server-side forget. Proper unsubscribe reduces memory and event noise.

---

Request/Response Shapes Alignment

- requestAPI(req)
    - Forwards opaque Deriv-style requests (active_symbols, trading_times, time, ticks_history).
    - Aligns with doc’s “SmartChart forwards request objects as-is”.
- requestSubscribe(req, callback)
    - Sends req; if subscribe is on, library likely expects streaming “tick/ohlc” messages in the same shape as doc examples (msg_type, tick/ohlc, subscription.id).
    - Current code relays the first response (history) and then forwards every subsequent onMessage event (unfiltered).
- Suggested alignment:
    - Ensure req includes subscribe: 1 when required.
    - Filter stream messages by subscription.id before invoking callback.

---

Remediation Plan (Concrete Patches)

1. Pass working forget functions to SmartChart

- Replace the no-ops with actual implementations.

Before (src/pages/chart/chart.tsx):

```tsx
<SmartChart
    /* ... */
    requestForget={() => {}}
    requestForgetStream={() => {}}
    /* ... */
/>
```

After:

```tsx
// Keep a local map if you later expand to multi-stream usage:
const rxSubscriptions: Record<string, { unsubscribe?: () => void } | undefined> = {};

const requestForget = (_req?: any, _cb?: any) => {
    const id = chartSubscriptionIdRef.current;
    if (id) {
        // Unsubscribe local Rx listener first (defensive)
        rxSubscriptions[id]?.unsubscribe?.();
        delete rxSubscriptions[id];
        chart_api.api.forget(id);
    }
};

<SmartChart
    /* ... */
    requestForget={requestForget}
    requestForgetStream={requestForgetStream} // the existing function you already defined
    /* ... */
/>;
```

2. Filter onMessage by subscription id (per-stream isolation)
   Before:

```ts
subscriptions[history?.subscription.id] = chart_api.api.onMessage()?.subscribe(({ data }) => {
    callback(data);
});
```

After:

```ts
const currentId = history?.subscription?.id;
if (currentId) {
    // Unsubscribe any previous Rx listener for the last id
    const prevId = chartSubscriptionIdRef.current;
    if (prevId && rxSubscriptions[prevId]) {
        rxSubscriptions[prevId]?.unsubscribe?.();
        delete rxSubscriptions[prevId];
    }

    rxSubscriptions[currentId] = chart_api.api.onMessage()?.subscribe(({ data }: { data: any }) => {
        if (data?.subscription?.id === currentId) {
            callback(data);
        }
    });
}
```

3. Make isConnectionOpened reflect actual socket state
   Before:

```ts
const is_connection_opened = !!chart_api?.api;
```

After:

```ts
const is_connection_opened = chart_api?.api?.connection?.readyState === 1;
```

4. Optional: align local type declarations to doc contracts

- File: src/types/derivatives-charts.d.ts
- Update signatures to match docs (and what you intend to pass):

```ts
export interface SmartChartProps {
    /* ... */
    requestAPI?: (req: any) => Promise<any>;
    requestSubscribe?: (req: any, callback: (data: any) => void) => void; // return void
    requestForget?: (req: any, callback: (data: any) => void) => void; // include args
    requestForgetStream?: (id: string) => void; // include id
    /* ... */
}
```

Note: Changing the d.ts is not required for runtime but helps catch mismatches during development. Ensure this matches the actual library prop contracts for the installed version.

5. Ensure robust unmount cleanup

- In addition to server-side forgetAll('ticks'), also:
    - Unsubscribe any active Rx subscription stored under rxSubscriptions[currentId].
    - Clear any local state referencing old ids.

---

QA Checklist (Post-Fix)

- Subscription lifecycle
    - On symbol change:
        - SmartChart calls requestForget/Stream for the old stream → server unsubscribes.
        - Local Rx subscription is unsubscribed and removed.
        - New requestSubscribe starts and only the new subscription id events reach the callback.

- Noise isolation
    - Global onMessage events for other msg_types do not reach the chart callback (verify by logging data.msg_type and data.subscription?.id checks).

- Reconnection behavior
    - With isConnectionOpened using readyState, SmartChart patches refreshes only when the socket is actually open.

- Assets
    - CSS and chunks load via /js/smartcharts/ with no 404s.

- Types
    - Locally updated d.ts matches runtime usage; TypeScript flags if wrong function signatures are passed.

---

Conclusion

- The current integration is close and functional in basic scenarios but deviates from the documented SmartChart contracts in unsubscription and stream dispatch.
- Wiring the forget functions properly and filtering stream messages by subscription id will bring it in line with docs/derivative-chart.md and mitigate risks of dangling subscriptions or noisy callbacks.
- Consider aligning local type definitions and the isConnectionOpened semantics for more accurate behavior and better developer feedback.

Appendix: Key References

- SmartChart usage and network functions: src/pages/chart/chart.tsx
- Public path and chunk distribution:
    - src/app/app-content.jsx (setSmartChartsPublicPath)
    - rsbuild.config.ts (copy assets)
- Local SmartChart type shim: src/types/derivatives-charts.d.ts
- Deriv API integration used by chart page: src/external/bot-skeleton/services/api/chart-api.js
- Package versions:
    - package.json: "@deriv-com/derivatives-charts": "^1.1.3"
    - package-lock.json: resolved 1.1.4
