# Trading Bot Platform — Developer Documentation

End-to-end documentation for third-party developers setting up, customizing, and deploying the Trading Bot platform.

---

## Documentation Index

| #  | Guide                                                    | Description                                              |
| -- | -------------------------------------------------------- | -------------------------------------------------------- |
| 01 | [Getting Started](./01-getting-started.md)               | Prerequisites, project setup, commands, environment variables |
| 02 | [Architecture Overview](./02-architecture-overview.md)   | Application layers, state management (MobX), RxJS streams, bot engine |
| 03 | [White Labeling](./03-white-labeling.md)                 | Branding, colors, typography, logo, menus, theme configuration |
| 04 | [Authentication](./04-authentication.md)                 | OAuth 2.0 with PKCE, token exchange, session management, logout |
| 05 | [WebSocket Integration](./05-websocket-integration.md)   | Connection architecture, public/authenticated endpoints, DerivWS API |
| 06 | [Error Handling](./06-error-handling.md)                  | Centralized ErrorLogger, reporting service integration, migration |
| 07 | [Monitoring & Analytics](./07-monitoring-analytics.md)   | Datadog RUM, TrackJS, Rudderstack, Growthbook feature flags |
| 08 | [Changelog](./08-changelog.md)                          | All architectural changes from original Deriv Bot to this boilerplate |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure your brand
#    Edit brand.config.json with your colors, name, and domain

# 3. Generate brand CSS
npm run generate:brand-css

# 4. Start development
npm start

# 5. Open in browser
#    https://localhost:8443
```

For the full setup walkthrough, see [Getting Started](./01-getting-started.md).

---

## Reading Order

**New to the project?** Follow this order:

1. **[Getting Started](./01-getting-started.md)** — Set up your development environment
2. **[Architecture Overview](./02-architecture-overview.md)** — Understand how the app is structured
3. **[White Labeling](./03-white-labeling.md)** — Customize branding for your application
4. **[Authentication](./04-authentication.md)** — Configure OAuth login for your domain
5. **[WebSocket Integration](./05-websocket-integration.md)** — Understand real-time data connections
6. **[Error Handling](./06-error-handling.md)** — Set up error logging and reporting
7. **[Monitoring & Analytics](./07-monitoring-analytics.md)** — Add optional monitoring tools

**Just need branding?** Start with [White Labeling](./03-white-labeling.md).

**Setting up auth?** Jump to [Authentication](./04-authentication.md) and [WebSocket Integration](./05-websocket-integration.md).

---

## Tech Stack Summary

| Technology         | Purpose                      |
| ------------------ | ---------------------------- |
| React 18           | UI framework                 |
| TypeScript         | Type-safe JavaScript         |
| MobX               | Reactive state management    |
| RxJS               | Observable streams (API layer)|
| Blockly            | Visual programming (bot builder) |
| RSBuild            | Build tool (Rust-based)      |
| Jest               | Testing framework            |
| SCSS               | Styling                      |
| React Router v6    | Client-side routing          |
| DerivAPI           | WebSocket trading API        |
