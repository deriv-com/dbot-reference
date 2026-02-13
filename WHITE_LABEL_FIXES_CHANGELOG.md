# White-Label Readiness Fixes Changelog

Detailed changelog of all fixes made during the white-label audit remediation. Each section maps to a specific issue from the audit report.

---

## P0-1: Remove Hardcoded OAuth CLIENT_ID Fallback

**Problem:** The internal Deriv OAuth `CLIENT_ID` (`32izC2lBT4MmiSNWuxq2l`) was hardcoded as a fallback in two files. Third-party clients would accidentally use Deriv's internal credentials.

**Fix:** Removed the fallback value and added console warnings when `CLIENT_ID` is not set.

**Files Modified:**
| File | Change |
|------|--------|
| `src/components/shared/utils/config/config.ts` | Removed `\|\| '32izC2lBT4MmiSNWuxq2l'` fallback, added `console.warn` when CLIENT_ID is missing |
| `src/services/oauth-token-exchange.service.ts` | Same — removed fallback, added warning |

---

## P0-2: Remove Internal Data Collection Endpoint

**Problem:** A Deriv-internal Google Cloud analytics endpoint (`dbot-conf-dot-deriv-bi-reporting.as.r.appspot.com`) was hardcoded, leaking internal infrastructure and sending strategy data to Deriv.

**Fix:** Deleted the entire data collection store and removed all references.

**Files Deleted:**
| File | Reason |
|------|--------|
| `src/stores/data-collection-store.ts` | Entire store was Deriv-internal analytics |

**Files Modified:**
| File | Change |
|------|--------|
| `src/stores/root-store.ts` | Removed `DataCollectionStore` import, property declaration, and instantiation |

---

## P0-3: Remove External Routes + Traders Hub References

**Problem:** 30+ hardcoded Deriv domain URLs in `routes.ts` (`deriv.com`, `deriv.me`, `deriv.be`, `smarttrader.deriv.com`, etc.) and extensive Traders Hub integration code that had no relevance for a white-label bot.

**Fix:** Stripped `routes.ts` to only the bot route. Removed all Traders Hub references across the codebase. Removed external platform navigation (SmartTrader, DTrader links). Simplified components that referenced Reports or external Deriv services.

**Files Deleted:**
| File | Reason |
|------|--------|
| `src/utils/transfer-utils.ts` | Only used for navigating to external transfer page |
| `src/utils/traders-hub-redirect.ts` | Entire file was Traders Hub redirect logic with hardcoded `deriv.com` URLs |

**Files Modified:**
| File | Change |
|------|--------|
| `src/components/shared/utils/routes/routes.ts` | Stripped from 114 lines with 30+ Deriv URLs to minimal `{ bot: window.location.origin }` |
| `src/components/layout/header/header-config.tsx` | Removed DerivTrader, SmartTrader platform entries and `TRADERS_HUB_LINK_CONFIG` |
| `src/stores/run-panel-store.ts` | Removed Reports link from bot stop notification, simplified to plain notification |
| `src/utils/store-helpers.tsx` | Removed Reports link, simplified to plain text |
| `src/components/bot-stopped.tsx` | Removed "Go to Reports" button and external navigation |
| `src/pages/dashboard/stop-bot-modal-content.tsx` | Removed Reports page links from modal |
| `src/components/error-component/error-component.tsx` | Changed default `redirect_to` from `standalone_routes.trade` to `'/'` |
| `src/components/page-error/page-error.tsx` | Changed `window.location.assign` target from `standalone_routes.deriv_app` to `'/'` |
| `src/components/layout/header/mobile-menu/reports-submenu.tsx` | Replaced with `return null` (no external Reports page) |
| `src/components/shared/utils/contract/trade-url-params-config.ts` | Removed `standalone_routes` import and dependency |
| `src/components/layout/header/header.tsx` | Removed Transfer button and `navigateToTransfer` |
| `src/components/layout/header/menu-items/menu-items.tsx` | Removed `TradershubLink` component |
| `src/components/layout/header/common/no-non-eu-accounts.tsx` | Replaced with `return null` |
| `src/components/shared/utils/digital-options/digital-options.ts` | Changed `redirect_to` from `'/appstore/traders-hub'` to `'/'` |
| `src/components/shared/utils/url/url.ts` | Removed dead `getContractPath` function and `standalone_routes` import |
| `src/components/shared/services/performance-metrics-methods.ts` | Removed commented Traders Hub analytics code, removed unused `isMobile` import |

---

## P0-4: Replace Deriv Domain Whitelist in brand.ts

