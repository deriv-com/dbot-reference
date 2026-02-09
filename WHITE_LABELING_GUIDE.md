# White Labeling Guide

This guide explains how to customize the Trading Bot platform with your own branding.

## Overview

The platform uses a centralized `brand.config.json` file for all branding configurations. This allows you to easily customize:

- Brand colors (primary, secondary, accent colors)
- Typography (font families)
- Platform metadata (name, domain, logo)
- API endpoints and authentication URLs

## Quick Start

### 1. Update Brand Configuration

Edit the [`brand.config.json`](brand.config.json) file in the project root:

```json
{
  "brand_name": "YourBrand",
  "brand_domain": "yourbrand.com",
  "colors": {
    "primary": "#your-color",
    "secondary": "#your-color",
    // ... more colors
  },
  "typography": {
    "font_family": {
      "primary": "Your Font Family",
      // ... more fonts
    }
  }
}
```

### 2. Generate CSS Variables

Run the brand CSS generator to update your styles:

```bash
npm run generate:brand-css
```

This automatically:
- ✅ Updates CSS custom properties in `_themes.scss`
- ✅ Validates your color configuration
- ✅ Generates typography variables
- ✅ Maintains backward compatibility

### 3. Restart Development Server

```bash
npm start
```

Your new branding will be applied throughout the application!

---

## Brand Configuration Reference

### Colors

The color system uses a predefined palette structure:

```json
{
  "colors": {
    "primary": "#3b82f6",      // Main brand color (buttons, links, highlights)
    "secondary": "#64748b",    // Secondary UI elements
    "tertiary": "#8b5cf6",     // Accent color
    "success": "#10b981",      // Success states (green)
    "danger": "#ef4444",       // Error states (red)
    "warning": "#f59e0b",      // Warning states (orange)
    "info": "#0ea5e9",         // Informational states (blue)
    "neutral": "#6b7280",      // Neutral UI elements
    "black": "#0f172a",        // Dark text/backgrounds
    "white": "#ffffff",        // Light text/backgrounds
    "grey": {                  // Grey scale palette
      "50": "#f8fafc",
      "100": "#f1f5f9",
      // ... more shades
    }
  }
}
```

**CSS Variables Generated:**
- `--brand-primary`
- `--brand-secondary`
- `--brand-tertiary`
- `--brand-success`
- `--brand-danger`
- `--brand-warning`
- `--brand-info`
- `--brand-neutral`
- `--brand-white`
- `--brand-dark-grey` (alias for black)

**Legacy Compatibility:**
- `--brand-red-coral` → maps to `primary`
- `--brand-orange` → maps to `tertiary`

### Typography

Configure font families for different text types:

```json
{
  "typography": {
    "font_family": {
      "primary": "Your Primary Font Stack",
      "secondary": "Your Secondary Font",
      "monospace": "Your Monospace Font"
    },
    "font_sizes": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      // ... more sizes
    }
  }
}
```

**CSS Variables Generated:**
- `--brand-font-primary` - Main UI font
- `--brand-font-secondary` - Headings or special text
- `--brand-font-monospace` - Code blocks, technical data

**Example Font Stacks:**

**System Fonts (Recommended):**
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
```

**Google Fonts:**
```
'Inter', -apple-system, BlinkMacSystemFont, sans-serif
```
*Note: Import the font in your HTML/CSS first*

**Custom Fonts:**
```
'Your Custom Font', 'Fallback Font', sans-serif
```

### Loading Custom Fonts

If you want to use custom fonts (like Google Fonts or self-hosted fonts):

#### Option 1: Google Fonts

Add the import to `src/styles/index.scss`:

```scss
@use 'components/shared/styles/themes' as *;

// Add your Google Font import
@import 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';

