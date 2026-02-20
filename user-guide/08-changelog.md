# Changelog

A comprehensive record of all architectural and implementation changes made to convert this repository from the legacy DBot into a white-label boilerplate for third-party developers. Use this as a reference to understand what changed, what was removed, and what replaced it.

## Table of Contents

- [Authentication System](#authentication-system)
- [WebSocket Connection Layer](#websocket-connection-layer)
- [White Labeling & Branding](#white-labeling--branding)
- [Monitoring & Analytics](#monitoring--analytics)
- [Error Handling](#error-handling)
- [Translations](#translations)
- [Configuration Constraints](#configuration-constraints)
- [Documentation Restructure](#documentation-restructure)

---

## Authentication System

The authentication system was significantly refactored to simplify the flow, reduce code, and eliminate redundant services.

### Removed Files (-763 lines)

| Removed File                         | What It Did                          | Replacement                          |
| ------------------------------------ | ------------------------------------ | ------------------------------------ |
| `src/pages/callback/callback-page.tsx` | Dedicated OAuth callback page at `/callback` route | `useOAuthCallback` hook + inline handling in `App.tsx` |
| `src/hooks/auth/useOauth2.ts`        | Complex OAuth hook managing login/logout/retrigger | `useLogout` hook + `OAuthTokenExchangeService` |
| `src/services/whoami.service.ts`     | REST API session validation via `/whoami` endpoint | Removed entirely — WebSocket auth errors now handle session invalidation |
| `src/services/logout.service.ts`     | REST API logout via `/logout` endpoint | `ClientStore.logout()` handles full cleanup directly |

### Added/Modified Files

| File                                          | Change                                      |
| --------------------------------------------- | ------------------------------------------- |
| `src/hooks/useOAuthCallback.ts`               | **New** — Extracts OAuth params from URL, validates CSRF token |
| `src/hooks/useLogout.ts`                      | **New** — Simplified logout with three-tier fallback |
| `src/hooks/useInvalidTokenHandler.ts`         | **Modified** — Now redirects to OAuth instead of `window.location.reload()` (fixed infinite loop bug) |
| `src/services/oauth-token-exchange.service.ts`| **Enhanced** — Auto-initializes accounts and WebSocket after token exchange |
| `src/stores/client-store.ts`                  | **Modified** — Logout now clears DerivAPI singleton, accounts cache, and OAuth token |
| `src/app/App.tsx`                             | **Modified** — Now orchestrates OAuth callback + token exchange inline |

### Flow Change

**Before (Old Flow):**

```
User clicks Login
    → Redirect to OAuth server
    → OAuth redirects to /callback page
    → callback-page.tsx receives tokens directly
    → Stores tokens in localStorage
    → api.authorize(token) on existing WebSocket
    → Redirect to main app (window.location.replace)
```

- Used a **dedicated callback page** (`/callback` route)
- Tokens received directly from OAuth provider in callback
- Session validated via `WhoAmIService` REST calls on tab visibility
- Logout via `LogoutService` REST calls
- Invalid token → `window.location.reload()` (caused infinite loops)

**After (Current Flow):**

```
User clicks Login
    → Generate OAuth URL with PKCE (code_challenge)
    → Redirect to Deriv OAuth server
    → OAuth redirects back to root URL (/) with ?code=...&state=...
    → App.tsx + useOAuthCallback hook extracts and validates params
    → OAuthTokenExchangeService exchanges code for access_token (with PKCE code_verifier)
    → Service auto-fetches accounts from DerivWS API
    → Service auto-initializes WebSocket with authenticated endpoint
    → cleanupURL() removes OAuth params from URL
```

- **No separate callback page** — handled inline in `App.tsx`
- PKCE security (code_verifier/code_challenge) added
- Token exchange via POST request with PKCE verification
- Accounts fetched from DerivWS API (not received directly from OAuth)
- Session invalidation via WebSocket auth error events (no REST calls)
- Invalid token → redirect to OAuth login (no infinite loop)
- Three-tier logout fallback for resilience

### Security Improvements

| Aspect                | Before                              | After                                |
| --------------------- | ----------------------------------- | ------------------------------------ |
| OAuth flow            | Basic authorization code            | Authorization code + PKCE (RFC 7636) |
| Token storage         | localStorage (persists)             | sessionStorage (cleared on tab close)|
| Invalid token         | `window.location.reload()` (loops)  | Redirect to OAuth login              |
| Session validation    | REST API calls (`whoami`)           | WebSocket auth error events          |
| Logout                | REST API call + complex state sync  | Direct state cleanup + singleton reset |

---

## WebSocket Connection Layer

The WebSocket connection system was rebuilt to use async URL resolution and a singleton pattern.

### Key Changes

| Aspect                        | Before                                      | After                                         |
| ----------------------------- | ------------------------------------------- | --------------------------------------------- |
| `generateDerivApiInstance()`  | **Synchronous** — returned API instance directly | **Async** — returns `Promise<DerivAPIBasic>`, awaits URL resolution |
| URL construction              | **Manual** — built `wss://{server}/{type}?account_id={id}` from localStorage | **Dynamic** — fetches URL from DerivWS OTP API for authenticated connections |
| Instance management           | No singleton — new instance on every call    | **Singleton pattern** — reuses existing open connections |
| Race condition handling       | None                                        | Shared creation promise prevents duplicate connections |
| `getSocketURL()`              | **Synchronous** — read server from config    | **Async** — checks auth state, fetches OTP URL if authenticated |
| `api_base.init()`             | `this.api = generateDerivApiInstance()`      | `this.api = await generateDerivApiInstance()` |
| Cleanup on logout             | `this.api.disconnect()`                      | `clearDerivApiInstance()` — closes WebSocket + resets singleton |
| Public endpoint               | `wss://{server}/public`                      | Full URL from config: `{derivws.url}/options/ws/public` |
| Authenticated endpoint        | `wss://{server}/real?account_id=CR123`       | Dynamic URL with OTP: `wss://.../options/ws/demo?otp=xxx` |

### New: DerivWS Authenticated Flow

The authenticated WebSocket URL is now obtained dynamically:

```
1. Check auth_info in sessionStorage
2. GET /derivatives/accounts → fetch user's accounts list
3. POST /options/accounts/{accountId}/otp → get one-time WebSocket URL
4. Parse nested JSON response → extract wss:// URL with OTP
5. Connect WebSocket to this dynamic URL
```

If any step fails, the system falls back to the default public server URL.

### New: Singleton Instance Management

```
generateDerivApiInstance()
├── If forceNew → clearDerivApiInstance() (close old connection)
├── If existing instance open/connecting → reuse it
├── If creation in progress → return same promise (race-safe)
└── Otherwise → await getSocketURL() → new WebSocket → store as singleton
```

`clearDerivApiInstance()` properly closes the WebSocket and resets state (used during logout and forced reconnection).

---

## White Labeling & Branding

The platform was converted from Deriv-branded to a neutral white-label boilerplate.

### Brand Configuration Reset

| Property       | Before (Deriv)             | After (Neutral)                    |
| -------------- | -------------------------- | ---------------------------------- |
| Brand Name     | `"Deriv"`                  | `"YourBrand"`                      |
| Primary Color  | `#ff444f` (Deriv Red)      | `#3b82f6` (Blue 500)              |
| Secondary      | `#85acb0` (Deriv Teal)     | `#64748b` (Slate 500)             |
| Tertiary       | `#2a3052` (Deriv Navy)     | `#8b5cf6` (Purple 500)            |
| Domain         | `deriv.com`                | `yourbrand.com`                    |
| Logo           | `IcRebrandingDerivBot`     | Configurable `BrandLogo` component |
| Fonts          | IBM Plex Sans (Google Fonts) | System font stack (no external requests) |

### Typography System (New)

- Added `typography` section to `brand.config.json` with `font_family` and `font_sizes`
- CSS variable `--brand-font-primary` generated by `npm run generate:brand-css`
- Removed hardcoded IBM Plex Sans Google Fonts import from `src/styles/index.scss`
- `body { font-family }` and `$FONT_STACK` now use `var(--brand-font-primary)`

### Logo System (New)

| Before                                     | After                                              |
| ------------------------------------------ | -------------------------------------------------- |
| Hardcoded `LegacyHomeNewIcon` from Deriv icon library | Configurable `BrandLogo` component             |
| Hardcoded "Home" text                      | Optional text from `brand.config.json`             |
| Not configurable                           | SVG component or image file, config-driven         |

New files:
- `src/components/layout/app-logo/BrandLogo.tsx` — Replaceable SVG logo component
- `brand.config.json` `platform.logo` — Structured config with `type`, `alt_text`, `link_url`, `show_text`

### Menu System (New)

- Desktop menu placeholder in `src/components/layout/header/header-config.tsx`
- Mobile menu placeholder in `src/components/layout/header/mobile-menu/use-mobile-menu-config.tsx`
- Mobile menu auto-hides when no items + theme toggle disabled + user not logged in

### CSS Generator Enhancement

- `scripts/generate-brand-css.js` now generates typography CSS variables
- Validates color and typography configuration
- Output includes `--brand-font-primary`, `--brand-font-secondary`, `--brand-font-monospace`

---

## Monitoring & Analytics

All monitoring and analytics packages were removed to reduce bundle size and give developers freedom to choose their own tools.

### Removed Packages

| Package                  | Purpose                        | Status          |
| ------------------------ | ------------------------------ | --------------- |
| `@datadog/browser-rum`   | Session replay, performance    | Removed         |
| `trackjs`                | JavaScript error tracking      | Removed         |
| `@deriv-com/analytics`   | Rudderstack event tracking     | Removed         |

### Removed Files

| File/Directory                     | What It Did                              |
| ---------------------------------- | ---------------------------------------- |
| `src/utils/datadog.ts`             | Datadog RUM initialization               |
| `src/hooks/useTrackjs.ts`          | TrackJS error tracking hook              |
| `src/utils/analytics/`             | Analytics initialization (entire directory) |
| `src/hooks/growthbook/`            | Growthbook feature flag hooks (entire directory) |

Analytics event tracking calls were also removed from all component files throughout the codebase.

### Added Stub

`src/hooks/remote-config/useRemoteConfig.ts` — Returns disabled feature flags by default. Maintains compatibility with code that checks feature flags (e.g., `useIntercom`, `useLiveChat`) without requiring the analytics package.

### Re-enabling

Each package can be re-enabled independently. See [Monitoring & Analytics Guide](./07-monitoring-analytics.md) for step-by-step instructions with full code examples.

---

## Error Handling

### New: Centralized ErrorLogger

**File:** `src/utils/error-logger.ts`

Replaces 140+ inconsistent `console.error`/`console.warn`/`console.log` calls with a unified interface.

| Before                                                    | After                                              |
| --------------------------------------------------------- | -------------------------------------------------- |
| `console.error('[OAuth] Error parsing auth_info:', e)`    | `ErrorLogger.error('OAuth', 'Error parsing auth_info', e)` |
| `console.error('Logout failed:', e)`                      | `ErrorLogger.error('Logout', 'Logout failed', e)` |
| `console.warn('Failed to clear cache')`                   | `ErrorLogger.warn('Storage', 'Failed to clear cache')` |

Features:
- Configurable log levels (ERROR, WARN, INFO, DEBUG)
- Pluggable error reporting service interface (Sentry, TrackJS)
- User context for error reports
- Environment-aware configuration (production vs development)

Already migrated:
- `src/hooks/useLogout.ts`
- `src/hooks/useInvalidTokenHandler.ts`
- `src/services/oauth-token-exchange.service.ts`
- `src/stores/client-store.ts`

---

## Translations

### Change: Made Optional

The `@deriv-com/translations` package wraps the entire app via `TranslationProvider`, but multi-language support **only works** when connected to a Crowdin project with translation files served via CDN.

| Setting                              | Before           | After (Recommended Default) |
| ------------------------------------ | ---------------- | --------------------------- |
| `enable_language_settings`           | `true`           | `false`                     |
| Translation CDN                      | Configured       | Not configured (defaults to English) |

Without Crowdin setup, the app defaults to English and functions normally. The language selector should be hidden (`enable_language_settings: false`) unless translations are configured.

### Required Environment Variables (if enabling)

| Variable              | Purpose                     |
| --------------------- | --------------------------- |
| `TRANSLATIONS_CDN_URL`| Translation files CDN URL   |
| `R2_PROJECT_NAME`     | Crowdin project name        |
| `CROWDIN_BRANCH_NAME` | Crowdin branch              |

---

## Configuration Constraints

### Do Not Change

The following `brand.config.json` values must remain pointed at Deriv's servers:

| Config Section | Values                                           | Reason                                    |
| -------------- | ------------------------------------------------ | ----------------------------------------- |
| `auth2_url`    | `https://auth.deriv.com/oauth2/` (production)    | Platform relies on Deriv's OAuth infrastructure |
|                | `https://staging-auth.deriv.com/oauth2/` (staging)| Token exchange requires Deriv's auth server |
| `derivws.url`  | `https://api.derivws.com/trading/v1/` (production)| All trading, market data, and account operations |
|                | `https://staging-api.derivws.com/trading/v1/` (staging)| WebSocket connections require Deriv's API |

Changing these will break authentication and all trading functionality.

### Safe to Customize

Everything else in `brand.config.json` is fully customizable:
- `brand_name`, `brand_domain`, `domain_name`, `brand_hostname`
- `colors` (entire palette)
- `typography` (fonts, sizes)
- `platform.name`, `platform.logo`, `platform.footer`
- `platform.hostname` (your deployment domains)

---

## Documentation Restructure

### Before: `migrate-docs/` (12 files, ~6,500 lines)

| File                                      | Lines |
| ----------------------------------------- | ----- |
| `ANALYTICS_IMPLEMENTATION_GUIDE.md`       | 738   |
| `AUTHENTICATION_FLOW.md`                  | 661   |
| `AUTHENTICATION_FLOW_REVISED.md`          | 614   |
| `BRAND_CONFIG_GUIDE.md`                   | 1192  |
| `DERIVWS_AUTHENTICATED_WEBSOCKET_FLOW.md` | 369   |
| `ERROR_LOGGING_GUIDE.md`                  | 509   |
| `LOGO_CUSTOMIZATION_QUICK_START.md`       | 172   |
| `MONITORING_PACKAGES.md`                  | 453   |
| `PKCE_IMPLEMENTATION.md`                  | 248   |
| `WEBSOCKET_CONNECTION_FLOW.md`            | 558   |
| `WHITELABEL_CHANGELOG.md`                 | 479   |
| `WHITE_LABELING_GUIDE.md`                 | 935   |

Issues: Scattered across 12 files, significant overlap (auth documented in 3 files), mix of current and deprecated information, no clear reading order.

### After: `documation/` (8 files, topic-organized)

| File                            | Consolidates From                                           |
| ------------------------------- | ----------------------------------------------------------- |
| `README.md`                     | **New** — Index with reading order                          |
| `01-getting-started.md`         | **New** — Prerequisites, setup, commands, env vars          |
| `02-architecture-overview.md`   | **New** — Layers, stores, streams, bot engine               |
| `03-white-labeling.md`          | `WHITE_LABELING_GUIDE` + `BRAND_CONFIG_GUIDE` + `LOGO_CUSTOMIZATION` + `WHITELABEL_CHANGELOG` |
| `04-authentication.md`          | `AUTHENTICATION_FLOW` + `AUTHENTICATION_FLOW_REVISED` + `PKCE_IMPLEMENTATION` |
| `05-websocket-integration.md`   | `WEBSOCKET_CONNECTION_FLOW` + `DERIVWS_AUTHENTICATED_WEBSOCKET_FLOW` |
| `06-error-handling.md`          | `ERROR_LOGGING_GUIDE`                                       |
| `07-monitoring-analytics.md`    | `MONITORING_PACKAGES` + `ANALYTICS_IMPLEMENTATION_GUIDE`    |
| `08-changelog.md`               | **New** — This file                                         |

Improvements: Topic-based organization, no duplication, deprecated content removed, reflects actual current codebase, cross-linked guides, clear reading order for new developers.