**Problem:** The `isDomainAllowed` function only allowed Deriv/binary domains. Third-party devs deploying on their own domain would see broken branding (empty logo).

**Fix:** Removed the `isDomainAllowed` function entirely. Brand config is now always applied regardless of domain.

**Files Modified:**
| File | Change |
|------|--------|
| `src/components/shared/utils/brand/brand.ts` | Removed `isDomainAllowed()` function and domain-gating logic from `getPlatformConfig()` |

---

## P0-5: Remove Intercom and LiveChat

**Problem:** Hardcoded Intercom script URL (`static.deriv.com/scripts/intercom/`) and LiveChat widget integration loaded Deriv's internal customer support tools.

**Fix:** Removed all Intercom and LiveChat code, hooks, components, styles, and type declarations.

**Files Deleted:**
| File | Reason |
|------|--------|
| `src/hooks/useIntercom.ts` | Intercom integration hook |
| `src/components/chat/useLiveChat.ts` | LiveChat session management hook |
| `src/components/chat/useIsLiveChatWidgetAvailable.ts` | LiveChat availability check hook |
| `src/components/shared_ui/open-livechat-link/open-livechat-link.tsx` | LiveChat link component |
| `src/components/shared_ui/open-livechat-link/open-livechat-link.scss` | LiveChat link styles |
| `src/components/shared_ui/open-livechat-link/index.ts` | Barrel export |
| `src/components/chat/` | Empty directory cleaned up |

**Files Modified:**
| File | Change |
|------|--------|
| `src/app/app-content.jsx` | Removed `useLiveChat` import, `livechat_client_information` object, and Intercom comments |
| `src/stores/client-store.ts` | Removed `LC_API`, `LiveChatWidget`, `Intercom`, `DerivInterCom` shutdown code from `logout()` and `regenerateWebSocket()` |
| `src/global.d.ts` | Removed `LC_API`, `LiveChatWidget`, `DerivInterCom`, `Intercom` Window type declarations |
| `src/hooks/remote-config/useRemoteConfig.ts` | Removed `cs_chat_livechat` and `cs_chat_intercom` config flags |
| `src/pages/dashboard/announcements/config.tsx` | Removed `OpenLiveChatLink` import, replaced "contact us via live chat" with simpler text |
| `src/pages/dashboard/announcements/announcement-dialog.scss` | Removed `.open-livechat` styles |

---

## P0-6: Remove binary.com / binary.sx References

**Problem:** Legacy `binary.com` and `binary.sx` domain references in URL utilities, storage helpers, and domain constants leaked historical infrastructure.

**Fix:** Removed all binary.com/binary.sx references. Cleaned up dead code in URL utilities (11 unused functions removed). Stripped unused domain constants.

**Files Modified:**
| File | Change |
|------|--------|
| `src/components/shared/utils/url/url.ts` | Rewrote file — removed 11 dead functions (`urlFor`, `host_map`, `getHostMap`, `legacyUrlForLanguage`, `normalizePath`, `params`, `websiteUrl`, `removeBranchName`, `urlForLanguage`, `getPath`, `getContractPath`). Kept only 4 used functions: `reset`, `getUrlBase`, `setUrlLanguage`, `getStaticUrl` |
| `src/components/shared/utils/url/helpers.ts` | Removed `getPlatformFromUrl`, `isStaging`, `isTestDerivApp` (all dead code with hardcoded Deriv/binary domain checks). Kept deprecated `getlangFromUrl` and `getActionFromUrl` |
| `src/components/shared/utils/url/constants.ts` | Removed unused domain constants: `DERIV_COM_STAGING`, `DERIV_APP_PRODUCTION`, `DERIV_APP_STAGING`, `SMARTTRADER_PRODUCTION`, `SMARTTRADER_STAGING`, `BINARYBOT_PRODUCTION`, `BINARYBOT_STAGING` |
| `src/components/shared/utils/storage/storage.ts` | Removed `binary.sx` hostname check from `CookieStorage` constructor |

---

## P1-7: Remove [AI] Migration Markers

**Problem:** 60+ `[AI]` comments across 30+ files left during migration made the codebase look unpolished.

**Fix:** Removed all `[AI]` / `[/AI]` comment markers from source code. Analytics markers were removed entirely (migration docs already document these). Brand config markers had the `[AI]` tag removed but useful documentation was preserved.

**Files Affected:** ~30 files across stores, pages, components, and layout — all markers removed.

---

## P1-8: Create .env.example

