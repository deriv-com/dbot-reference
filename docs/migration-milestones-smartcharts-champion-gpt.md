# Migration Milestones Tracker: derivatives-charts ➜ @deriv-com/smartcharts-champion

Purpose

- Provide a milestone-based, step-by-step plan to implement the adapter and migrate the chart integration with minimal risk.
- Each milestone includes scope, detailed tasks (checklists), deliverables, acceptance criteria, dependencies, risks, and suggested estimates.

Scope Baseline (inputs this plan builds on)

- docs/migration-derivatives-charts-to-smartchart-champion.md
- docs/adapter-design-smartcharts-champion.md
- docs/smartchart-implementation-audit.md
- docs/SmartChart.md (target contracts)

---

Milestone 0 — Planning, Alignment, and Environment
Goal: Confirm approach, package, and environment; align stakeholders and freeze scope.

- [ ] Confirm target NPM package and version
    - @deriv-com/smartcharts-champion (exact version to lock)
- [ ] Review and sign off on adapter design
    - docs/adapter-design-smartcharts-champion.md
- [ ] Review and sign off on migration plan
    - docs/migration-derivatives-charts-to-smartchart-champion.md
- [ ] Align on rollout strategy (flag-based or cut-over)
    - Feature flag key and default state
- [ ] Define owners and timelines per milestone
    - Backend/WS owner, Frontend owner, QA owner, Release owner
- [ ] Create tracking tickets per milestone in issue tracker (Jira/GitHub)
    - Link to this document in epic

Deliverables:

- Finalized plan + target timelines
- Ticket list with owners and ETAs

Acceptance Criteria:

- Stakeholder approvals documented
- Feature flag strategy documented

Dependencies:

- None

Risks:

- Scope creep; mitigated by sign-off

Estimate:

- 0.5–1 day

---

Milestone 1 — Adapter Scaffolding (Types + Core Module)
Goal: Create the adapter interfaces and base implementation (no page wiring yet).

Scope:

- Add core types and adapter module per adapter design

Tasks:

- [ ] Add types file: src/types/smartchart.types.ts
    - TGranularity, TGetQuotesRequest, TGetQuotesResult, TQuote, ActiveSymbols, TradingTimesMap
- [ ] Add adapter interfaces: src/adapters/smartcharts-champion/types.ts
    - TTransport, TServices, SmartchartsChampionAdapter
- [ ] Add adapter implementation: src/adapters/smartcharts-champion/index.ts
    - getQuotes (history via ticks_history one-shot)
    - subscribeQuotes (returns unsubscribe; filters by subscription.id; forget on cleanup)
    - unsubscribeQuotes (optional helper)
    - getChartData (activeSymbols + tradingTimes mapping)
- [ ] Unit tests (mapping correctness)
    - [ ] getQuotes: ticks → history.prices/times; candles → candles array mapping
    - [ ] subscribeQuotes: emits only matching subscription.id; unsubscribe calls forget and unsubscribes Rx
    - [ ] getChartData: tradingTimes mapping { isOpen, openTime, closeTime }

Deliverables:

- Types + adapter module with unit tests

Acceptance Criteria:

- All adapter functions compile and unit tests pass
- No imports from @deriv-com/derivatives-charts in adapter

Dependencies:

- chart_api.api available at runtime for tests (use mock)

Risks:

- Mapping drift vs. server payloads; mitigate via tests using realistic fixtures

Estimate:

- 1.5–2.5 days

---

Milestone 2 — Data Services Integration (Active Symbols + Trading Times)
Goal: Wire adapter to existing services for chartData provisioning.

Scope:

- Ensure adapter.getChartData() returns data in champion format

Tasks:

- [ ] Implement services.getActiveSymbols
    - [ ] Pull from ApiHelpers.instance.active_symbols.active_symbols (enriched)
    - [ ] Validate required fields: symbol, display_name, pip, exchange_is_open
- [ ] Implement services.getTradingTimes
    - [ ] Pull from trading-times service/cache (src/external/bot-skeleton/services/api/trading-times.js)
    - [ ] Map to TradingTimesMap: { isOpen, openTime, closeTime } per symbol
- [ ] Add adapter integration tests (service mocks)
    - [ ] getChartData returns non-empty structures when services have data
    - [ ] Handles missing/empty services gracefully (returns empty structures)

