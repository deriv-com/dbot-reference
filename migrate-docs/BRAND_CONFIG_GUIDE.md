<!-- This is a comprehensive brand configuration reference guide created for white-labeling -->

# Brand Configuration Guide

Complete reference for customizing your Trading Bot platform through `brand.config.json`.

## Table of Contents

- [Overview](#overview)
- [Configuration Structure](#configuration-structure)
- [Brand Identity](#brand-identity)
- [Color System](#color-system)
- [Typography](#typography)
- [Color Variants](#color-variants)
- [Theme Configuration](#theme-configuration)
- [Platform Configuration](#platform-configuration)
    - [Logo Configuration](#logo-configuration)
    - [Footer Configuration](#footer-configuration)
    - [Menu Configuration](#menu-configuration)
    - [Hostname Configuration](#hostname-configuration)
    - [Authentication Configuration](#authentication-configuration)
    - [WebSocket Configuration](#websocket-configuration)
- [Menu Customization](#menu-customization)
- [Examples](#examples)

---

## Overview

The `brand.config.json` file is the central configuration file for all branding and platform customization. It controls:

- 🎨 **Visual Identity**: Colors, typography, and logo
- 🔧 **Platform Settings**: Name, hostname, and endpoints
- 🌐 **API Configuration**: Authentication and WebSocket URLs
- 📱 **UI Behavior**: Menu items, footer elements, and theme settings

**Location**: `/brand.config.json` (project root)

---

## Configuration Structure

```json
{
    "brand_name": "string",
    "brand_domain": "string",
    "brand_hostname": { ... },
    "domain_name": "string",
    "colors": { ... },
    "typography": { ... },
    "color_variants": { ... },
    "theme_config": { ... },
    "platform": { ... }
}
```

---

## Brand Identity

Basic brand information displayed throughout the platform.

### Fields

| Field            | Type     | Required | Description                                                |
| ---------------- | -------- | -------- | ---------------------------------------------------------- |
| `brand_name`     | `string` | ✅ Yes   | Short brand name (e.g., "YourBrand")                       |
| `brand_domain`   | `string` | ✅ Yes   | Primary domain without protocol (e.g., "yourbrand.com")    |
| `domain_name`    | `string` | ✅ Yes   | Display domain with capitalization (e.g., "YourBrand.com") |
| `brand_hostname` | `object` | ✅ Yes   | Environment-specific hostnames for routing                 |

### Example

```json
{
    "brand_name": "TradePro",
    "brand_domain": "tradepro.com",
    "domain_name": "TradePro.com",
    "brand_hostname": {
        "staging": "staging.tradepro.com/dashboard",
        "production": "tradepro.com/dashboard"
    }
}
```

### Usage

- **brand_name**: Used in page titles, meta tags, and analytics
- **brand_domain**: Base domain for API calls and authentication
- **domain_name**: Displayed in UI (footer, about pages, etc.)
- **brand_hostname**: Used for environment detection and routing

---

## Color System

Define your brand's color palette. Colors are automatically converted to CSS custom properties.

### Primary Colors

| Field       | Type  | Required | Description        | Usage                         |
| ----------- | ----- | -------- | ------------------ | ----------------------------- |
| `primary`   | `hex` | ✅ Yes   | Main brand color   | Buttons, links, active states |
| `secondary` | `hex` | ✅ Yes   | Secondary UI color | Secondary buttons, borders    |
| `tertiary`  | `hex` | ❌ No    | Accent color       | Highlights, badges            |

### Semantic Colors

| Field     | Type  | Required | Description            | Usage                        |
| --------- | ----- | -------- | ---------------------- | ---------------------------- |
| `success` | `hex` | ✅ Yes   | Success indicator      | Profit, success messages     |
| `danger`  | `hex` | ✅ Yes   | Error/danger indicator | Loss, error messages, alerts |
| `warning` | `hex` | ✅ Yes   | Warning indicator      | Warnings, cautions           |
| `info`    | `hex` | ✅ Yes   | Information indicator  | Info messages, tooltips      |

### Neutral Colors

| Field     | Type  | Required | Description         | Usage                            |
| --------- | ----- | -------- | ------------------- | -------------------------------- |
| `neutral` | `hex` | ✅ Yes   | Neutral UI elements | Disabled states, placeholders    |
| `black`   | `hex` | ✅ Yes   | Dark color          | Text, dark backgrounds           |
| `white`   | `hex` | ✅ Yes   | Light color         | Light backgrounds, inverted text |

### Grey Scale

| Field                  | Type  | Required | Description                                            |
| ---------------------- | ----- | -------- | ------------------------------------------------------ |
| `grey.50` - `grey.900` | `hex` | ✅ Yes   | 9-shade grey scale from lightest (50) to darkest (900) |

### Example

```json
{
    "colors": {
        "primary": "#3b82f6",
        "secondary": "#64748b",
        "tertiary": "#8b5cf6",
        "success": "#10b981",
        "danger": "#ef4444",
        "warning": "#f59e0b",
        "info": "#0ea5e9",
        "neutral": "#6b7280",
        "black": "#0f172a",
        "white": "#ffffff",
        "grey": {
            "50": "#f8fafc",
            "100": "#f1f5f9",
            "200": "#e2e8f0",
            "300": "#cbd5e1",
            "400": "#94a3b8",
            "500": "#64748b",
            "600": "#475569",
            "700": "#334155",
            "800": "#1e293b",
            "900": "#0f172a"
        }
    }
}
```

### Generated CSS Variables

```css
--brand-primary: #3b82f6;
--brand-secondary: #64748b;
--brand-tertiary: #8b5cf6;
--brand-success: #10b981;
--brand-danger: #ef4444;
--brand-warning: #f59e0b;
--brand-info: #0ea5e9;
--brand-neutral: #6b7280;
--brand-black: #0f172a;
--brand-white: #ffffff;
--brand-grey-50: #f8fafc;
/* ... and so on */
```

### Color Format Requirements

- **Format**: Hexadecimal color codes only (`#RRGGBB` or `#RGB`)
- **Case**: Lowercase preferred (`#3b82f6` not `#3B82F6`)
- **Length**: 6-digit hex recommended (`#3b82f6` not `#38f`)
- **Validation**: Run `npm run generate:brand-css` to validate

---

## Typography

Configure font families used throughout the platform.

### Fields

| Field                   | Type     | Required | Description          | Usage                     |
| ----------------------- | -------- | -------- | -------------------- | ------------------------- |
| `font_family.primary`   | `string` | ✅ Yes   | Main font stack      | Body text, UI elements    |
| `font_family.secondary` | `string` | ❌ No    | Secondary font stack | Headings, special text    |
| `font_family.monospace` | `string` | ❌ No    | Monospace font stack | Code blocks, numeric data |

### Font Sizes

| Field                              | Type     | Required | Description                                           |
| ---------------------------------- | -------- | -------- | ----------------------------------------------------- |
| `font_sizes.xs` - `font_sizes.4xl` | `rem/px` | ✅ Yes   | Font size scale (xs, sm, base, lg, xl, 2xl, 3xl, 4xl) |

### Example

```json
{
    "typography": {
        "font_family": {
            "primary": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            "secondary": "Georgia, 'Times New Roman', Times, serif",
            "monospace": "'Courier New', Courier, monospace"
        },
        "font_sizes": {
            "xs": "0.75rem",
            "sm": "0.875rem",
            "base": "1rem",
            "lg": "1.125rem",
            "xl": "1.25rem",
            "2xl": "1.5rem",
            "3xl": "1.875rem",
            "4xl": "2.25rem"
        }
    }
}
```

### Font Loading Options

#### System Fonts (Recommended)

Best for performance - no external requests needed.

```json
{
    "font_family": {
        "primary": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }
}
```

#### Google Fonts

Add to `public/index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

Then reference in config:

```json
{
    "font_family": {
        "primary": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }
}
```

#### Self-Hosted Fonts

1. Add font files to `public/fonts/`
2. Create `src/styles/_fonts.scss`:

```scss
@font-face {
    font-family: 'YourFont';
    src: url('/fonts/YourFont-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}
```

3. Reference in config:

```json
{
    "font_family": {
        "primary": "'YourFont', -apple-system, BlinkMacSystemFont, sans-serif"
    }
}
```

---

## Color Variants

Configure automatic color variant generation for light/dark themes.

### Fields

| Field              | Type       | Required | Description                                                       |
| ------------------ | ---------- | -------- | ----------------------------------------------------------------- |
| `light_variants`   | `number[]` | ✅ Yes   | Grey shades for light theme (e.g., [100, 200, 300, 400, 500])     |
| `dark_variants`    | `number[]` | ✅ Yes   | Grey shades for dark theme (e.g., [600, 700, 800, 900])           |
| `opacity_variants` | `number[]` | ❌ No    | Opacity percentages for transparent variants (e.g., [10, 20, 30]) |

### Example

```json
{
    "color_variants": {
        "light_variants": [100, 200, 300, 400, 500],
        "dark_variants": [600, 700, 800, 900],
        "opacity_variants": [10, 20, 30, 40, 50, 60, 70, 80, 90]
    }
}
```

### Usage

- **light_variants**: Used for light mode backgrounds, borders, and subtle UI elements
- **dark_variants**: Used for dark mode backgrounds, borders, and text
- **opacity_variants**: Generate transparent versions of colors for overlays and shadows

---

## Theme Configuration

Control theme system behavior.

### Fields

| Field                    | Type      | Default     | Description                                   |
| ------------------------ | --------- | ----------- | --------------------------------------------- |
| `enable_dynamic_themes`  | `boolean` | `true`      | Enable/disable dynamic theme switching        |
| `auto_generate_variants` | `boolean` | `true`      | Auto-generate color variants from base colors |
| `css_variable_prefix`    | `string`  | `"--brand"` | Prefix for CSS custom properties              |

### Example

```json
{
    "theme_config": {
        "enable_dynamic_themes": true,
        "auto_generate_variants": true,
        "css_variable_prefix": "--brand"
    }
}
```

### Usage

- **enable_dynamic_themes**: When `false`, locks theme to one mode (useful for brand consistency)
- **auto_generate_variants**: Automatically creates lighter/darker shades of your colors
- **css_variable_prefix**: Change if you need to avoid naming conflicts (e.g., `"--tp"` for TradePro)

---

## Platform Configuration

Platform-specific settings for features, UI, and integrations.

### Fields

```json
{
    "platform": {
        "name": "string",
        "logo": { ... },
        "footer": { ... },
        "hostname": { ... },
        "auth2_url": { ... },
        "derivws": { ... }
    }
}
```

---

### Logo Configuration

Configure how your brand logo is displayed.

#### Fields

| Field            | Type      | Required      | Description              | Options                                     |
| ---------------- | --------- | ------------- | ------------------------ | ------------------------------------------- |
| `type`           | `string`  | ✅ Yes        | Logo type                | `"component"` or `"image"`                  |
| `component_name` | `string`  | Conditional\* | React component name     | `"BrandLogo"` (when type is "component")    |
| `image_url`      | `string`  | Conditional\* | Image path               | `"/images/logo.svg"` (when type is "image") |
| `alt_text`       | `string`  | ✅ Yes        | Accessibility text       | Describes logo for screen readers           |
| `link_url`       | `string`  | ✅ Yes        | Click destination        | Usually `"/"` for home                      |
| `show_text`      | `boolean` | ❌ No         | Show text alongside logo | `true` or `false`                           |
| `text`           | `string`  | Conditional\* | Text to display          | Required if `show_text` is `true`           |

\* Conditional: Required based on other field values

#### Option 1: Component Logo (Recommended)

Use a React component for full control and theme support.

```json
{
    "platform": {
        "logo": {
            "type": "component",
            "component_name": "BrandLogo",
            "alt_text": "TradePro",
            "link_url": "/",
            "show_text": false
        }
    }
}
```

**Implementation:**

1. Create `src/components/layout/app-logo/BrandLogo.tsx`:

```tsx
export const BrandLogo = ({ width = 120, height = 32, fill = 'currentColor' }) => (
    <svg width={width} height={height} viewBox='0 0 120 32' fill='none'>
        {/* Your SVG paths here */}
        <path fill={fill} d='M...' />
    </svg>
);
```

2. Export in `src/components/layout/app-logo/index.tsx`:

```tsx
export { BrandLogo } from './BrandLogo';
```

#### Option 2: Image Logo

Use an image file (PNG, SVG, etc.).

```json
{
    "platform": {
        "logo": {
            "type": "image",
            "image_url": "/images/logo.svg",
            "alt_text": "TradePro",
            "link_url": "/",
            "show_text": false
        }
    }
}
```

**Requirements:**

- Place image in `public/images/` directory
- Use `image_url` path relative to public folder
- SVG format recommended for scalability
- PNG should include @2x retina version

#### Logo Best Practices

- **Format**: SVG preferred for scalability and theme support
- **Size**: Optimize for ~120x32px at 1x resolution
- **Color**: Use `currentColor` or dynamic `fill` prop for theme compatibility
- **Accessibility**: Always provide meaningful `alt_text`
- **Retina**: For PNG, provide @2x version (240x64px)
- **Performance**: Optimize SVG paths and remove unnecessary metadata

---

### Footer Configuration

Control visibility of footer and mobile menu elements.

#### Fields

| Field                      | Type      | Default | Description                                           |
| -------------------------- | --------- | ------- | ----------------------------------------------------- |
| `enable_language_settings` | `boolean` | `true`  | Show/hide language selector in footer and mobile menu |
| `enable_theme_toggle`      | `boolean` | `true`  | Show/hide theme toggle in footer and mobile menu      |

#### Example

```json
{
    "platform": {
        "footer": {
            "enable_language_settings": true,
            "enable_theme_toggle": true
        }
    }
}
```

#### Configuration Impact

**Desktop Footer:**

- Language selector (globe icon + language code)
- Theme toggle button (sun/moon icon)

**Mobile Menu:**

- Language settings menu item
- Dark theme toggle switch

#### Use Cases

| Scenario                | `enable_language_settings` | `enable_theme_toggle` | Result                         |
| ----------------------- | -------------------------- | --------------------- | ------------------------------ |
| Single language app     | `false`                    | `true`                | Only theme toggle visible      |
| Force single theme      | `true`                     | `false`               | Only language selector visible |
| Minimal UI              | `false`                    | `false`               | Clean footer, no toggles       |
| Full features (default) | `true`                     | `true`                | Both options visible           |

#### Example Configurations

**Minimal Footer (No Settings):**

```json
{
    "footer": {
        "enable_language_settings": false,
        "enable_theme_toggle": false
    }
}
```

**Single Language with Theme Toggle:**

```json
{
    "footer": {
        "enable_language_settings": false,
        "enable_theme_toggle": true
    }
}
```

**Custom Language Selector Elsewhere:**

```json
{
    "footer": {
        "enable_language_settings": false,
        "enable_theme_toggle": true
    }
}
```

> Use this when implementing your own language switcher in a different location

---

### Menu Configuration

The platform provides placeholder locations for custom menu items in both desktop header and mobile menu.

#### Desktop Menu Items

**Location**: `src/components/layout/header/header-config.tsx`

**Default State**: Empty array with placeholder comments

```typescript
// Add your custom menu items here for the desktop header.
//
// EXAMPLE:
// export const MenuItems: MenuItemsConfig[] = [
//     {
//         as: 'a',
//         href: '/your-page',
//         icon: <YourIcon />,
//         label: localize('Your Menu Item'),
//     },
// ];

export const MenuItems: MenuItemsConfig[] = [];
```

**How to Add Desktop Menu Items:**

1. Edit `src/components/layout/header/header-config.tsx`
2. Import required icons:

```typescript
import { YourIcon } from '@deriv/quill-icons';
```

3. Add items to the array:

```typescript
export const MenuItems: MenuItemsConfig[] = [
    {
        as: 'a',
        href: '/analytics',
        icon: <ChartIcon />,
        label: localize('Analytics'),
    },
    {
        as: 'a',
        href: '/settings',
        icon: <SettingsIcon />,
        label: localize('Settings'),
    },
];
```

#### Mobile Menu Items

**Location**: `src/components/layout/header/mobile-menu/use-mobile-menu-config.tsx`

**Default State**: Empty with placeholder comments

```typescript
// Add your custom menu items here.
//
// EXAMPLE:
// {
//     as: 'a',
//     label: localize('Your Page'),
//     LeftComponent: YourIcon,
//     href: '/your-page',
// },
```

**How to Add Mobile Menu Items:**

1. Edit `src/components/layout/header/mobile-menu/use-mobile-menu-config.tsx`
2. Find the `CUSTOM MENU ITEMS PLACEHOLDER` section
3. Add items before the theme toggle:

```typescript
return [
    [
        // Your custom menu items
        {
            as: 'a',
            label: localize('Analytics'),
            LeftComponent: ChartIcon,
            href: '/analytics',
        },
        {
            as: 'a',
            label: localize('Settings'),
            LeftComponent: SettingsIcon,
            href: '/settings',
        },

        // Theme toggle (conditionally included)
        enableThemeToggle && {
            as: 'button',
            label: localize('Dark theme'),
            LeftComponent: LegacyTheme1pxIcon,
            RightComponent: <ToggleSwitch value={is_dark_mode_on} onChange={toggleTheme} />,
        },
    ].filter(Boolean) as TMenuConfig,
    // ... rest of config
];
```

#### Mobile Menu Auto-Hide Behavior

The mobile menu (hamburger icon) **automatically hides** when there are no items to display.

**Mobile Menu is HIDDEN when ALL of these are true:**

- ❌ No custom menu items added
- ❌ Theme toggle disabled (`enable_theme_toggle: false` in brand.config.json)
- ❌ User not logged in (no logout button)

**Mobile Menu is VISIBLE when ANY of these are true:**

- ✅ Custom menu items exist
- ✅ Theme toggle enabled (`enable_theme_toggle: true`)
- ✅ User is logged in (logout button available)

**Example Scenarios:**

| Custom Items | Theme Toggle | User Logged In | Mobile Menu Visible?    |
| ------------ | ------------ | -------------- | ----------------------- |
| No           | Yes          | No             | ✅ Yes (theme toggle)   |
| No           | No           | No             | ❌ No (nothing to show) |
| No           | No           | Yes            | ✅ Yes (logout button)  |
| Yes          | No           | No             | ✅ Yes (custom items)   |
| Yes          | Yes          | Yes            | ✅ Yes (all features)   |

**Implementation Details:**

The auto-hide logic is implemented in:

- `src/components/layout/header/mobile-menu/use-mobile-menu-config.tsx` - Returns `hasMenuItems` flag
- `src/components/layout/header/mobile-menu/mobile-menu.tsx` - Checks flag and returns `null` if empty

This ensures users don't see an empty or useless menu icon, improving the overall user experience.

---

### Hostname Configuration

Configure environment-specific hostnames for proper routing.

#### Fields

| Field                     | Type     | Required | Description         |
| ------------------------- | -------- | -------- | ------------------- |
| `hostname.production.com` | `string` | ✅ Yes   | Production hostname |
| `hostname.staging.com`    | `string` | ✅ Yes   | Staging hostname    |

#### Example

```json
{
    "platform": {
        "hostname": {
            "production": {
                "com": "bot.tradepro.com"
            },
            "staging": {
                "com": "staging-bot.tradepro.com"
            }
        }
    }
}
```

#### Usage

- Used for environment detection
- Determines which API endpoints to use
- Affects OAuth redirect URLs
- Important for CORS configuration

---

### Authentication Configuration

OAuth 2.0 authentication endpoints.

#### Fields

| Field                  | Type     | Required | Description          |
| ---------------------- | -------- | -------- | -------------------- |
| `auth2_url.production` | `string` | ✅ Yes   | Production OAuth URL |
| `auth2_url.staging`    | `string` | ✅ Yes   | Staging OAuth URL    |

#### Example

```json
{
    "platform": {
        "auth2_url": {
            "production": "https://auth.tradepro.com/oauth2/",
            "staging": "https://staging-auth.tradepro.com/oauth2/"
        }
    }
}
```

#### OAuth Flow

1. User clicks "Log in"
2. App generates OAuth URL with PKCE parameters
3. Redirects to `auth2_url` endpoint
4. User authenticates on OAuth provider
5. Redirects back with authorization code
6. App exchanges code for access token

**See Also**: [AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md) for complete OAuth implementation details

---

### WebSocket Configuration

Configure DerivWS API endpoints for trading operations.

#### Fields

```json
{
    "derivws": {
        "url": {
            "staging": "string",
            "production": "string"
        },
        "directories": {
            "options": "string",
            "derivatives": "string"
        }
    }
}
```

| Field                     | Type     | Required | Description                       |
| ------------------------- | -------- | -------- | --------------------------------- |
| `url.production`          | `string` | ✅ Yes   | Production WebSocket API base URL |
| `url.staging`             | `string` | ✅ Yes   | Staging WebSocket API base URL    |
| `directories.options`     | `string` | ✅ Yes   | Options trading endpoint path     |
| `directories.derivatives` | `string` | ✅ Yes   | Derivatives trading endpoint path |

#### Example

```json
{
    "platform": {
        "derivws": {
            "url": {
                "staging": "https://staging-api.derivws.com/trading/v1/",
                "production": "https://api.derivws.com/trading/v1/"
            },
            "directories": {
                "options": "options/",
                "derivatives": "derivatives/"
            }
        }
    }
}
```

#### WebSocket Endpoints

The platform constructs WebSocket URLs by combining:

- Base URL from `url.staging` or `url.production`
- Directory from `directories.options` or `directories.derivatives`
- Trading parameters and authentication tokens

**Example Constructed URL:**

```
https://api.derivws.com/trading/v1/options/
```

**See Also**: [WEBSOCKET_CONNECTION_FLOW.md](./WEBSOCKET_CONNECTION_FLOW.md) for WebSocket implementation details

---

## Menu Customization

Complete guide to adding custom navigation items.

### Desktop Header Menu

**File**: `src/components/layout/header/header-config.tsx`

#### MenuItemsConfig Interface

```typescript
type MenuItemsConfig = {
    as: 'a' | 'button'; // Element type
    href: string; // URL (required if as='a')
    icon: ReactNode; // Icon component
    label: string; // Display text
};
```

#### Example Implementation

```typescript
import { localize } from '@deriv-com/translations';
import {
    LegacyAnalytics1pxIcon,
    LegacySettings1pxIcon,
    LegacyHelpCentre1pxIcon
} from '@deriv/quill-icons/Legacy';

export const MenuItems: MenuItemsConfig[] = [
    {
        as: 'a',
        href: '/analytics',
        icon: <LegacyAnalytics1pxIcon />,
        label: localize('Analytics'),
    },
    {
        as: 'a',
        href: '/settings',
        icon: <LegacySettings1pxIcon />,
        label: localize('Settings'),
    },
    {
        as: 'a',
        href: '/help',
        icon: <LegacyHelpCentre1pxIcon />,
        label: localize('Help Center'),
    },
];
```

### Mobile Menu

**File**: `src/components/layout/header/mobile-menu/use-mobile-menu-config.tsx`

#### Mobile Menu Item Interface

```typescript
type TMenuConfig = {
    LeftComponent: React.ElementType; // Icon component
    RightComponent?: ReactNode; // Optional right side content
    as: 'a' | 'button'; // Element type
    href?: string; // URL (required if as='a')
    label: ReactNode; // Display text
    onClick?: () => void; // Click handler (for buttons)
    removeBorderBottom?: boolean; // Remove bottom border
    submenu?: TSubmenuSection; // Submenu identifier
    target?: ComponentProps<'a'>['target']; // Link target (_blank, etc.)
    isActive?: boolean; // Active state styling
}[];
```

#### Example Implementation

```typescript
const menuConfig = useMemo((): TMenuConfig[] => {
    return [
        [
            // Custom menu items section
            {
                as: 'a',
                label: localize('Analytics'),
                LeftComponent: LegacyAnalytics1pxIcon,
                href: '/analytics',
            },
            {
                as: 'a',
                label: localize('Settings'),
                LeftComponent: LegacySettings1pxIcon,
                href: '/settings',
            },
            {
                as: 'a',
                label: localize('Help Center'),
                LeftComponent: LegacyHelpCentre1pxIcon,
                href: 'https://help.tradepro.com',
                target: '_blank',
            },

            // Theme toggle (conditionally included)
            enableThemeToggle && {
                as: 'button',
                label: localize('Dark theme'),
                LeftComponent: LegacyTheme1pxIcon,
                RightComponent: <ToggleSwitch value={is_dark_mode_on} onChange={toggleTheme} />,
            },
        ].filter(Boolean) as TMenuConfig,

        // Logout section
        [
            client?.is_logged_in && onLogout && {
                as: 'button',
                label: localize('Log out'),
                LeftComponent: LegacyLogout1pxIcon,
                onClick: onLogout,
                removeBorderBottom: true,
            },
        ].filter(Boolean) as TMenuConfig,
    ].filter(section => section.length > 0);
}, [client, onLogout, is_dark_mode_on, toggleTheme, localize, enableThemeToggle]);
```

### Menu Item Best Practices

1. **Use Localization**: Always wrap text in `localize()` for multi-language support
2. **Icon Consistency**: Use icons from `@deriv/quill-icons` for consistent styling
3. **Logical Grouping**: Group related items in mobile menu sections
4. **Conditional Rendering**: Use `&&` operator for optional items based on user state
5. **Accessibility**: Provide meaningful labels and use semantic HTML (`<a>` for links, `<button>` for actions)
6. **External Links**: Use `target: '_blank'` for external URLs and consider adding `rel="noopener noreferrer"`

---

## Examples

### Example 1: Financial Tech Brand

```json
{
    "brand_name": "FinTech Pro",
    "brand_domain": "fintechpro.com",
    "domain_name": "FinTechPro.com",
    "colors": {
        "primary": "#0066cc",
        "secondary": "#333333",
        "tertiary": "#00cc99",
        "success": "#00cc66",
        "danger": "#cc0000",
        "warning": "#ff9900",
        "info": "#0099cc",
        "neutral": "#666666",
        "black": "#000000",
        "white": "#ffffff",
        "grey": {
            "50": "#f7f7f7",
            "100": "#e8e8e8",
            "200": "#d1d1d1",
            "300": "#b3b3b3",
            "400": "#8c8c8c",
            "500": "#666666",
            "600": "#4d4d4d",
            "700": "#333333",
            "800": "#1a1a1a",
            "900": "#000000"
        }
    },
    "typography": {
        "font_family": {
            "primary": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }
    },
    "platform": {
        "name": "FinTech Pro Trading",
        "logo": {
            "type": "component",
            "component_name": "BrandLogo",
            "alt_text": "FinTech Pro",
            "link_url": "/"
        },
        "footer": {
            "enable_language_settings": true,
            "enable_theme_toggle": true
        }
    }
}
```

### Example 2: Dark Premium Theme

```json
{
    "brand_name": "EliteTrader",
    "brand_domain": "elitetrader.io",
    "domain_name": "EliteTrader.io",
    "colors": {
        "primary": "#9333ea",
        "secondary": "#1e1b4b",
        "tertiary": "#ec4899",
        "success": "#10b981",
        "danger": "#ef4444",
        "warning": "#f59e0b",
        "info": "#3b82f6",
        "neutral": "#6b7280",
        "black": "#0f0f23",
        "white": "#ffffff",
        "grey": {
            "50": "#f9fafb",
            "100": "#f3f4f6",
            "200": "#e5e7eb",
            "300": "#d1d5db",
            "400": "#9ca3af",
            "500": "#6b7280",
            "600": "#4b5563",
            "700": "#374151",
            "800": "#1f2937",
            "900": "#111827"
        }
    },
    "typography": {
        "font_family": {
            "primary": "'Poppins', -apple-system, sans-serif",
            "monospace": "'Fira Code', monospace"
        }
    },
    "platform": {
        "name": "EliteTrader",
        "logo": {
            "type": "component",
            "component_name": "BrandLogo",
            "alt_text": "EliteTrader",
            "link_url": "/"
        },
        "footer": {
            "enable_language_settings": false,
            "enable_theme_toggle": true
        }
    }
}
```

### Example 3: Minimal Setup (Single Language, No Theme Toggle)

```json
{
    "brand_name": "SimpleTrade",
    "brand_domain": "simpletrade.com",
    "domain_name": "SimpleTrade.com",
    "colors": {
        "primary": "#2563eb",
        "secondary": "#64748b",
        "tertiary": "#8b5cf6",
        "success": "#10b981",
        "danger": "#ef4444",
        "warning": "#f59e0b",
        "info": "#0ea5e9",
        "neutral": "#6b7280",
        "black": "#0f172a",
        "white": "#ffffff",
        "grey": {
            "50": "#f8fafc",
            "100": "#f1f5f9",
            "200": "#e2e8f0",
            "300": "#cbd5e1",
            "400": "#94a3b8",
            "500": "#64748b",
            "600": "#475569",
            "700": "#334155",
            "800": "#1e293b",
            "900": "#0f172a"
        }
    },
    "typography": {
        "font_family": {
            "primary": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }
    },
    "platform": {
        "name": "SimpleTrade",
        "logo": {
            "type": "image",
            "image_url": "/images/logo.svg",
            "alt_text": "SimpleTrade",
            "link_url": "/"
        },
        "footer": {
            "enable_language_settings": false,
            "enable_theme_toggle": false
        }
    }
}
```

> **Note**: With both footer settings disabled and no custom menu items, the mobile menu will be automatically hidden.

---

## Applying Configuration Changes

After editing `brand.config.json`, you must regenerate CSS variables:

```bash
npm run generate:brand-css
```

This command:

- ✅ Validates your color configuration
- ✅ Generates CSS custom properties
- ✅ Updates `src/styles/_themes.scss`
- ✅ Maintains backward compatibility

Then restart your development server:

```bash
npm start
```

---

## Validation

### Color Format Validation

The CSS generator validates:

- Hexadecimal format (`#RRGGBB`)
- Complete grey scale (50-900)
- Required color fields

### Configuration Validation

Check your configuration:

```bash
node scripts/validate-brand-config.js
```

---

## Related Documentation

- [WHITE_LABELING_GUIDE.md](./WHITE_LABELING_GUIDE.md) - Overall white-labeling process and best practices
- [LOGO_CUSTOMIZATION_QUICK_START.md](./LOGO_CUSTOMIZATION_QUICK_START.md) - Logo implementation details
- [AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md) - OAuth authentication setup
- [WEBSOCKET_CONNECTION_FLOW.md](./WEBSOCKET_CONNECTION_FLOW.md) - WebSocket API integration
- [ERROR_LOGGING_GUIDE.md](./ERROR_LOGGING_GUIDE.md) - Error handling and logging

---

## Support

For questions or issues with brand configuration:

1. **Validate Configuration**: Run `npm run generate:brand-css` to check for errors
2. **Check Documentation**: Review this guide and related docs
3. **Review Examples**: See example configurations above
4. **Check Console**: Browser console may show configuration warnings

**Common Issues**: See [WHITE_LABELING_GUIDE.md - Troubleshooting](./WHITE_LABELING_GUIDE.md#troubleshooting)