**Problem:** No documentation of required environment variables. Third-party devs wouldn't know what to configure.

**Fix:** Created `.env.example` documenting all environment variables with descriptions and groupings.

**Files Created:**
| File | Content |
|------|---------|
| `.env.example` | Documents all env vars: `CLIENT_ID` (required), Google Drive keys, translations, analytics, monitoring, and build options |

---

## P1-11: Remove Unused Code

**Problem:** Dead code files and exports that are never imported.

**Fix:** Deleted unused files and cleaned up barrel exports.

**Files Deleted:**
| File | Reason |
|------|--------|
| `src/utils/tmp/goog-helper.ts` | Google Closure Library polyfill — never imported |
| `src/utils/url-redirect-utils.ts` | `generateUrlWithRedirect` — never imported by consumers |

**Files Modified:**
| File | Change |
|------|--------|
| `src/utils/index.ts` | Removed dead `print()` function and stale `generateUrlWithRedirect` re-export |

**Note:** `src/utils/tmp/dummy.tsx` was initially flagged but is actually imported by 8 components as a placeholder `Icon` — kept as-is.

---

## P1-13: Rename Binary Bot Google Drive Folder Name

**Problem:** Google Drive folder for saved strategies was hardcoded as "Binary Bot - Strategies".

**Fix:** Changed to generic "Bot - Strategies".

**Files Modified:**
| File | Change |
|------|--------|
| `src/stores/google-drive-store.ts` | Changed `bot_folder_name` from `Binary Bot - ${localize('Strategies')}` to `Bot - ${localize('Strategies')}` |

---

## P1-9: Replace "Deriv Bot" Brand Strings

**Problem:** "Deriv Bot" appeared as a hardcoded brand name in ~70 user-facing strings across 20+ files — tutorials, quick strategy descriptions, tour dialogs, notifications, and help strings.

**Fix:** Added `getPlatformName()` helper to `brand.ts` that reads from `brand.config.json`. Replaced all "Deriv Bot" references with either `getPlatformName()` calls or generic terms like "the bot" / "the trading bot" depending on context.

**Files Modified:**
| File | Change |
|------|--------|
| `src/components/shared/utils/brand/brand.ts` | Added `getPlatformName()` export that reads `config_data.platform.name` |
| `src/pages/dashboard/constants.ts` | Replaced "Deriv Bot" in dashboard text |
| `src/pages/dashboard/announcements/config.tsx` | Replaced "Deriv Bot" in announcement text |
| `src/pages/bot-builder/toolbox/toolbox.tsx` | Replaced "Deriv Bot" |
| `src/pages/bot-builder/toolbar/toolbar.tsx` | Replaced "Deriv Bot" |
| `src/constants/quick-strategies/martingale.ts` | Replaced 5 "Deriv Bot" occurrences with generic terms |
| `src/constants/quick-strategies/d_alembert.ts` | Replaced "Deriv Bot" occurrences |
| `src/constants/quick-strategies/oscars-grind.ts` | Replaced "Deriv Bot" occurrences |
| `src/constants/quick-strategies/reverse-martingale.ts` | Replaced "Deriv Bot" occurrences |
| `src/constants/quick-strategies/reverse-d_alembert.ts` | Replaced "Deriv Bot" occurrences |
| `src/constants/quick-strategies/1-3-2-6.ts` | Replaced "Deriv Bot" occurrences |
| `src/app/app-content.jsx` | Replaced "Deriv Bot" in document title |
| `src/utils/bot-notifications.ts` | Replaced "Deriv Bot" in notification messages |
| `src/components/bot-notification/bot-notification-utils.ts` | Replaced "Deriv Bot" in notification utils |
| `src/stores/run-panel-store.ts` | Replaced "Deriv Bot" in store messages |
| `src/pages/tutorials/constants.ts` | Replaced "Deriv Bot" in FAQ titles and answers |
| `src/pages/tutorials/guide-content/guide-content.tsx` | Replaced "Deriv Bot" |
| `src/pages/tutorials/dbot-tours/tour-content.tsx` | Replaced "Deriv Bot" in tour text |
| `src/pages/tutorials/dbot-tours/common/tour-start-dialog.tsx` | Replaced "Deriv Bot" |
| `src/utils/help-content/help-strings/notify_telegram.ts` | Replaced "Deriv Bot" |
| `src/utils/help-content/help-strings/before_purchase.ts` | Replaced "Deriv Bot" |

---

## P1-10: Clean Up TODO/FIXME Comments