body {
    font-family: var(--brand-font-primary);
    background: var(--general-main-1);
}
```

Then update `brand.config.json`:

```json
{
  "typography": {
    "font_family": {
      "primary": "'Inter', -apple-system, sans-serif"
    }
  }
}
```

#### Option 2: Self-Hosted Fonts

1. Place font files in `public/fonts/`
2. Add `@font-face` in `src/styles/index.scss`:

```scss
@font-face {
    font-family: 'YourFont';
    src: url('/fonts/YourFont-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
}

@font-face {
    font-family: 'YourFont';
    src: url('/fonts/YourFont-Bold.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
}
```

3. Update `brand.config.json`:

```json
{
  "typography": {
    "font_family": {
      "primary": "'YourFont', -apple-system, sans-serif"
    }
  }
}
```

4. Run `npm run generate:brand-css`

#### Option 3: Keep System Fonts (Recommended)

The default system font stack provides:
- ✅ Zero latency (no font loading)
- ✅ Native look on each platform
- ✅ Excellent performance
- ✅ No licensing concerns

If branding allows it, system fonts are the best choice!

### Platform Configuration

Update platform-specific settings:

```json
{
  "platform": {
    "name": "Trading Bot",           // Display name
    "logo": "YourBrandLogo",         // Logo component name
    "hostname": {
      "production": { "com": "bot.yourbrand.com" },
      "staging": { "com": "staging-bot.yourbrand.com" }
    },
    "websocket_servers": {
      "staging": "staging-api.yourbrand.com/ws",
      "production": "api.yourbrand.com/ws"
    },
    "whoami_endpoint": {
      "staging": "https://staging-auth.yourbrand.com/sessions/whoami",
      "production": "https://auth.yourbrand.com/sessions/whoami"
    },
    "logout_endpoint": {
      "staging": "https://staging-auth.yourbrand.com/logout",
      "production": "https://auth.yourbrand.com/logout"
    },
    "auth_urls": {
      "production": {
        "login": "https://yourbrand.com/login",
        "signup": "https://yourbrand.com/signup"
      },
      "staging": { /* ... */ }
    }
  }
}
```

---

## Advanced Customization

### Custom Color Variants

The grey scale can be extended with custom shades:

```json
{
  "colors": {
    "grey": {
      "50": "#fafafa",   // Lightest
      "100": "#f5f5f5",
      "200": "#e5e5e5",
      "300": "#d4d4d4",
      "400": "#a3a3a3",
      "500": "#737373",  // Mid-tone
      "600": "#525252",
      "700": "#404040",
      "800": "#262626",
      "900": "#171717"   // Darkest
    }
  }
}
```

### Theme Configuration

Control theme generation behavior:

```json
{
  "theme_config": {
    "enable_dynamic_themes": true,
    "auto_generate_variants": true,
    "css_variable_prefix": "--brand"
  }
}
```

### Color Variants

Define how light/dark variants are generated:

```json
{
  "color_variants": {
    "light_variants": [100, 200, 300, 400, 500],
    "dark_variants": [600, 700, 800, 900],
    "opacity_variants": [10, 20, 30, 40, 50, 60, 70, 80, 90]
  }
}
```

---

## Best Practices

### 1. Color Accessibility

Ensure sufficient contrast ratios:
- **Normal text**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **UI components**: 3:1 minimum

Test with tools like:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible Colors](https://accessible-colors.com/)

### 2. Font Selection

Choose fonts that:
- ✅ Are web-safe or properly licensed
- ✅ Have good readability at small sizes
- ✅ Include necessary character sets (internationalization)
- ✅ Provide sufficient font weights (400, 500, 600, 700)

### 3. Branding Consistency

Maintain consistency with your existing brand:
- Use exact hex codes from your brand guidelines
- Match typography to your marketing materials
- Test across light and dark themes

### 4. Performance

Consider performance implications:
- System fonts load instantly
- Custom fonts add HTTP requests
- Limit font variants to reduce bundle size

---

## Testing Your Branding

### 1. Visual Testing

Check your branding across all pages:

```bash
npm start
```

Navigate to:
- `/` - Dashboard
- `/bot` - Bot Builder
- `/chart` - Trading Chart
- `/tutorials` - Tutorial Pages

### 2. Validate Configuration

The generator validates your configuration automatically:

```bash
npm run generate:brand-css
```

Look for:
- ✅ "Brand configuration is valid"
- ⚠️ Warnings about missing optional fields
- ❌ Errors about required fields

### 3. Browser Testing

Test in multiple browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Troubleshooting

### Colors Not Updating

**Problem**: New colors don't appear after running the script.

**Solutions**:
1. Clear browser cache (Cmd/Ctrl + Shift + R)
2. Restart the development server
3. Check browser DevTools → Elements → `:root` to verify CSS variables
4. Ensure `_themes.scss` was modified (check git diff)

### Fonts Not Loading

**Problem**: Custom fonts show fallback fonts instead.

**Solutions**:
1. Verify font files are in `public/fonts/` or linked via CDN
2. Add `@font-face` declarations in your CSS
3. Check browser Network tab for font loading errors
4. Ensure font format is supported (WOFF2 recommended)

### Script Fails to Run

**Problem**: `npm run generate:brand-css` throws errors.

**Solutions**:
1. Check JSON syntax in `brand.config.json` (use [JSONLint](https://jsonlint.com/))
2. Ensure all required color fields are present
3. Verify file permissions on `_themes.scss`
4. Check Node.js version (requires Node 20+)

### Invalid Color Format

**Problem**: Script accepts invalid hex codes.

**Solutions**:
- Use valid 6-digit hex codes: `#3b82f6` ✅
- Avoid 3-digit shorthand: `#38f` ❌ (expand to 6 digits)
- Always include `#` prefix: `3b82f6` ❌

---

## Migration from Existing Brand

If migrating from another branded version:

### 1. Extract Current Colors

Use browser DevTools to find current CSS variables:

```javascript
// Run in browser console
const root = document.querySelector(':root');
const styles = getComputedStyle(root);
console.log('Primary:', styles.getPropertyValue('--brand-primary'));
console.log('Secondary:', styles.getPropertyValue('--brand-secondary'));
```

### 2. Document Current Values

Create a backup of current branding:

```bash
cp brand.config.json brand.config.json.backup
```

### 3. Update Incrementally

Change one section at a time:
1. Colors first
2. Typography second
3. Platform configuration last

Test after each change.

---

## Examples

### Example 1: Blue Theme

```json
{
  "colors": {
    "primary": "#2563eb",
    "secondary": "#64748b",
    "tertiary": "#7c3aed"
  }
}
```

### Example 2: Green Finance Theme

```json
{
  "colors": {
    "primary": "#059669",
    "secondary": "#0891b2",
    "tertiary": "#06b6d4"
  }
}
```

### Example 3: Dark Premium Theme

```json
{
  "colors": {
    "primary": "#f59e0b",
    "secondary": "#fbbf24",
    "tertiary": "#fb923c",
    "black": "#000000",
    "white": "#ffffff"
  }
}
```

---

## Support

For issues or questions:

1. Check [GitHub Issues](https://github.com/your-repo/issues)
2. Review [Documentation](./README.md)
3. Contact support team

---

**Last Updated**: 2026-02-09
**Version**: 1.0.0
