# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Derivatives Bot is a visual trading bot platform built with React 18, TypeScript, and Blockly. It allows users to create automated trading strategies using a drag-and-drop interface without programming knowledge. The platform integrates with Deriv's trading API for real-time market data and trade execution.

## Build System & Commands

The project uses RSBuild for fast builds and development. Key commands:

```bash
# Development
npm start                 # Start dev server at https://localhost:8443
npm run watch            # Build in watch mode

# Building
npm run build            # Production build
npm run build:analyze    # Build with bundle analyzer on port 8888

# Testing
npm test                 # Run Jest tests
npm test -- --watch      # Watch mode
npm test -- dashboard.spec.tsx  # Run specific test file
npm run coverage         # Generate coverage report

# Code Quality
npm run test:lint        # Run Prettier + ESLint
npm run test:fix         # Auto-fix linting issues
```

## Architecture

### State Management (MobX)

The application uses MobX for reactive state management through a centralized RootStore pattern. All stores are initialized in [root-store.ts](src/stores/root-store.ts) and connected via the `dbot` object and a `core` object containing `ui`, `client`, and `common` stores.

**Key Stores:**

- `BlocklyStore` - Manages Blockly workspace state and configuration
- `RunPanelStore` - Controls bot execution, start/stop/pause operations
- `DashboardStore` - Handles dashboard data, bot statistics, and performance metrics
- `ToolboxStore` - Manages available Blockly blocks and categories
- `ClientStore` - Manages API connection, account data, and authentication
- `LoadModalStore` / `SaveModalStore` - Handle bot strategy persistence
- `GoogleDriveStore` - Integration with Google Drive for cloud storage
- `JournalStore` / `TransactionsStore` - Track bot execution logs and trade history

Access stores via React Context using the `useStore()` hook defined in [hooks/useStore](src/hooks/useStore.ts).

### Application Structure

**Entry Point:** [src/main.tsx](src/main.tsx)
**Root Component:** [src/app/App.tsx](src/app/App.tsx) - Sets up routing, i18n, and providers
**Core Providers:**

- `CoreStoreProvider` - Provides RootStore to all components
- `TranslationProvider` - i18n via @deriv-com/translations
- `StoreProvider` - MobX store context

**Routing:**

- Uses React Router v6 with lazy-loaded routes
- Main routes: Dashboard, Bot Builder, Chart, Tutorials
- Layout wrapper handles common UI (header, sidebar, footer)

### Bot Execution Engine

The core bot execution logic resides in [src/external/bot-skeleton/](src/external/bot-skeleton/). This directory contains:

- `scratch/` - Blockly block definitions and implementations
- `services/` - Bot runtime services (API calls, trade execution, observers)
- `utils/` - Helper utilities for contracts, workspace management, error handling
- `constants/` - Configuration constants and message definitions

**Bot Workflow:**

1. User creates strategy in Blockly workspace (Bot Builder page)
2. Workspace XML is serialized and can be saved locally or to Google Drive
3. When running, bot-skeleton interprets Blockly blocks and executes trades via Deriv API
4. RunPanelStore coordinates execution state and displays real-time logs
5. Transactions are tracked in JournalStore and TransactionsStore

### Technical Indicators

Custom technical indicator implementations are in [src/external/indicators/](src/external/indicators/):

- Simple Moving Average (SMA)
- Exponential Moving Average (EMA)
- Bollinger Bands
- MACD
- Relative Strength Index (RSI)

These are JavaScript modules used by bot strategies for market analysis.

## Path Aliases

Path aliases are configured in both [tsconfig.json](tsconfig.json) and [rsbuild.config.ts](rsbuild.config.ts):

```typescript
@/components  →  src/components
@/hooks       →  src/hooks
@/utils       →  src/utils
@/constants   →  src/constants
@/stores      →  src/stores
@/external    →  src/external
@/analytics   →  src/analytics
@/adapters    →  src/adapters
@/pages       →  src/pages
```

Always use these aliases for imports instead of relative paths.

## Testing

- **Framework:** Jest with React Testing Library
- **Environment:** jsdom
- **Test Pattern:** `*.spec.tsx` or `*.test.ts` files co-located with source
- **Setup:** [jest.setup.ts](jest.setup.ts) configures @testing-library/jest-dom matchers
- **Coverage:** v8 provider for faster coverage generation