**Problem:** 29+ vague or unhelpful TODO/FIXME comments indicating incomplete work, making the codebase look unfinished.

**Fix:** Removed vague or stale TODO comments. Kept only specific, actionable ones that document genuine known limitations.

**Files Modified:**
| File | Change |
|------|--------|
| `src/pages/bot-builder/bot-builder.tsx` | Removed vague `// TODO: fix` on unused variable |
| `src/stores/app-store.ts` | Removed `// TODO: fix` comment |
| `src/stores/ui-store.ts` | Removed `// TODO: fix - need to implement` |
| `src/stores/client-store.ts` | Removed `// TODO: fix with self exclusion` |
| `src/components/shared/utils/date/date-time.ts` | Removed `// TODO: fix` on date utility |
| `src/stores/run-panel-store.ts` | Removed 4 `// TODO: fix notifications` comments and associated commented-out code |
| `src/components/page-error/page-error.tsx` | Removed `// TODO: NEED TO FIX THIS TO REDIRECT TO THE CORRECT URL` |
| `src/stores/transactions-store.ts` | Removed `// TODO: need to fix as the portfolio is not available now` |

---

## P1-12: Remove Deprecated Function Tags

**Problem:** Several actively-used functions were marked `@deprecated` but had no replacement — misleading for third-party developers.

**Fix:** Removed `@deprecated` tags from functions that are still actively used with no replacement available.

**Files Modified:**
| File | Change |
|------|--------|
| `src/components/shared/utils/screen/responsive.ts` | Removed `@deprecated` from `isMobile()` (used by 20+ files) |
| `src/components/shared/utils/currency/currency.ts` | Removed `@deprecated` from `formatMoney()` (used by 2 consumer files) |
| `src/components/shared/utils/url/helpers.ts` | Removed `@deprecated` from `getlangFromUrl()` and `getActionFromUrl()` |

---

## P1-14: Brand Config Endpoint Consistency

**Problem:** `brand.config.json` had inconsistent placeholder usage — some values used `yourbrand.com`, others used real Deriv API endpoints.

**Assessment:** After review, the Deriv API endpoints (`api.derivws.com`, `auth.deriv.com`) are intentionally real because they are the **API provider's** endpoints, not brand-specific values. White-label clients connect to Deriv's API, so these are correct. Brand-specific values (domain, platform name, etc.) already use placeholder patterns. **No changes needed.**

---

## P1-15: Rename Deriv URL Constants to Brand-Generic Naming

**Problem:** URL constants used Deriv-specific naming (`deriv_urls`, `DERIV_HOST_NAME`, `DERIV_COM_PRODUCTION`, `DERIV_COM_PRODUCTION_EU`) and hardcoded `deriv.com`/`deriv.me`/`deriv.be` domains. Third-party devs would see another company's branding baked into their boilerplate.

**Fix:** Renamed all constants to brand-generic naming (`brand_urls`, `BRAND_HOST_NAME`, `BRAND_PRODUCTION`, `BRAND_PRODUCTION_EU`). Domain values now read from `brand.config.json`'s `brand_domain` field instead of hardcoded Deriv domains.

**Files Modified:**
| File | Change |
|------|--------|
| `src/components/shared/utils/url/constants.ts` | Replaced hardcoded `deriv.com`/`deriv.me`/`deriv.be` domains with `brand.config.json` import. Renamed `deriv_urls` → `brand_urls`, `DERIV_HOST_NAME` → `BRAND_HOST_NAME`, `DERIV_COM_PRODUCTION` → `BRAND_PRODUCTION`, `DERIV_COM_PRODUCTION_EU` → `BRAND_PRODUCTION_EU` |
| `src/components/shared/utils/url/url.ts` | Updated import and all references from `deriv_urls` → `brand_urls` and `DERIV_*` → `BRAND_*` |
| `src/components/shared/utils/storage/storage.ts` | Updated import and usage from `deriv_urls.DERIV_HOST_NAME` → `brand_urls.BRAND_HOST_NAME` |

---

## P1-16: Clean Up Remote Config Hook

**Problem:** `useRemoteConfig` hook still contained analytics-specific feature flags (`marketing_growthbook`, `tracking_rudderstack`, `tracking_posthog`) that were already removed from the codebase.

**Fix:** Removed the stale analytics flags. Hook now returns an empty config object with a comment guiding devs to add their own flags as needed.

**Files Modified:**
| File | Change |
|------|--------|
| `src/hooks/remote-config/useRemoteConfig.ts` | Removed analytics-specific flags and migration doc reference. Simplified to empty config with usage example in comments |

