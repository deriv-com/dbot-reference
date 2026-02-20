# Trading Bot Template

> A modern platform for automated derivatives trading with visual bot building, real-time analytics, and comprehensive tutorials.

![Prerequisite](https://img.shields.io/badge/node-20.x-blue.svg)
![Prerequisite](https://img.shields.io/badge/npm-9.x-blue.svg)
![Build](https://img.shields.io/badge/build-RSBuild-green.svg)
![Framework](https://img.shields.io/badge/framework-React%2018-blue.svg)

## Table of Contents

- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
- [Project Overview](#project-overview)
    - [Key Features](#key-features)
    - [Architecture](#architecture)
- [Development Workflow](#development-workflow)
    - [Available Scripts](#available-scripts)
    - [Starting Development Server](#starting-development-server)
    - [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Deployment Setup](#deployment-setup)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Getting Started

### Prerequisites

Before working with this repository, ensure you have the following installed:

- **Node.js 20.x** - Required for running the application
- **npm 9.x** - Package manager
- **git** - For version control

### Installation

1. **Clone the repository**

    ```sh
    git clone <repository-url>
    cd trading-bot-template
    ```

2. **Install dependencies**

    ```sh
    npm install
    ```

3. **Build the application**

    ```sh
    npm run build
    ```

4. **Start the development server**

    ```sh
    npm start
    ```

The application will be available at `https://localhost:8443/` (or the port specified by RSBuild).

## Project Overview

Trading Bot Template is a comprehensive platform for automated derivatives trading that provides users with powerful tools to create, test, and deploy trading bots without requiring programming knowledge.

### Key Features

- **🎯 Visual Bot Builder**: Drag-and-drop interface using Blockly for creating trading strategies
- **📊 Real-time Dashboard**: Monitor active bots, trading performance, and account statistics
- **📈 Integrated Charts**: SmartCharts integration for advanced market analysis
- **🎓 Interactive Tutorials**: Step-by-step guides for learning bot building and trading strategies
- **📱 Responsive Design**: Optimized for both desktop and mobile devices
- **📊 Analytics Integration**: Comprehensive tracking with RudderStack and GTM
- **⚡ Real-time Updates**: WebSocket connections for live market data and bot status

### Architecture

The application follows a modular, component-based architecture:

- **Frontend**: React 18 with TypeScript for type safety
- **State Management**: MobX for reactive state management
- **Build System**: RSBuild for fast development and optimized production builds
- **Styling**: Sass with component-scoped styles
- **Testing**: Jest with React Testing Library
- **Code Quality**: ESLint, Prettier, and Husky for consistent code standards

## Development Workflow

### Available Scripts

| Command                 | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm start`             | Start development server with hot reload |
| `npm run build`         | Create production build                  |
| `npm run watch`         | Build in watch mode for development      |
| `npm run serve`         | Serve production build locally           |
| `npm test`              | Run Jest tests                           |
| `npm run coverage`      | Generate test coverage report            |
| `npm run test:lint`     | Run linting and formatting               |
| `npm run test:fix`      | Fix linting issues automatically         |
| `npm run build:analyze` | Analyze bundle size with detailed report |

### Starting Development Server

For local development:

```sh
# Start the development server
npm start

# Alternative: Start with webpack (if needed)
npm run start:webpack
```

The development server includes:

- Hot module replacement
- Source maps
- Live reloading
- Error overlay

### Building for Production

```sh
# Create optimized production build
npm run build

# Analyze bundle size
npm run build:analyze

# Serve production build locally for testing
npm run serve
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── button-link/     # Custom button components
│   ├── error-component/ # Error boundary handling
│   └── trading-view-chart/ # Chart integration
├── pages/               # Main application pages
│   ├── dashboard/       # Bot management dashboard
│   ├── bot-builder/     # Visual bot building interface
│   ├── chart/           # Trading charts and analysis
│   ├── tutorials/       # Interactive learning modules
│   └── main/            # Main application wrapper
├── hooks/               # Custom React hooks
├── analytics/           # Analytics and tracking utilities
├── external/            # External integrations
│   └── bot-skeleton/    # Core bot functionality
├── styles/              # Global styles and theme
└── xml/                 # Pre-built bot strategy templates
```

### Core Pages

- **Dashboard**: Central hub for managing bots, viewing performance, and accessing quick actions
- **Bot Builder**: Visual programming interface using Blockly for creating trading strategies
- **Charts**: Integrated TradingView charts with market analysis tools
- **Tutorials**: Interactive guides and educational content

## Technologies Used

### Core Technologies

- **React 18** - Modern React with Hooks and Concurrent Features
- **TypeScript** - Static type checking and enhanced developer experience
- **MobX** - Reactive state management
- **React Router** - Client-side routing

### Build & Development

- **RSBuild** - Fast build tool with optimized defaults
- **Sass** - Advanced CSS with variables and mixins
- **Jest** - Testing framework
- **ESLint + Prettier** - Code quality and formatting

### UI & Visualization

- **Blockly** - Visual programming blocks for bot building
- **TradingView** - Advanced charting and market analysis
- **Framer Motion** - Smooth animations and transitions
- **@deriv-com/ui** - Deriv's design system components

### External Services

- **@deriv-com/analytics** - Analytics and user tracking
- **@deriv/deriv-api** - Trading API integration
- **@datadog/browser-rum** - Real user monitoring

## Configuration

### Deployment Setup

#### Cloudflare Pages

For deploying to Cloudflare Pages, configure the following secrets in GitHub Actions:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_PROJECT_NAME=your_project_name
```

## Testing

The project uses Jest and React Testing Library for testing:

```sh
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- dashboard.spec.tsx
```

### Test Structure

- **Unit Tests**: Individual component and utility function tests
- **Integration Tests**: Testing component interactions
- **End-to-End**: Testing complete user workflows

## Troubleshooting

### Common Issues

1. **Development server won't start**

    ```sh
    # Clear npm cache and reinstall
    npm cache clean --force
    rm -rf node_modules package-lock.json
    npm install
    ```

2. **Build failures**

    ```sh
    # Check Node.js version
    node --version  # Should be 20.x

    # Clear RSBuild cache
    rm -rf dist
    npm run build
    ```

3. **Blockly workspace issues**
    - Ensure browser supports Web Workers
    - Check console for JavaScript errors
    - Try refreshing the page to reinitialize workspace

4. **WebSocket connection problems**
    - Verify network connectivity
    - Check if firewall is blocking WebSocket connections
    - Ensure correct API endpoints in environment variables

### Performance Optimization

- Use `npm run build:analyze` to identify bundle size issues
- Lazy load components using React.lazy() where appropriate
- Monitor memory usage in browser DevTools
- Use React DevTools Profiler to identify rendering bottlenecks

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests**: `npm test`
5. **Run linting**: `npm run test:lint`
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to the branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Code Standards

- Follow TypeScript best practices
- Use functional components with hooks
- Write comprehensive tests for new features
- Follow existing naming conventions
- Update documentation for significant changes

### Git Workflow

- Use conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`
- Keep commits atomic and focused
- Write descriptive commit messages
- Rebase feature branches before merging

---

For additional support or questions, please refer to the project's issue tracker or contact the development team.
