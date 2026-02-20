# White Labeling Guide

Complete guide for customizing the Trading Bot platform with your own branding, from colors and typography to logos and navigation menus.

## Table of Contents

- [Overview](#overview)
- [Quick Start (5 Steps)](#quick-start-5-steps)
- [Brand Configuration Reference](#brand-configuration-reference)
  - [Brand Identity](#brand-identity)
  - [Color System](#color-system)
  - [Typography](#typography)
  - [Color Variants](#color-variants)
  - [Theme Configuration](#theme-configuration)
- [Platform Configuration](#platform-configuration)
  - [Logo](#logo)
  - [Footer](#footer)
  - [Menu Customization](#menu-customization)
  - [Hostname](#hostname)
  - [Authentication URLs](#authentication-urls)
  - [WebSocket URLs](#websocket-urls)
- [Logo Customization](#logo-customization)
- [Best Practices](#best-practices)
- [Testing Your Branding](#testing-your-branding)
- [Troubleshooting](#troubleshooting)
- [Complete Examples](#complete-examples)

---

## Overview

The platform is designed for complete white-labeling through a centralized configuration system. You can customize:

- **Visual Identity** - Colors, typography, logos
- **Platform Settings** - Name, domain, hostnames
- **UI Components** - Menu items, footer elements, theme behavior

> **Important:** The `auth2_url` and `derivws` sections in `brand.config.json` must remain pointed at Deriv's servers. The platform depends on Deriv's OAuth and WebSocket API infrastructure for authentication and trading. See [Authentication URLs](#authentication-urls) and [WebSocket URLs](#websocket-urls) for details.

### Key Files

| File                             | Purpose                          |
| -------------------------------- | -------------------------------- |
| `brand.config.json`              | Central branding configuration   |
| `src/components/layout/app-logo/BrandLogo.tsx` | Logo component          |
| `src/components/layout/header/header-config.tsx` | Desktop menu items    |
| `src/components/layout/header/mobile-menu/use-mobile-menu-config.tsx` | Mobile menu items |
| `src/styles/_themes.scss`        | Auto-generated CSS variables     |
| `scripts/generate-brand-css.js`  | CSS generator script             |

---

## Quick Start (5 Steps)

### Step 1: Update Brand Configuration

Edit `brand.config.json` in the project root:

```json
{
    "brand_name": "YourBrand",
    "brand_domain": "yourbrand.com",
    "domain_name": "YourBrand.com",
    "colors": {
        "primary": "#your-primary-color",
        "secondary": "#your-secondary-color",
        "tertiary": "#your-accent-color",
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
            "primary": "Your Font Stack"
        }
    },
    "platform": {
        "name": "Your Trading Platform",
        "logo": {
            "type": "component",
            "component_name": "BrandLogo",
            "alt_text": "Your Brand"
        },
        "footer": {
            "enable_language_settings": false,
            "enable_theme_toggle": true
        }
    }
}
```

> **Note:** `enable_language_settings` is set to `false` by default. The translation system (`@deriv-com/translations`) is optional and only works when connected to a Crowdin project with translation files served via CDN. See the [Footer](#footer) section for details.

### Step 2: Customize Your Logo

Edit `src/components/layout/app-logo/BrandLogo.tsx`:

```tsx
export const BrandLogo = ({ width = 120, height = 32, fill = 'currentColor' }) => {
    return (
        <svg width={width} height={height} viewBox='0 0 120 32' fill='none'>
            {/* Replace with your brand's SVG paths */}
            <path d='YOUR_SVG_PATH_DATA' fill={fill} />
        </svg>
    );
};
```

### Step 3: Generate CSS Variables

```bash
npm run generate:brand-css
```

This validates your colors, generates CSS custom properties in `_themes.scss`, and creates light/dark theme variants.

### Step 4: Add Custom Menu Items (Optional)

- **Desktop:** Edit `src/components/layout/header/header-config.tsx`
- **Mobile:** Edit `src/components/layout/header/mobile-menu/use-mobile-menu-config.tsx`

### Step 5: Start and Verify

```bash
npm start
```

Visit `https://localhost:8443` to see your branded platform.

---

## Brand Configuration Reference

The `brand.config.json` file is the central configuration for all branding. Below is the complete reference for every section.

### Full Configuration Structure

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

### Brand Identity

| Field            | Type     | Required | Description                                    |
| ---------------- | -------- | -------- | ---------------------------------------------- |
| `brand_name`     | `string` | Yes      | Short brand name (e.g., `"TradePro"`)          |
| `brand_domain`   | `string` | Yes      | Primary domain without protocol (e.g., `"tradepro.com"`) |
| `domain_name`    | `string` | Yes      | Display domain with capitalization (e.g., `"TradePro.com"`) |
| `brand_hostname` | `object` | Yes      | Environment-specific hostnames                 |

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

**Where used:**
- `brand_name` - Page titles, meta tags, analytics
- `brand_domain` - Base domain for API calls and authentication
- `domain_name` - Displayed in UI (footer, about sections)
- `brand_hostname` - Environment detection and routing

---

### Color System

All colors must be in hexadecimal format (`#RRGGBB`). Lowercase preferred.

#### Primary Colors

| Field       | Required | Usage                               |
| ----------- | -------- | ----------------------------------- |
| `primary`   | Yes      | Main brand color - buttons, links, CTAs |
| `secondary` | Yes      | Secondary UI - borders, subtle elements |
| `tertiary`  | No       | Accent color - highlights, badges   |

#### Semantic Colors

| Field     | Required | Usage                               |
| --------- | -------- | ----------------------------------- |
| `success` | Yes      | Profit indicators, success messages |
| `danger`  | Yes      | Loss indicators, error messages     |
| `warning` | Yes      | Warning alerts, cautions            |
| `info`    | Yes      | Informational tooltips, messages    |

#### Neutral Colors

| Field     | Required | Usage                               |
| --------- | -------- | ----------------------------------- |
| `neutral` | Yes      | Disabled states, placeholders       |
| `black`   | Yes      | Text, dark backgrounds              |
| `white`   | Yes      | Light backgrounds, inverted text    |

#### Grey Scale (All Required)

A complete 9-shade scale from `50` (lightest) to `900` (darkest):

```json
{
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
```

#### Generated CSS Variables

Running `npm run generate:brand-css` produces:

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
/* ... through grey-900 */
```

#### Color Format Requirements

- **Format:** Hexadecimal only (`#RRGGBB` or `#RGB`)
- **Case:** Lowercase preferred (`#3b82f6` not `#3B82F6`)
- **Length:** 6-digit hex recommended (`#3b82f6` not `#38f`)
- **Validation:** Run `npm run generate:brand-css` to validate

---

### Typography

| Field                   | Type     | Required | Usage                     |
| ----------------------- | -------- | -------- | ------------------------- |
| `font_family.primary`   | `string` | Yes      | Body text, UI elements    |
| `font_family.secondary` | `string` | No       | Headings, special text    |
| `font_family.monospace` | `string` | No       | Code blocks, numeric data |

#### Font Size Scale (Optional)

| Field            | Default   |
| ---------------- | --------- |
| `font_sizes.xs`  | `0.75rem` |
| `font_sizes.sm`  | `0.875rem`|
| `font_sizes.base`| `1rem`    |
| `font_sizes.lg`  | `1.125rem`|
| `font_sizes.xl`  | `1.25rem` |
| `font_sizes.2xl` | `1.5rem`  |
| `font_sizes.3xl` | `1.875rem`|
| `font_sizes.4xl` | `2.25rem` |

#### Font Loading Options

**Option A: System Fonts (Recommended)**

Best performance - no external requests, zero latency, no licensing concerns:

```json
{
    "font_family": {
        "primary": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    }
}
```

**Option B: Google Fonts**

Add the import to `public/index.html`:

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

**Option C: Self-Hosted Fonts**

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

#### How Font Integration Works

```
brand.config.json  →  npm run generate:brand-css  →  _themes.scss
    (font_family.primary)         (generates)       (--brand-font-primary)
                                                          ↓
                                              index.scss & _fonts.scss
                                              (var(--brand-font-primary))
                                                          ↓
                                                Applied to entire app
```

---

### Color Variants

Controls automatic color variant generation for light/dark themes:

```json
{
    "color_variants": {
        "light_variants": [100, 200, 300, 400, 500],
        "dark_variants": [600, 700, 800, 900],
        "opacity_variants": [10, 20, 30, 40, 50, 60, 70, 80, 90]
    }
}
```

| Field              | Description                                   |
| ------------------ | --------------------------------------------- |
| `light_variants`   | Grey shades used in light mode                |
| `dark_variants`    | Grey shades used in dark mode                 |
| `opacity_variants` | Percentages for transparent color versions    |

---

### Theme Configuration

```json
{
    "theme_config": {
        "enable_dynamic_themes": true,
        "auto_generate_variants": true,
        "css_variable_prefix": "--brand"
    }
}
```

| Field                    | Default     | Description                                |
| ------------------------ | ----------- | ------------------------------------------ |
| `enable_dynamic_themes`  | `true`      | Enable light/dark theme switching          |
| `auto_generate_variants` | `true`      | Auto-generate color shades from base colors|
| `css_variable_prefix`    | `"--brand"` | Prefix for all generated CSS variables     |

---

## Platform Configuration

### Logo

Two approaches for displaying your brand logo:

#### Option 1: React Component (Recommended)

Full control over rendering, supports theme-aware colors:

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

Implementation in `src/components/layout/app-logo/BrandLogo.tsx`:

```tsx
export const BrandLogo = ({ width = 120, height = 32, fill = 'currentColor' }) => (
    <svg width={width} height={height} viewBox='0 0 120 32' fill='none'>
        <path fill={fill} d='M...' />
    </svg>
);
```

Export in `src/components/layout/app-logo/index.tsx`:

```tsx
export { BrandLogo } from './BrandLogo';
```

#### Option 2: Image File

Simpler setup for existing image assets:

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

Place the image in the `public/images/` directory.

#### Logo Configuration Fields

| Field            | Type      | Required       | Description                         |
| ---------------- | --------- | -------------- | ----------------------------------- |
| `type`           | `string`  | Yes            | `"component"` or `"image"`          |
| `component_name` | `string`  | If component   | React component name to render      |
| `image_url`      | `string`  | If image       | Path relative to `public/`          |
| `alt_text`       | `string`  | Yes            | Accessibility text for screen readers |
| `link_url`       | `string`  | Yes            | Click destination (usually `"/"`)   |
| `show_text`      | `boolean` | No             | Show text alongside logo            |
| `text`           | `string`  | If show_text   | Text to display next to logo        |

---

### Footer

Control footer and mobile menu element visibility:

```json
{
    "platform": {
        "footer": {
            "enable_language_settings": false,
            "enable_theme_toggle": true
        }
    }
}
```

| Setting                    | Default | Effect                                        |
| -------------------------- | ------- | --------------------------------------------- |
| `enable_language_settings` | `true`  | Shows/hides language selector in footer + mobile menu |
| `enable_theme_toggle`      | `true`  | Shows/hides theme toggle in footer + mobile menu |

> **Important — Translations are optional.** The app is wrapped with `@deriv-com/translations` `TranslationProvider`, but multi-language support **only works** when you have a complete translation workflow configured with [Crowdin](https://crowdin.com/) and a CDN serving the translation files (`TRANSLATIONS_CDN_URL` environment variable). Without this setup, the app defaults to English and functions normally.
>
> **If you are not using translations**, set `enable_language_settings` to `false` — otherwise users will see a language selector that does not work. Only set it to `true` once you have configured Crowdin, generated translation files, and set the `TRANSLATIONS_CDN_URL`, `R2_PROJECT_NAME`, and `CROWDIN_BRANCH_NAME` environment variables.

#### Common Configurations

| Scenario                        | `language_settings` | `theme_toggle` | Result                    |
| ------------------------------- | ------------------- | -------------- | ------------------------- |
| No translations (recommended default) | `false`       | `true`         | Only theme toggle         |
| Full features (translations configured) | `true`      | `true`         | Both visible              |
| Locked theme, with translations | `true`              | `false`        | Only language selector    |
| Minimal UI                      | `false`             | `false`        | Clean footer, no toggles  |

---

### Menu Customization

#### Desktop Menu

**File:** `src/components/layout/header/header-config.tsx`

The file contains an empty `MenuItems` array with placeholder comments. Add items:

```typescript
import { localize } from '@deriv-com/translations';
import { LegacyAnalytics1pxIcon, LegacySettings1pxIcon } from '@deriv/quill-icons/Legacy';

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
];
```

#### Mobile Menu

**File:** `src/components/layout/header/mobile-menu/use-mobile-menu-config.tsx`

Find the `CUSTOM MENU ITEMS PLACEHOLDER` section and add items:

```typescript
return [
    [
        // Your custom items
        {
            as: 'a',
            label: localize('Analytics'),
            LeftComponent: LegacyAnalytics1pxIcon,
            href: '/analytics',
        },
        // Theme toggle (conditionally included)
        enableThemeToggle && {
            as: 'button',
            label: localize('Dark theme'),
            LeftComponent: LegacyTheme1pxIcon,
            RightComponent: <ToggleSwitch value={is_dark_mode_on} onChange={toggleTheme} />,
        },
    ].filter(Boolean) as TMenuConfig,
    // Logout section (auto-managed)
];
```

#### Mobile Menu Auto-Hide Behavior

The hamburger menu icon automatically hides when there are no items to display:

| Custom Items | Theme Toggle | Logged In | Menu Visible?           |
| ------------ | ------------ | --------- | ----------------------- |
| No           | Yes          | No        | Yes (theme toggle)      |
| No           | No           | No        | **No** (nothing to show)|
| No           | No           | Yes       | Yes (logout button)     |
| Yes          | No           | No        | Yes (custom items)      |
| Yes          | Yes          | Yes       | Yes (all features)      |

---

### Hostname

Environment-specific hostnames for routing and environment detection:

```json
{
    "platform": {
        "hostname": {
            "production": { "com": "bot.tradepro.com" },
            "staging": { "com": "staging-bot.tradepro.com" }
        }
    }
}
```

Used for environment detection, API endpoint selection, OAuth redirect URLs, and CORS configuration.

---

### Authentication URLs

OAuth 2.0 endpoints used for user authentication.

> **Do not change these values.** The `auth2_url` must point to Deriv's OAuth servers to support authentication. The platform relies on Deriv's OAuth infrastructure for user login, token exchange, and session management. Changing these URLs will break the login flow.

```json
{
    "platform": {
        "auth2_url": {
            "production": "https://auth.deriv.com/oauth2/",
            "staging": "https://staging-auth.deriv.com/oauth2/"
        }
    }
}
```

> See [Authentication Guide](./04-authentication.md) for the complete OAuth implementation.

---

### WebSocket URLs

DerivWS API endpoints for trading operations.

> **Do not change these values.** The `derivws` URLs must point to Deriv's WebSocket API servers. The platform depends on the DerivWS API for real-time market data, trade execution, account management, and balance updates. Changing these URLs will break all trading functionality.

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

> See [WebSocket Integration Guide](./05-websocket-integration.md) for connection flow details.

---

## Logo Customization

### Method A: Edit SVG Component (Recommended)

1. Open `src/components/layout/app-logo/BrandLogo.tsx`
2. Replace the SVG content with your logo:

```tsx
export const BrandLogo = ({ width = 120, height = 32, fill = 'currentColor' }) => {
    return (
        <svg width={width} height={height} viewBox='0 0 120 32' fill='none'>
            {/* Paste your SVG paths here */}
            <path d='M10 5 L20 25 L30 5' fill={fill} />
        </svg>
    );
};
```

### Method B: Use an Image File

1. Place your logo in `public/images/logo.svg`
2. Update `BrandLogo.tsx`:

```tsx
export const BrandLogo = ({ width = 120, height = 32 }) => {
    return <img src='/images/logo.svg' alt='Logo' width={width} height={height} />;
};
```

3. Update `brand.config.json`:

```json
{
    "platform": {
        "logo": {
            "type": "image",
            "image_url": "/images/logo.svg",
            "alt_text": "Your Brand"
        }
    }
}
```

### Logo Specifications

| Spec          | Recommendation                         |
| ------------- | -------------------------------------- |
| **Format**    | SVG (preferred) or PNG                 |
| **Size**      | ~120x32px (width x height)             |
| **Retina**    | 2x for PNG (240x64px)                  |
| **Color**     | Use `currentColor` for theme support   |
| **File Size** | < 50KB optimized                       |

### Exporting from Design Tools

**Figma:** Select logo frame > Right-click > Copy/Paste as > Copy as SVG

**Adobe Illustrator:** File > Export > Export As > SVG > Inline Style, Minify

**Sketch:** Select artboard > Export > SVG > Open in text editor > Copy `<svg>` content

---

## Best Practices

### Color Accessibility

Ensure your colors meet WCAG 2.1 standards:

| Element          | Minimum Contrast Ratio |
| ---------------- | ---------------------- |
| Normal text      | 4.5:1                  |
| Large text (18px+) | 3:1                  |
| UI components    | 3:1                    |

Test with:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools > Lighthouse > Accessibility audit

### Font Selection

- **System fonts** give the best performance (zero latency, no licensing)
- If using custom fonts, limit to 4 weights max (400, 500, 600, 700)
- Use `font-display: swap` to prevent layout shift
- Always include system font fallbacks in your font stack

### Branding Consistency

- Use `primary` for main CTAs, links, and active states
- Use `secondary` for secondary actions and borders
- Use semantic colors consistently (`success` = profit, `danger` = loss)
- Ensure your logo works in both light and dark themes
- Test logo at mobile and desktop sizes

### Performance

- Use SVG for logos and icons (scalable, small file size)
- Run `npm run generate:brand-css` only when changing brand config
- Remove unused colors from `brand.config.json` to reduce CSS
- Use system fonts to eliminate font loading time entirely

---

## Testing Your Branding

### Visual Testing Checklist

**Desktop:**
- [ ] Header with logo displays correctly
- [ ] Navigation menu items render
- [ ] Button colors (primary, secondary) are correct
- [ ] Form elements (inputs, dropdowns) use brand colors
- [ ] Success/error messages use semantic colors
- [ ] Dashboard cards and widgets styled correctly
- [ ] Footer shows configured elements (theme toggle; language selector only if translations configured)
- [ ] Theme toggle switches between light/dark correctly

**Mobile:**
- [ ] Logo in mobile header
- [ ] Hamburger menu appears (if items configured)
- [ ] Mobile menu items render correctly
- [ ] Theme toggle in mobile menu
- [ ] Responsive layout at various widths
- [ ] Touch targets are at least 44x44px

**Theme Testing:**
- [ ] Toggle between light and dark modes
- [ ] All colors adapt properly in both themes
- [ ] Logo is visible in both themes
- [ ] Text contrast meets WCAG standards in both themes

### Validation Commands

```bash
npm run generate:brand-css   # Validates colors, generates CSS
npm run test:lint            # Checks code quality
npm run build                # Ensures no build errors
```

### Browser Testing

Test in Chrome/Edge, Firefox, and Safari. Verify:
- Color rendering consistency
- Font loading and display
- Logo display at various sizes
- Responsive behavior
- Theme switching

---

## Troubleshooting

### Colors Not Updating

**Cause:** CSS variables not regenerated after config change.

**Fix:**
1. Run `npm run generate:brand-css`
2. Restart dev server: `npm start`
3. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

**Common causes:** Forgot to regenerate CSS, invalid hex format, typo in property name, browser cache.

### Fonts Not Loading

**For Google Fonts:** Verify the `<link>` import in `public/index.html` and that the font name in config matches exactly.

**For Self-Hosted Fonts:** Verify files are in `public/fonts/`, check the `@font-face` declaration in `src/styles/_fonts.scss`, and check the browser network tab for 404 errors.

### CSS Generation Script Fails

Validate JSON syntax:

```bash
node -e "JSON.parse(require('fs').readFileSync('brand.config.json', 'utf8'))"
```

Common JSON errors: missing commas, trailing commas, unquoted property names, comments (JSON doesn't support comments).

### Invalid Color Format

Only hexadecimal colors are supported:

```json
"primary": "#3b82f6"     // Correct
"primary": "rgb(59,130)" // Wrong
"primary": "blue"        // Wrong
"primary": "3b82f6"      // Wrong (missing #)
```

### Logo Not Displaying

1. Check the component export in `BrandLogo.tsx`
2. Verify the index export in `app-logo/index.tsx`
3. Confirm `component_name` in `brand.config.json` matches the exported component
4. Check the browser console for import errors

### Mobile Menu Not Showing

By design, the mobile menu hides when empty. It appears when:
- Custom menu items are added, OR
- Theme toggle is enabled (`enable_theme_toggle: true`), OR
- User is logged in (logout button available)

---

## Complete Examples

### Example 1: Professional Financial Platform

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
            "50": "#f7f7f7", "100": "#e8e8e8", "200": "#d1d1d1",
            "300": "#b3b3b3", "400": "#8c8c8c", "500": "#666666",
            "600": "#4d4d4d", "700": "#333333", "800": "#1a1a1a",
            "900": "#000000"
        }
    },
    "typography": {
        "font_family": {
            "primary": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            "monospace": "'Fira Code', monospace"
        }
    },
    "platform": {
        "name": "FinTech Pro Trading",
        "logo": { "type": "component", "component_name": "BrandLogo", "alt_text": "FinTech Pro", "link_url": "/" },
        "footer": { "enable_language_settings": false, "enable_theme_toggle": true }
    }
}
```

> Set `enable_language_settings` to `true` only if you have configured a Crowdin translation workflow.

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
            "50": "#f9fafb", "100": "#f3f4f6", "200": "#e5e7eb",
            "300": "#d1d5db", "400": "#9ca3af", "500": "#6b7280",
            "600": "#4b5563", "700": "#374151", "800": "#1f2937",
            "900": "#111827"
        }
    },
    "typography": {
        "font_family": {
            "primary": "'Poppins', -apple-system, sans-serif",
            "monospace": "'JetBrains Mono', monospace"
        }
    },
    "platform": {
        "name": "EliteTrader",
        "logo": { "type": "component", "component_name": "BrandLogo", "alt_text": "EliteTrader", "link_url": "/" },
        "footer": { "enable_language_settings": false, "enable_theme_toggle": true }
    }
}
```

### Example 3: Minimal Setup

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
            "50": "#f8fafc", "100": "#f1f5f9", "200": "#e2e8f0",
            "300": "#cbd5e1", "400": "#94a3b8", "500": "#64748b",
            "600": "#475569", "700": "#334155", "800": "#1e293b",
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
        "logo": { "type": "image", "image_url": "/images/logo.svg", "alt_text": "SimpleTrade", "link_url": "/" },
        "footer": { "enable_language_settings": false, "enable_theme_toggle": false }
    }
}
```

System fonts, image-based logo, both footer options disabled. Mobile menu auto-hides when user is not logged in. Fastest loading performance.

---

## Pre-Launch Checklist

Before deploying your white-labeled platform:

- [ ] Updated `brand.config.json` with all brand details
- [ ] Customized logo in `BrandLogo.tsx`
- [ ] Generated CSS variables (`npm run generate:brand-css`)
- [ ] Added custom menu items (if needed)
- [ ] Configured footer settings (`enable_language_settings: false` if not using translations)
- [ ] If using translations: configured Crowdin, set `TRANSLATIONS_CDN_URL`, `R2_PROJECT_NAME`, `CROWDIN_BRANCH_NAME`
- [ ] Tested in light and dark themes
- [ ] Verified color contrast meets accessibility standards (4.5:1)
- [ ] Tested on mobile devices
- [ ] Tested in Chrome, Firefox, and Safari
- [ ] Validated keyboard navigation and screen reader support
- [ ] Verified `auth2_url` and `derivws` point to Deriv servers (do not change these)
- [ ] Tested end-to-end user flows (login, trade, logout)
- [ ] Created production build (`npm run build`)
- [ ] Deployed to staging environment for final QA