---

## P1-17: Fix Pre-existing ESLint Errors (Unused Variables)

**Problem:** 5 pre-existing ESLint errors (`@typescript-eslint/no-unused-vars`) across 4 files — variables assigned but never used.

**Fix:** Removed unused variables and parameters.

**Files Modified:**
| File | Change |
|------|--------|
| `src/components/trade-animation/trade-animation.tsx` | Removed unused `safeActiveTab` variable and associated comments |
| `src/pages/bot-builder/quick-strategy/form-wrappers/desktop-form-wrapper.tsx` | Removed unused `values` from `useFormikContext` destructure |
| `src/pages/chart/chart.tsx` | Removed unused `options` parameter from `handleStateChange` |
| `src/stores/load-modal-store.ts` | Removed unused `block_string` from destructure; removed unused `result` assignment |

**Result:** ESLint now reports **0 errors** across the entire codebase.

---

## P2-1: Fix TypeScript Errors in run-panel-store.ts and load-modal-store.ts

**Problem:** `run-panel-store.ts` had 3 TypeScript errors and `load-modal-store.ts` had ~40 TypeScript errors. Key issues:
- `@deriv/stores/types` — phantom dependency from Deriv monorepo, module not found
- `TDbot` type not exported from `Types` module
- `TBotSkeleton.interpreter` typed as `unknown`, blocking deep property access
- Blockly types missing many properties (`dispose`, `zoomCenter`, `asyncClear`, `cleanUp`, `clearUndo`, `inject`, `Themes`, `getMainWorkspace`, `xmlValues`)
- `RootStore.dbot` typed as `unknown`
- Nullable `derivWorkspace` access without guards
- Missing parameter types and unused parameters

**Fix:**
- Created local `@deriv/stores/types` module at `src/types/deriv-stores.ts` with `TStores`, `TPortfolioPosition`, and `TNotificationMessage` types
- Added path alias in `tsconfig.json`, `rsbuild.config.ts`, and `jest.config.ts`
- Exported `TDbot` alias from `dbot.types.ts`
- Added `TBotInterpreter` type with full `bot.tradeEngine.options` and `bot.getInterface()` shape
- Extended `BlocklyWorkspace` with `dispose`, `zoomCenter`, `cleanUp`, `clearUndo`, `RTL`
- Extended `ExtendedBlocklyWorkspace` with `asyncClear`
- Added `BlocklyXmlValues` interface and `inject`, `getMainWorkspace`, `Themes` to Window.Blockly
- Typed `RootStore.dbot` as `TDbot` and constructor parameter
- Added null guards for `derivWorkspace` access throughout `load-modal-store.ts`
- Fixed event handler types, unused parameters, and nullable property access

**Files Modified:**
| File | Change |
|------|--------|
| `src/types/deriv-stores.ts` | **New** — Local replacement for `@deriv/stores/types` with `TStores`, `TPortfolioPosition`, `TNotificationMessage` |
| `src/types/dbot.types.ts` | Added `TDbot` alias and `TBotInterpreter` type for interpreter deep access |
| `src/types/blockly.types.ts` | Added missing workspace methods, `BlocklyXmlValues`, `inject`, `getMainWorkspace`, `Themes` |
| `tsconfig.json` | Added `@deriv/stores/types` path mapping |
| `rsbuild.config.ts` | Added `@deriv/stores/types` alias |
| `jest.config.ts` | Added `@deriv/stores/types` module name mapping |
| `src/stores/root-store.ts` | Typed `dbot` field and constructor param as `TDbot` |
| `src/stores/run-panel-store.ts` | Added `helpers` import for `keep_current_contract` |
| `src/stores/load-modal-store.ts` | Fixed workspace types, null guards, event types, unused params, Google Drive return type |

**Result:** Both stores now have **0 TypeScript errors**. Total project-wide TS errors reduced from 728 to 694 (34 errors fixed).

---

## Verification Checklist

After all fixes:
- [ ] `npm run build` — clean production build
- [ ] `npm test` — all tests pass
- [ ] `grep -r "Deriv Bot" src/` — zero matches in source files
- [ ] `grep -r "\[AI\]" src/` — zero matches in source files
- [ ] `grep -r "32izC2lBT4MmiSNWuxq2l"` — CLIENT_ID fallback removed
- [ ] `grep -r "dbot-conf-dot-deriv"` — analytics endpoint removed
- [ ] `grep -r "binary\.sx" src/` — no internal test domain references
- [ ] Deploy to non-Deriv domain — verify branding renders correctly