Deliverables:

- Working getChartData implementation backed by real services

Acceptance Criteria:

- chartData.activeSymbols and chartData.tradingTimes shapes match docs/SmartChart.md
- Tests cover both happy paths and empty fallback

Dependencies:

- Milestone 1

Risks:

- Service availability timing; mitigate with retries or lazy load on Chart mount

Estimate:

- 1–2 days

---

Milestone 3 — Chart Page Integration (Minimal Wiring)
Goal: Integrate adapter with SmartChart-champion on the chart page behind a flag.

Scope:

- Replace derivatives-charts props with champion providers (flagged)
- Keep existing UI/toolbar widgets where compatible

Tasks:

- [ ] Add champion imports + CSS in src/pages/chart/chart.tsx
    - import from @deriv-com/smartcharts-champion
    - CSS: @deriv-com/smartcharts-champion/dist/smartcharts.css
- [ ] Instantiate adapter in chart.tsx
    - [ ] Build transport using chart_api.api { send, onMessage, forget }
    - [ ] Build services using ApiHelpers and trading-times service/cache
- [ ] Replace SmartChart props (behind feature flag)
    - [ ] getQuotes={adapter.getQuotes}
    - [ ] subscribeQuotes={adapter.subscribeQuotes}
    - [ ] unsubscribeQuotes={adapter.unsubscribeQuotes}
    - [ ] chartData={await adapter.getChartData()}
- [ ] Remove derivatives-charts-only props from the champion path
    - requestAPI, requestSubscribe, requestForget, requestForgetStream, isConnectionOpened
- [ ] Fallback: preserve old chart path when flag OFF

Deliverables:

- Chart renders with champion integration when flag is ON

Acceptance Criteria:

- With flag ON: chart shows symbol data, ticks and candles render
- With flag OFF: current behavior unchanged
- No console errors in either path

Dependencies:

- Milestone 1–2

Risks:

- Dual-code paths complexity; mitigate with clean feature switch and typed prop sets

Estimate:

- 1–1.5 days

---

Milestone 4 — Assets and Bundler Updates
Goal: Ensure assets and CSS for champion load correctly; remove legacy copies when safe.

Scope:

- Replace copy rules in rsbuild.config.ts if champion requires dist assets

Tasks:

- [ ] Update rsbuild.config.ts
    - [ ] Copy rules for node_modules/@deriv-com/smartcharts-champion/dist/\*
    - [ ] Copy assets/fonts/shaders if provided by champion
    - [ ] Remove old derivatives-charts copy rules
- [ ] Remove/set public path init
    - [ ] If champion doesn’t need setSmartChartsPublicPath, remove call; otherwise update
- [ ] Verify runtime asset URLs and 200 responses

Deliverables:

- Correct asset pipeline for champion

Acceptance Criteria:

- No 404s for CSS and JS chunks
- SmartChart styles applied

Dependencies:

- Milestone 3 (render needs CSS)

Risks:

- Asset path mismatch; mitigate by validating dist structure and runtime URLs

Estimate:

- 0.5–1 day

---

Milestone 5 — Functional Validation (Manual + Automated)
Goal: Validate core user flows and stability.

Test Matrix (flag ON):

- [ ] Ticks (granularity=0)
    - [ ] Load initial history (prices/times length reasonable)
    - [ ] Live ticks stream; values update; no duplicates or gaps beyond feed constraints
- [ ] Candles (multiple granularities)
    - [ ] Load initial candles; OHLC values; x-axis time continuity
    - [ ] Live ohlc stream; candle transitions correct
- [ ] Symbol switch
    - [ ] Old stream unsubscribed; new stream subscribed; only one stream updates
- [ ] Granularity switch
    - [ ] Re-query history; re-subscribe with new granularity
- [ ] Pagination (scroll left)
    - [ ] Older history fetched (validate loadHistory bridge if champion triggers it)
- [ ] Mobile/responsive
    - [ ] Layout, crosshair behavior
- [ ] Toolbar/widgets (ChartMode/Views/DrawTools/StudyLegend/Share) if used
- [ ] Markers/contracts_array if used
    - [ ] Marker positioning with/without quote (interpolation)

Automation (where feasible):

- [ ] Unit tests for adapter (already in M1)
- [ ] UI smoke tests: render, symbol switch, granularity switch

Deliverables:

- Test report (manual checklist + automated test results)

Acceptance Criteria:

- All checks above pass; no uncaught exceptions; memory doesn’t grow during long runs

Dependencies:

- Milestones 1–4

Risks:

- Flaky streams; mitigate with id-filtering (already in adapter)

Estimate:

- 1.5–2.5 days

---

Milestone 6 — Cleanup and Deprecation
Goal: Remove legacy wiring and shims once champion path is stable.

Tasks:

- [ ] Remove src/types/derivatives-charts.d.ts (if unused)
- [ ] Remove derivatives-charts imports/CSS
- [ ] Remove requestAPI/requestSubscribe/requestForget/requestForgetStream code paths
- [ ] Remove forgetAll('ticks') reliance from chart unmount when redundant
- [ ] Dead code sweep in services relying on previous chart contracts (if any)

Deliverables:

- Clean codebase free of legacy chart integration

Acceptance Criteria:

- Build and tests pass; champion path is the only path

Dependencies:

- Milestone 5

Risks:

- Unintended removal of shared utilities; mitigate via grep + code owner review

Estimate:

- 0.5–1 day

---

Milestone 7 — Rollout and Monitoring
Goal: Enable the champion integration for cohorts; monitor; be ready to rollback.

Tasks:

- [ ] Enable feature flag for internal/beta users
- [ ] Monitor:
    - [ ] Console errors
    - [ ] Subscription leaks (no orphan onMessage events after unmount/switch)
    - [ ] Performance (fps, memory baseline)
- [ ] Collect feedback and defects; fix critical issues
- [ ] Gradually roll out to 100% once stable

Deliverables:

- Rollout plan + monitoring dashboard notes

Acceptance Criteria:

- No P0/P1 issues in beta; stable metrics for 48–72 hours

Dependencies:

- Milestone 5–6

Risks:

- Unexpected prod payload differences; mitigate with enhanced logging in adapter during rollout

Estimate:

- 2–3 days calendar (low active effort; mostly observation)

---

Milestone 8 — Post-Release Hardening
Goal: Finalize, document, and optimize.

Tasks:

- [ ] Document adapter public API (TSDoc) + code comments
- [ ] Developer README for chart integration
- [ ] Performance pass (excess renders, memoization, unsub timings)
- [ ] Backlog improvements (nice-to-haves) triaged

Deliverables:

- Updated documentation + minor optimizations

Acceptance Criteria:

- Docs complete; no high-CPU or memory leaks in sustained usage

Dependencies:

- Milestone 7

Risks:

- None significant

Estimate:

- 0.5–1.5 days

---

Cross-Cutting QA Gates (Apply per Milestone before moving on)

- [ ] Lint + Typecheck clean
- [ ] Unit tests updated and passing
- [ ] No 404s for assets
- [ ] Subscriptions: id-filtered, no leakage on symbol/granularity change and unmount
- [ ] Browser compatibility: Chromium + Safari smoke
- [ ] Accessibility smoke (keyboard focus, contrast basics)
- [ ] Performance: no obvious regressions (quick render + update)

---

Risk Register and Mitigations

- Asset 404s after swap
    - Validate rsbuild copy rules; preview artifacts locally
- Stream contamination (multiple sources into one callback)
    - Enforce subscription.id filtering in adapter
- MarketIsClosed or delayed feeds
    - Do not emit invalid quotes; show no updates; include delay_amount in ActiveSymbols for UX
- Reconnection behavior
    - Leave to transport; adapter resilient to re-subscriptions
- Version skew
    - Lock @deriv-com/smartcharts-champion to a tested version; avoid ^ ranges for initial rollout

---

Owner Matrix (suggested)

- Adapter/Types: Frontend Engineer A
- Services wiring: Frontend Engineer B
- Chart integration: Frontend Engineer C
- Bundler/Assets: Frontend/Build Engineer
- QA/Automation: QA Engineer
- Release/Flagging: Release Manager

---

Definition of Done (Project)

- Champion integration is the only active chart path
- Adapter abstractions and docs are in place
- No critical issues open; monitoring stable in production
- All milestones marked complete and reviewed

---

References

- docs/adapter-design-smartcharts-champion.md
- docs/migration-derivatives-charts-to-smartchart-champion.md
- docs/smartchart-implementation-audit.md
- docs/SmartChart.md
