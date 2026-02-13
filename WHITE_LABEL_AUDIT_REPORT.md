# White-Label Readiness Audit Report

**Date:** 2026-02-12
**Repository:** dbot-reference (Derivatives Bot White-Label Solution)
**Purpose:** Comprehensive audit evaluating readiness for third-party developer distribution

---

## Table of Contents

1. [Confidential & Brand-Coupled Information](#1-confidential--brand-coupled-information)
2. [Code Cleanliness](#2-code-cleanliness)
3. [Test Coverage](#3-test-coverage)
4. [Third-Party Readiness Assessment](#4-third-party-readiness-assessment)

---

## 1. Confidential & Brand-Coupled Information

### 1.1 CRITICAL: Hardcoded OAuth Client ID

| Detail | Value |
|--------|-------|
| Severity | CRITICAL |
| Files | `src/components/shared/utils/config/config.ts:247`, `src/services/oauth-token-exchange.service.ts:136` |

The internal Deriv OAuth `CLIENT_ID` is hardcoded as a fallback in two places:

```typescript
const clientId = process.env.CLIENT_ID || '32izC2lBT4MmiSNWuxq2l';
```

White-label clients **must** provide their own — this fallback should be removed entirely or replaced with an error if the env var is not set.

---

### 1.2 CRITICAL: Hardcoded Internal Analytics Endpoint

| Detail | Value |
|--------|-------|
| Severity | CRITICAL |
| File | `src/stores/data-collection-store.ts:51` |

```typescript
endpoint = 'https://dbot-conf-dot-deriv-bi-reporting.as.r.appspot.com/dbotconf';
```

This is a Deriv-internal Google Cloud endpoint that tracks bot runs and transactions. It also references `binary.sx` (internal testing domain) on line 31. Third-party devs cannot use this, and it leaks internal infrastructure details.

---

### 1.3 HIGH: Hardcoded Deriv API & Auth Endpoints in brand.config.json

| Detail | Value |
|--------|-------|
| Severity | HIGH |
| File | `brand.config.json:82-95` |

```json
"auth2_url": {
    "production": "https://auth.deriv.com/oauth2/",
    "staging": "https://staging-auth.deriv.com/oauth2/"
},
"derivws": {
    "url": {
        "staging": "https://staging-api.derivws.com/trading/v1/",
        "production": "https://api.derivws.com/trading/v1/"
    }
}
```

While `brand.config.json` is the right place for configuration, these are Deriv's actual production/staging endpoints while other values in the file use placeholders like `yourbrand.com`. This inconsistency is confusing — either all values should be generic placeholders, or documentation should clearly mark which values **must** be replaced.

---

### 1.4 HIGH: 30+ Hardcoded Deriv Domain URLs in routes.ts

| Detail | Value |
|--------|-------|
| Severity | HIGH |
| File | `src/components/shared/utils/routes/routes.ts` |

The entire routing configuration is hardcoded to `deriv.com`, `deriv.me`, `deriv.be` domains with staging variants. This file is **NOT** driven by `brand.config.json`.

Includes references to:
- `staging.deriv.com`, `deriv.com`, `deriv.me`, `deriv.be`
- `smarttrader.deriv.com` (+ staging variants)
- `hub.deriv.com` (+ staging variants)
- `home.deriv.com` (+ staging variants)
- `dtrader.deriv.com` (+ staging variants)
- `dev-home.deriv.com`, `dev-dtrader.deriv.com` (development URLs)

---

### 1.5 HIGH: Deriv Domain Whitelist in brand.ts

| Detail | Value |
|--------|-------|
| Severity | HIGH |
| File | `src/components/shared/utils/brand/brand.ts:8-12` |

```typescript
const isDomainAllowed = (domain_name: string) => {
    return /^(((.*)\.)?(localhost:8444|pages.dev|binary\.(sx|com)|deriv.(com|me|be|dev)))$/.test(domain_name);
};
```

If the app runs on a non-Deriv domain, `getPlatformConfig()` strips the logo. Third-party devs hosting on their own domain will see broken branding.

---

### 1.6 HIGH: Hardcoded Intercom Script URL

| Detail | Value |
|--------|-------|
| Severity | HIGH |
| File | `src/hooks/useIntercom.ts:7` |

```typescript
const intercom_script = 'https://static.deriv.com/scripts/intercom/v1.0.2.js';
```

Loads Deriv's customer support integration from their CDN. Should be configurable via brand config or removed entirely.

---

### 1.7 MEDIUM: Legacy binary.com / binary.sx References

| Detail | Value |
|--------|-------|
| Severity | MEDIUM |
| Files | Multiple |

| File | Line | Reference |
|------|------|-----------|
| `src/components/shared/utils/url/url.ts` | 13-78 | 6+ references to `binary.com` domain mapping |
| `src/components/shared/utils/storage/storage.ts` | 158 | `binary.sx` hostname check |
| `src/stores/data-collection-store.ts` | 31 | `binary.sx` test domain regex |

---

### 1.8 MEDIUM: "Deriv Bot" Brand Name in User-Facing Content (20 files)

| Detail | Value |
|--------|-------|
| Severity | MEDIUM |
| Scope | 20 source files |

The string "Deriv Bot" appears in user-facing content across:

- Tutorial content and video descriptions (`src/pages/tutorials/constants.ts`)
- Quick strategy descriptions (`src/constants/quick-strategies/*.ts`)
- Tour dialogs (`src/pages/tutorials/dbot-tours/`)
- Bot notifications (`src/utils/bot-notifications.ts`)
- Help strings (`src/utils/help-content/help-strings/`)
- Dashboard constants (`src/pages/dashboard/constants.ts`)
- Toolbar/toolbox components

These should be driven by `brand.config.json` values.

---

### 1.9 MEDIUM: "Binary Bot" Folder Name in Google Drive

| Detail | Value |
|--------|-------|
| Severity | MEDIUM |
| File | `src/stores/google-drive-store.ts:61` |

```typescript
this.bot_folder_name = `Binary Bot - ${localize('Strategies')}`;
```

---

### 1.10 LOW: YouTube Video Links to Deriv-Specific Content

| Detail | Value |
|--------|-------|
| Severity | LOW |
| File | `src/pages/tutorials/constants.ts` |

5+ embedded YouTube videos specifically about "Deriv Bot" tutorials. These would confuse third-party users.

---

### 1.11 What's Handled Well

| Area | Status |
|------|--------|
| `brand.config.json` exists with centralized theming | GOOD |
| `migrate-docs/` folder — 12 comprehensive guides | GOOD |
| `.env` is properly gitignored (verified — not tracked in git) | GOOD |
| Domain/hostname partially driven by brand config | GOOD |
| All npm packages are public — no private registries | GOOD |
| Logo customization via BrandLogo component | GOOD |
| PKCE OAuth flow with CSRF protection | GOOD |

---

## 2. Code Cleanliness

### 2.1 HIGH: 79 `[AI]` Migration Markers Across 34 Files

These comments mark where analytics/monitoring packages were removed during the white-label migration:

```typescript
/* [AI] - Analytics event tracking removed - see migrate-docs/MONITORING_PACKAGES.md for re-implementation guide */
```

**Files with most markers:**
| File | Count |
|------|-------|
| `src/components/layout/header/mobile-menu/mobile-menu.tsx` | 6 |
| `src/stores/load-modal-store.ts` | 5 |
| `src/pages/dashboard/cards.tsx` | 5 |
| `src/pages/dashboard/announcements/announcements.tsx` | 5 |
| `src/pages/dashboard/bot-list/recent-workspace.tsx` | 4 |
| `src/stores/google-drive-store.ts` | 3 |
| `src/components/layout/footer/index.tsx` | 3 |
| `src/components/layout/header/mobile-menu/use-mobile-menu-config.tsx` | 3 |
| 26 additional files | 1-3 each |

While they serve as re-implementation guides, 79 markers in production code looks unpolished. Consider consolidating into a single migration checklist document.

---

### 2.2 MEDIUM: 29+ TODO/FIXME Comments Indicating Incomplete Work

| File | Line | Comment |
|------|------|---------|
| `src/stores/app-store.ts` | 98 | `// TODO: fix` (vague) |
| `src/stores/ui-store.ts` | 16 | `// TODO: fix - need to implement this feature` |
| `src/stores/run-panel-store.ts` | 466, 472, 722, 734 | `// TODO: fix notifications` (4 instances) |
| `src/stores/root-store.ts` | 22 | `// TODO: need to write types for individual classes` |
| `src/stores/summary-card-store.ts` | 185 | `// TODO only add props that is being used` |
| `src/stores/transactions-store.ts` | 263 | `// TODO: need to fix as portfolio not available` |
| `src/stores/client-store.ts` | 40 | `// TODO: fix with self exclusion` |
| `src/components/page-error/page-error.tsx` | 127 | `// TODO: NEED TO FIX THIS TO REDIRECT` |
| `src/pages/bot-builder/bot-builder.tsx` | 28 | `// TODO: fix` |
| `src/components/shared/utils/date/date-time.ts` | 20 | `// TODO: Fix` |
| `src/components/shared/utils/url/url.ts` | 112 | `// TODO: cleanup options param usage` |
| `src/components/shared/utils/screen/responsive.ts` | 6, 22 | TypeScript/documentation TODOs |

---

### 2.3 MEDIUM: 26+ Unguarded Console Statements

Production code contains `console.log/warn/error` calls without proper logging abstraction:

| File | Type |
|------|------|
| `src/app/App.tsx` | `console.error()` — OAuth flow debugging |
| `src/app/app-root.tsx` | `console.error()` — API initialization |
| `src/constants/backend-error-messages.ts` | `console.warn()` — unknown error codes |
| `src/stores/blockly-store.ts` | `console.error()` |
| `src/stores/dashboard-store.ts` | `console.warn()` |
| `src/stores/toolbox-store.ts` | `console.warn()` — click rate limiting |
| `src/stores/flyout-store.ts` | Multiple `console.warn()` |
| `src/utils/error-logger.ts` | Multiple console calls |
| `src/utils/xss-protection.ts` | `console.error()` in catch block |
| `src/utils/blockly-url-param-handler.ts` | Multiple `console.warn()` |
| `src/utils/transfer-utils.ts` | `console.error()` |
| `src/utils/symbol-display-name.ts` | `console.warn()` |
| 14+ additional files | Various |

---

### 2.4 MEDIUM: Unused / Dead Code

| Item | Location | Issue |
|------|----------|-------|
| `print()` export | `src/utils/index.ts:1` | Exported but **never imported** anywhere |
| Dummy Icon component | `src/utils/tmp/dummy.tsx` | Placeholder implementation with "dummy" class names |
| Google Closure polyfill | `src/utils/tmp/goog-helper.ts` | Legacy `goog.inherits`, `goog.math.*` polyfill |
| 5+ deprecated functions | `src/components/shared/utils/url/`, `currency/`, `screen/` | Marked `@deprecated` but still in codebase |

---

### 2.5 MEDIUM: TypeScript Quality Issues

| Issue | Count | Examples |
|-------|-------|---------|
| `any` type usage | 11+ files | `load-modal-store.ts:27`, `toolbox-store.ts:279,350`, `google-drive-store.ts:34`, `chart-store.ts:77` |
| `eslint-disable` comments | 60+ files (143 total) | 35+ for `react-hooks/exhaustive-deps`, plus `no-explicit-any`, `prefer-const`, `class-methods-use-this` |
| Missing type definitions | Multiple | Root store TODO: "need to write types for individual classes" |
| `as any` casts | Multiple | `load-modal-store.ts:308,510,532`, service test files |

---

### 2.6 LOW: Import Path Inconsistencies

Stores use relative imports (`../`) instead of the configured path aliases (`@/`), inconsistent with the rest of the codebase:

```typescript
// Current (in stores)
import { something } from '../components/shared';

// Should be
import { something } from '@/components/shared';
```

---

## 3. Test Coverage

### 3.1 Overall Statistics

| Category | Total Files | Tested | Coverage % | Priority |
|----------|------------|--------|------------|----------|
| **Stores** | 21 | 0 | **0%** | CRITICAL |
| **Pages** | ~80 | 0 | **0%** | CRITICAL |
| **Bot-Skeleton (core engine)** | 8+ dirs | 0 | **0%** | CRITICAL |
| **App Core** | 9 | 0 | **0%** | CRITICAL |
| **Components** | ~187 | 10 | **5.3%** | HIGH |
| **Hooks** | 34 | 3 | **8.8%** | HIGH |
| **Utilities** | ~37 | 4 | **10.8%** | HIGH |
| **Services** | 6 | 2 | **33%** | MEDIUM |
| **Constants** | 18+ | 1 | **~5%** | MEDIUM |
| **Adapters** | 3+ | 3 | **100%** | OK |
| **TOTAL** | **~667** | **23** | **3.4%** | **CRITICAL** |

---

### 3.2 CRITICAL: Zero Store Tests (0/21)

All 21 MobX stores have zero test coverage, including the most business-critical:

| Store | Responsibility | Risk |
|-------|---------------|------|
| `RunPanelStore` | Bot execution start/stop/pause | CRITICAL |
| `ClientStore` | API connection, authentication, account data | CRITICAL |
| `BlocklyStore` | Workspace state management | CRITICAL |
| `TransactionsStore` | Trade history tracking | HIGH |
| `DashboardStore` | Bot statistics and performance | HIGH |
| `LoadModalStore` | Strategy loading | HIGH |
| `SaveModalStore` | Strategy saving | HIGH |
| `QuickStrategyStore` | Quick strategy execution | HIGH |
| `GoogleDriveStore` | Cloud storage integration | MEDIUM |
| `JournalStore` | Execution logging | MEDIUM |
| `ToolboxStore` | Block category management | MEDIUM |
| 10 additional stores | Various | MEDIUM-LOW |

---

### 3.3 CRITICAL: Zero Page Tests (0/~80)

No page-level component has any tests:
- Dashboard (main landing page)
- Bot Builder / Editor
- Chart page
- Tutorials
- All sub-pages and dialogs

---

### 3.4 CRITICAL: Zero Bot-Skeleton Tests

The core bot execution engine (`src/external/bot-skeleton/`) has **zero** test coverage:

| Directory | Contents | Tested |
|-----------|----------|--------|
| `scratch/blocks/` | Blockly block definitions | NO |
| `scratch/hooks/` | Bot execution hooks | NO |
| `services/` | API services, trade execution | NO |
| `services/api/api-base.ts` | Core API connection | NO |
| `utils/` | Bot utilities | NO |
| `constants/` | Configuration and messages | NO |

---

### 3.5 Existing Test Files (23 total)

**What IS tested:**

| Category | Files | Quality |
|----------|-------|---------|
| **Adapters** (3) | `smartcharts-champion/` — index, services, transport | Good |
| **Components** (10) | error-modal (2), error-component, page-error, unhandled-error-modal, contract-card-running-bot, mobile-menu (4) | Mixed |
| **Hooks** (3) | useInvalidTokenHandler, useLogout, useSmartChartAdaptor | Good |
| **Services** (2) | active-symbol-categorization, active-symbols-processor | Good |
| **Utilities** (4) | account-helpers, error-handler, sort-symbols-utils, xss-protection | Good |
| **Constants** (1) | backend-error-messages | Basic |

**Quality assessment of existing tests:**

| Test File | Lines | Quality | Notes |
|-----------|-------|---------|-------|
| `account-helpers.spec.ts` | 307 | STRONG | Edge cases, error conditions, cleanup |
| `useInvalidTokenHandler.spec.ts` | 391 | STRONG | Lifecycle, infinite loop prevention, 10 describe blocks |
| `sort-symbols-utils.test.ts` | 269 | STRONG | Immutability checks, graceful degradation |
| `error-component.spec.tsx` | 10 | WEAK | Render-only, no interactions, no edge cases |
| `contract-card-running-bot.spec.tsx` | 22 | WEAK | SVG/text presence only, no behavior |

---

### 3.6 Missing Test Categories

| Category | Status |
|----------|--------|
| Integration tests (complete workflows) | NONE |
| End-to-end bot execution tests | NONE |
| Cross-store interaction tests | NONE |
| Snapshot / visual regression tests | NONE |
| User interaction tests (fireEvent/userEvent) | MINIMAL |
| Async operation tests | MINIMAL |
| Performance tests | NONE |
| Accessibility tests | NONE |

---

### 3.7 Untested Utilities (33/37)

Critical untested utilities include:

| Utility | Risk |
|---------|------|
| `auth-utils.ts` | HIGH — authentication logic |
| `session-token-utils.ts` | HIGH — session token management |
| `bot-notifications.ts` | MEDIUM — notification handling |
| `blockly-url-param-handler.ts` | MEDIUM — URL parameter handling |
| `xml-dom-quick-strategy.ts` | MEDIUM — XML handling |
| `error-logger.ts` | MEDIUM — error logging |
| `transfer-utils.ts` | MEDIUM — transfer logic |
| `url-redirect-utils.ts` | MEDIUM — URL redirection |
| 25+ additional utilities | LOW-MEDIUM |

---

### 3.8 Untested Hooks (31/34)

Critical untested hooks include:

| Hook | Risk |
|------|------|
| `useApiBase.ts` | HIGH — API initialization |
| `useAccountSwitching.ts` | HIGH — account switching |
| `useOAuthCallback.ts` | HIGH — OAuth callback |
| `useLocalStorageSync.ts` | MEDIUM — storage sync |
| `useRemoteConfig.ts` | MEDIUM — remote configuration |
| `useIntercom.ts` | MEDIUM — customer support |
| 25+ additional hooks | LOW-MEDIUM |

---

## 4. Third-Party Readiness Assessment

### Verdict: NOT READY — Requires targeted fixes before release

---

### 4.1 What's Ready

| Area | Details |
|------|---------|
| Build system | RSBuild properly configured, works out of the box |
| Brand config foundation | `brand.config.json` provides theming, colors, typography, logo |
| Migration documentation | 12 comprehensive guides in `migrate-docs/` |
| Package ecosystem | All npm dependencies are public — no private registries |
| Code architecture | Clean MobX store pattern, path aliases, modular structure |
| OAuth implementation | PKCE flow with CSRF protection properly implemented |
| Logo system | Component-based BrandLogo with customization guide |
| CSS variable system | Dynamic theme generation with configurable prefix |

---

### 4.2 Action Items (Priority Order)

#### P0 — Blockers (Must fix before any release)

| # | Issue | Files | Effort |
|---|-------|-------|--------|
| 1 | Remove hardcoded CLIENT_ID `32izC2lBT4MmiSNWuxq2l` fallback — throw error if env var missing | `config.ts:247`, `oauth-token-exchange.service.ts:136` | Small |
| 2 | Make data-collection endpoint configurable via brand.config or remove `DataCollectionStore` entirely | `data-collection-store.ts` | Small |
| 3 | Move `routes.ts` domain URLs to `brand.config.json` or make them configurable | `routes.ts` (entire file) | Medium |
| 4 | Replace Deriv domain whitelist in `brand.ts` with configurable pattern from brand.config.json | `brand.ts:8-12` | Small |
| 5 | Make Intercom script URL configurable or remove | `useIntercom.ts:7` | Small |
| 6 | Remove `binary.com` / `binary.sx` references | `url.ts`, `storage.ts`, `data-collection-store.ts` | Small |

#### P1 — Should Fix (Professional quality for third-party consumption)

| # | Issue | Scope | Effort |
|---|-------|-------|--------|
| 7 | Consolidate 79 `[AI]` migration markers into a single checklist document | 34 files | Medium |
| 8 | Create `.env.example` documenting all required environment variables | New file | Small |
| 9 | Replace "Deriv Bot" user-facing strings with brand.config-driven values | 20 files | Medium |
| 10 | Clean up TODO/FIXME comments — resolve or remove | 29+ comments | Medium |
| 11 | Remove unused code: `print()` export, `dummy.tsx`, `goog-helper.ts` | 3 files | Small |
| 12 | Remove deprecated functions or replace with modern equivalents | 5+ functions | Small |
| 13 | Rename "Binary Bot" Google Drive folder name to use brand config | `google-drive-store.ts:61` | Small |
| 14 | Make `brand.config.json` auth/API endpoints use placeholders consistently | `brand.config.json` | Small |

#### P2 — Should Address (Test confidence for a distributable product)

| # | Issue | Scope | Effort |
|---|-------|-------|--------|
| 15 | Add tests for critical stores: `RunPanelStore`, `ClientStore`, `BlocklyStore` | 3 new test files | Large |
| 16 | Add tests for core pages: Dashboard, Bot Builder | 2+ new test files | Large |
| 17 | Add integration tests for bot execution workflow | New test suite | Large |
| 18 | Improve TypeScript strictness — reduce `any` usage | 11+ files | Medium |

#### P3 — Nice to Have

| # | Issue | Scope | Effort |
|---|-------|-------|--------|
| 19 | Standardize import paths to use `@/` aliases consistently | Store files | Small |
| 20 | Replace `console.*` calls with proper logging utility | 26+ files | Medium |
| 21 | Reduce `eslint-disable` comments by fixing underlying issues | 60+ files | Medium |
| 22 | Expand weak tests (error-component, contract-card-running-bot) | 2 test files | Small |

---

### 4.3 Risk Summary

| Risk Category | Current State | Impact on Third-Party Devs |
|---------------|--------------|---------------------------|
| **Credential leakage** | CLIENT_ID exposed, internal endpoint hardcoded | Could be misused; confusing for white-label setup |
| **Brand coupling** | 30+ Deriv URLs, 20 "Deriv Bot" strings, domain whitelist | App won't work correctly on non-Deriv domains |
| **Code polish** | 79 migration markers, 29 TODOs, dead code | Looks unfinished; erodes developer confidence |
| **Test coverage** | 3.4% — critical systems untested | No regression safety net; risky for customization |
| **Documentation** | Migration docs are good, but no `.env.example` | Developers won't know what env vars to configure |

---

### 4.4 Minimum Viable Release Checklist

- [ ] P0 items 1-6 completed (brand decoupling)
- [ ] `.env.example` created with all required variables
- [ ] `brand.config.json` uses consistent placeholders
- [ ] Clean build with `npm run build` — no warnings
- [ ] All 23 existing tests pass with `npm test`
- [ ] Lint passes with `npm run test:lint`
- [ ] No `deriv.com|binary.com|binary.sx` references in source code (search verified)
- [ ] No hardcoded CLIENT_ID fallback (search for `32izC2lBT4MmiSNWuxq2l`)
- [ ] App deployed on a non-Deriv domain renders branding correctly
- [ ] OAuth flow tested with a third-party CLIENT_ID
