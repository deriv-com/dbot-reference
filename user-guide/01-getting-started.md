# Getting Started

A step-by-step guide to setting up your own trading bot platform derived from the Deriv Bot architecture.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Available Commands](#available-commands)
- [Environment Variables](#environment-variables)
- [First Run Checklist](#first-run-checklist)

---

## Prerequisites

| Requirement  | Version  | Purpose                                 |
| ------------ | -------- | --------------------------------------- |
| **Node.js**  | 20.x     | JavaScript runtime (enforced in `package.json` engines) |
| **npm**      | 9+       | Package management                      |
| **Git**      | 2.30+    | Version control                         |
| **Browser**  | Chrome, Firefox, or Safari (latest) | Development and testing |

Verify your environment:

```bash
node --version   # Should output v20.x.x
npm --version    # Should output 9.x or higher
git --version    # Should output 2.30+
```

---

## Project Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd dbot-reference
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Your Brand

Edit `brand.config.json` in the project root with your brand details:

```json
{
    "brand_name": "YourBrand",
    "brand_domain": "yourbrand.com",
    "domain_name": "YourBrand.com",
    "colors": {
        "primary": "#3b82f6",
        "secondary": "#64748b"
    },
    "platform": {
        "name": "Your Trading Platform"
    }
}
```

> See [White Labeling Guide](./03-white-labeling.md) for the complete configuration reference.

### 4. Generate Brand CSS

```bash
npm run generate:brand-css
```

This validates your color configuration and generates CSS custom properties in `src/styles/_themes.scss`.

### 5. Start Development Server

```bash
npm start
```

Visit `https://localhost:8443` to see your platform running.

---

## Development Workflow

```
1. Edit brand.config.json        (branding changes)
2. npm run generate:brand-css    (regenerate CSS variables)
3. npm start                     (start dev server)
4. Make code changes             (auto-refreshes via HMR)
5. npm test                      (run tests)
6. npm run test:lint             (check code quality)
7. npm run build                 (production build)
```

---

## Project Structure

```
dbot-reference/
├── brand.config.json              # Central branding configuration
├── rsbuild.config.ts              # Build configuration (RSBuild)
├── jest.config.ts                 # Test configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies and scripts
│
├── public/                        # Static assets
│   ├── index.html                 # HTML entry point
│   └── images/                    # Static images
│
├── scripts/                       # Build and utility scripts
│   ├── generate-brand-css.js      # Brand CSS generator
│   └── validate-brand-config.js   # Configuration validator
│
├── src/
│   ├── main.tsx                   # Application entry point
│   ├── app/
│   │   ├── App.tsx                # Root component (routing, providers)
│   │   ├── CoreStoreProvider.tsx   # Bridges API layer with MobX stores
│   │   └── AuthWrapper.tsx        # Authentication wrapper
│   │
│   ├── adapters/                  # Third-party library adapters
│   │   └── smartcharts-champion/  # Trading charts adapter
│   │
│   ├── analytics/                 # Analytics event tracking (optional)
│   │   ├── constants.ts
│   │   └── rudderstack-*.ts       # Event tracking modules
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-logo/          # Brand logo component
│   │   │   ├── header/            # Desktop & mobile header/menu
│   │   │   └── footer/            # Footer with theme toggle
│   │   └── shared/                # Shared UI components and utilities
│   │
│   ├── external/
│   │   ├── bot-skeleton/          # Core bot execution engine
│   │   │   ├── scratch/           # Blockly block definitions
│   │   │   ├── services/          # API, WebSocket, bot runtime
│   │   │   └── utils/             # Bot helper utilities
│   │   └── indicators/            # Technical indicator implementations
│   │
│   ├── hooks/                     # React hooks
│   │   ├── auth/                  # Authentication hooks
│   │   ├── useStore.ts            # MobX store access hook
│   │   └── useLogout.ts           # Logout handler
│   │
│   ├── pages/                     # Route-level components
│   │   ├── dashboard/             # Dashboard page
│   │   ├── bot-builder/           # Bot builder (Blockly workspace)
│   │   ├── chart/                 # Trading chart page
│   │   ├── tutorials/             # Tutorial page
│   │   └── callback/              # OAuth callback handler
│   │
│   ├── services/                  # Application services
│   │   ├── oauth-token-exchange.service.ts
│   │   └── derivws-accounts.service.ts
│   │
│   ├── stores/                    # MobX state management
│   │   ├── root-store.ts          # Root store initialization
│   │   ├── client-store.ts        # Authentication & account state
│   │   ├── blockly-store.ts       # Blockly workspace state
│   │   ├── run-panel-store.ts     # Bot execution state
│   │   └── dashboard-store.ts     # Dashboard state
│   │
│   ├── styles/                    # Global stylesheets
│   │   ├── index.scss             # Main stylesheet entry
│   │   └── _themes.scss           # Auto-generated brand CSS variables
│   │
│   └── utils/                     # Shared utilities
│       └── error-logger.ts        # Centralized error logging
│
└── documation/                    # This documentation
```

---

## Available Commands

### Development

| Command          | Description                                      |
| ---------------- | ------------------------------------------------ |
| `npm start`      | Start dev server at `https://localhost:8443`      |
| `npm run watch`  | Build in watch mode (no server)                  |

### Building

| Command                | Description                                   |
| ---------------------- | --------------------------------------------- |
| `npm run build`        | Production build                              |
| `npm run build:analyze`| Production build with bundle analyzer (port 8888) |

### Testing

| Command                               | Description                    |
| ------------------------------------- | ------------------------------ |
| `npm test`                            | Run all tests (Jest)           |
| `npm test -- --watch`                 | Run tests in watch mode        |
| `npm test -- dashboard.spec.tsx`      | Run a specific test file       |
| `npm run coverage`                    | Generate coverage report       |

### Code Quality

| Command              | Description                           |
| -------------------- | ------------------------------------- |
| `npm run test:lint`  | Run Prettier + ESLint checks          |
| `npm run test:fix`   | Auto-fix formatting and lint issues   |

### Branding

| Command                       | Description                          |
| ----------------------------- | ------------------------------------ |
| `npm run generate:brand-css`  | Generate CSS variables from `brand.config.json` |

---

## Environment Variables

Environment variables are injected via RSBuild's `source.define` in `rsbuild.config.ts`. Create a `.env` file in the project root:

### Translations (Optional)

| Variable              | Description                          | Example                                      |
| --------------------- | ------------------------------------ | -------------------------------------------- |
| `TRANSLATIONS_CDN_URL`| Translation files CDN URL            | `https://cdn.example.com/translations`       |
| `R2_PROJECT_NAME`     | Crowdin project name                 | `dbot`                                       |
| `CROWDIN_BRANCH_NAME` | Crowdin branch for translations      | `master`                                     |

> **Note:** The application is wrapped with `@deriv-com/translations` `TranslationProvider`, but multi-language support **only works** when you have a Crowdin project configured with translation files served via a CDN. Without this, the app defaults to English and functions normally. To show the language switcher in the UI, set `enable_language_settings: true` in `brand.config.json` (see [White Labeling Guide - Footer](./03-white-labeling.md#footer)). If you are not using translations, set it to `false` to hide the language selector.

### Authentication (Required for Login)

| Variable       | Description                | Example                                        |
| -------------- | -------------------------- | ---------------------------------------------- |
| `GD_CLIENT_ID` | Google Drive OAuth client  | `xxxx.apps.googleusercontent.com`              |
| `GD_APP_ID`    | Google Drive app ID        | `123456789`                                    |
| `GD_API_KEY`   | Google Drive API key       | `AIza...`                                      |

### Monitoring (Optional)

| Variable                              | Description                    |
| ------------------------------------- | ------------------------------ |
| `DATADOG_APPLICATION_ID`              | Datadog RUM application ID     |
| `DATADOG_CLIENT_TOKEN`                | Datadog RUM client token       |
| `DATADOG_SESSION_REPLAY_SAMPLE_RATE`  | Session replay sample rate     |
| `DATADOG_SESSION_SAMPLE_RATE`         | Session sample rate            |
| `RUDDERSTACK_KEY`                     | Rudderstack write key          |
| `TRACKJS_TOKEN`                       | TrackJS error tracking token   |
| `POSTHOG_KEY`                         | PostHog API key                |
| `POSTHOG_HOST`                        | PostHog host URL               |
| `GROWTHBOOK_CLIENT_KEY`               | Growthbook client key          |
| `GROWTHBOOK_DECRYPTION_KEY`           | Growthbook decryption key      |

Reference the variables in `rsbuild.config.ts`:

```typescript
source: {
    define: {
        'process.env.RUDDERSTACK_KEY': JSON.stringify(process.env.RUDDERSTACK_KEY),
        // ... other variables
    },
},
```

---

## First Run Checklist

After initial setup, verify these items:

- [ ] `npm install` completes without errors
- [ ] `npm run generate:brand-css` validates your brand config
- [ ] `npm start` launches dev server at `https://localhost:8443`
- [ ] Application loads in browser without console errors
- [ ] Your brand colors appear correctly in the UI
- [ ] Your logo displays in the header
- [ ] `npm test` passes all existing tests
- [ ] `npm run build` produces a production build without errors

---

## Path Aliases

The project uses path aliases configured in both `tsconfig.json` and `rsbuild.config.ts`. Always use these instead of relative paths:

| Alias            | Maps to            |
| ---------------- | ------------------ |
| `@/components`   | `src/components`   |
| `@/hooks`        | `src/hooks`        |
| `@/utils`        | `src/utils`        |
| `@/constants`    | `src/constants`    |
| `@/stores`       | `src/stores`       |
| `@/external`     | `src/external`     |
| `@/analytics`    | `src/analytics`    |
| `@/adapters`     | `src/adapters`     |
| `@/pages`        | `src/pages`        |

Example usage:

```typescript
import { useStore } from '@/hooks/useStore';
import { ErrorLogger } from '@/utils/error-logger';
```

---

## Code Style

- **Formatter:** Prettier (auto-runs via lint-staged on commit)
- **Linter:** ESLint with TypeScript parser
- **Import order** (enforced by `eslint-plugin-simple-import-sort`):
  1. `react` first
  2. External packages
  3. Packages starting with `@`
  4. Internal aliases (`@/components`, `@/utils`, etc.)
  5. Relative imports (`../`, `./`)
  6. Style imports (`.scss`)

- **Commit messages:** Conventional commits enforced via commitlint:
  - `feat:` New features
  - `fix:` Bug fixes
  - `refactor:` Code refactoring
  - `test:` Test additions/changes
  - `docs:` Documentation changes
  - `chore:` Maintenance tasks

---

## Next Steps

| Topic                              | Guide                                                  |
| ---------------------------------- | ------------------------------------------------------ |
| Understand the architecture        | [Architecture Overview](./02-architecture-overview.md) |
| Customize branding and appearance  | [White Labeling Guide](./03-white-labeling.md)         |
| Set up authentication              | [Authentication Guide](./04-authentication.md)         |
| Configure WebSocket connections    | [WebSocket Integration](./05-websocket-integration.md) |
| Set up error handling              | [Error Handling Guide](./06-error-handling.md)         |
| Add monitoring and analytics       | [Monitoring & Analytics](./07-monitoring-analytics.md) |