When writing tests:

- Use path aliases (e.g., `@/components/button`) matching the source imports
- Mock external dependencies in `__mocks__/` directory
- Follow existing test patterns in `__tests__/` directories

## Code Style

- **Linting:** ESLint with TypeScript parser
- **Formatting:** Prettier (auto-runs via lint-staged on commit)
- **Import Order:** Uses `eslint-plugin-simple-import-sort` with specific ordering:
    1. `react` first
    2. External packages
    3. Packages starting with `@`
    4. Internal aliases (Components, Constants, Utils, Types, Stores)
    5. Relative imports (`../`, `./`)
    6. Style imports (`.scss`)

- **Commit Messages:** Conventional commits enforced via commitlint
    - `feat:` - New features
    - `fix:` - Bug fixes
    - `refactor:` - Code refactoring
    - `test:` - Test additions/changes
    - `docs:` - Documentation changes

## Environment Variables

Environment variables are injected via RSBuild's `source.define` in [rsbuild.config.ts](rsbuild.config.ts):

- `TRANSLATIONS_CDN_URL` - Translation files CDN
- `GD_CLIENT_ID`, `GD_APP_ID`, `GD_API_KEY` - Google Drive integration
- `DATADOG_*` - Datadog RUM monitoring configuration
- `RUDDERSTACK_KEY` - Analytics tracking
- `POSTHOG_KEY` - PostHog API key
- `POSTHOG_HOST` - PostHog host URL
- `GROWTHBOOK_*` - Feature flags and A/B testing
- `TRACKJS_TOKEN` - Error tracking

These are accessed via `process.env` in the code.

## Key Integration Points

### Deriv API (@deriv/deriv-api)

- WebSocket-based API for real-time market data and trade execution
- Managed through ClientStore and bot-skeleton services
- API types from @deriv/api-types

### Blockly (blockly)

- Visual programming interface for strategy building
- Custom blocks defined in bot-skeleton/scratch/
- Workspace state managed by BlocklyStore

### SmartCharts (@deriv-com/smartcharts-champion)

- TradingView-style charts with technical indicators
- Adapter in [src/adapters/smartcharts-champion/](src/adapters/smartcharts-champion/)
- Assets copied from node_modules during build (see rsbuild.config.ts output.copy)

### Analytics

- RudderStack for event tracking
- Google Tag Manager (GTM) integration
- Datadog RUM for monitoring
- PostHog for user behavior analytics
- TrackJS for error tracking
- Implementations in [src/analytics/](src/analytics/)

## Common Development Patterns

### Accessing Stores in Components

```typescript
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';

const MyComponent = observer(() => {
    const { run_panel, dashboard } = useStore();
    // Use store properties and actions
});
```

### Blockly Block Modifications

When modifying Blockly blocks, look in [src/external/bot-skeleton/scratch/blocks/](src/external/bot-skeleton/scratch/blocks/). Each block category (Advanced, Logic, Math, etc.) has its own subdirectory.

### Adding New Stores

1. Create store class in `src/stores/`
2. Add to RootStore constructor in [root-store.ts](src/stores/root-store.ts)
3. Update RootStore type definition
4. Initialize with `this` and `this.core` if needed

## Debugging

- **React DevTools:** Inspect component hierarchy and props
- **MobX DevTools:** Track state changes and reactions
- **Redux DevTools:** Not used (this project uses MobX, not Redux)
- **Bundle Analysis:** Run `npm run build:analyze` to identify large dependencies
- **Source Maps:** Enabled in development builds for debugging

## Important Files

- [rsbuild.config.ts](rsbuild.config.ts) - Build configuration, aliases, environment variables
- [jest.config.ts](jest.config.ts) - Test configuration and module name mapping
- [src/stores/root-store.ts](src/stores/root-store.ts) - Central state management initialization
- [src/app/App.tsx](src/app/App.tsx) - Application routing and provider setup
- [src/external/bot-skeleton/](src/external/bot-skeleton/) - Core bot execution engine

## Node Version

This project requires **Node.js 20.x** as specified in [package.json](package.json) engines field.
