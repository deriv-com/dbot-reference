<!-- Comprehensive white-labeling guide with process, best practices, and troubleshooting -->

# White Labeling Guide

Comprehensive guide for customizing the Trading Bot platform with your own branding.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Configuration Options](#configuration-options)
- [Customization Workflow](#customization-workflow)
- [Best Practices](#best-practices)
- [Testing Your Branding](#testing-your-branding)
- [Troubleshooting](#troubleshooting)
- [Migration from Existing Brand](#migration-from-existing-brand)
- [Examples](#examples)

---

## Overview

The Trading Bot platform is designed for complete white-labeling through a centralized configuration system. You can customize:

- 🎨 **Visual Identity**: Colors, typography, logos
- 🔧 **Platform Settings**: Name, domain, endpoints
- 🌐 **API Configuration**: Authentication, WebSocket URLs
- 📱 **UI Components**: Menu items, footer elements, theme behavior

### Key Files

| File                                                                  | Purpose                                  | Documentation                                                                            |
| --------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `brand.config.json`                                                   | Central configuration file               | [BRAND_CONFIG_GUIDE.md](./BRAND_CONFIG_GUIDE.md)                                         |
| `src/components/layout/app-logo/BrandLogo.tsx`                        | Logo component                           | [LOGO_CUSTOMIZATION_QUICK_START.md](./LOGO_CUSTOMIZATION_QUICK_START.md)                 |
| `src/components/layout/header/header-config.tsx`                      | Desktop menu items                       | [BRAND_CONFIG_GUIDE.md - Menu Configuration](./BRAND_CONFIG_GUIDE.md#menu-configuration) |
| `src/components/layout/header/mobile-menu/use-mobile-menu-config.tsx` | Mobile menu items                        | [BRAND_CONFIG_GUIDE.md - Menu Configuration](./BRAND_CONFIG_GUIDE.md#menu-configuration) |
| `src/styles/_themes.scss`                                             | Generated CSS variables (auto-generated) | -                                                                                        |

---

## Quick Start

### 1. Update Brand Configuration

Edit [`brand.config.json`](../brand.config.json) in the project root:

```json
{
    "brand_name": "YourBrand",
    "brand_domain": "yourbrand.com",
    "domain_name": "YourBrand.com",
    "colors": {
        "primary": "#your-primary-color",
        "secondary": "#your-secondary-color"
        // ... more colors
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
        }
    }
}
```

**See**: [BRAND_CONFIG_GUIDE.md](./BRAND_CONFIG_GUIDE.md) for complete configuration reference

### 2. Customize Logo

Edit `src/components/layout/app-logo/BrandLogo.tsx` and replace the SVG with your brand logo:

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

**See**: [LOGO_CUSTOMIZATION_QUICK_START.md](./LOGO_CUSTOMIZATION_QUICK_START.md) for detailed logo customization

### 3. Generate CSS Variables

Run the brand CSS generator to update styles:

```bash
npm run generate:brand-css
```

This command:

- ✅ Validates your color configuration
- ✅ Generates CSS custom properties in `_themes.scss`
- ✅ Creates color variants for light/dark themes
- ✅ Maintains backward compatibility

### 4. Add Custom Menu Items (Optional)

**Desktop Menu**: Edit `src/components/layout/header/header-config.tsx`
**Mobile Menu**: Edit `src/components/layout/header/mobile-menu/use-mobile-menu-config.tsx`

**See**: [BRAND_CONFIG_GUIDE.md - Menu Customization](./BRAND_CONFIG_GUIDE.md#menu-customization) for implementation examples

### 5. Restart Development Server

```bash
npm start
```

Your branding is now live! Visit `https://localhost:8443` to see your customized platform.

---

## Configuration Options

For detailed documentation of all configuration options, see [BRAND_CONFIG_GUIDE.md](./BRAND_CONFIG_GUIDE.md).

### Quick Reference

| Section            | What It Controls                                | Documentation Link                                                                   |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Brand Identity** | Brand name, domain, hostname                    | [Brand Identity](./BRAND_CONFIG_GUIDE.md#brand-identity)                             |
| **Color System**   | Primary, secondary, semantic colors, grey scale | [Color System](./BRAND_CONFIG_GUIDE.md#color-system)                                 |
| **Typography**     | Font families, font sizes                       | [Typography](./BRAND_CONFIG_GUIDE.md#typography)                                     |
| **Logo**           | Logo display, type, alt text                    | [Logo Configuration](./BRAND_CONFIG_GUIDE.md#logo-configuration)                     |
| **Footer**         | Language settings, theme toggle visibility      | [Footer Configuration](./BRAND_CONFIG_GUIDE.md#footer-configuration)                 |
| **Menu**           | Custom navigation items (desktop & mobile)      | [Menu Configuration](./BRAND_CONFIG_GUIDE.md#menu-configuration)                     |
| **Authentication** | OAuth endpoints                                 | [Authentication Configuration](./BRAND_CONFIG_GUIDE.md#authentication-configuration) |
| **WebSocket**      | Trading API endpoints                           | [WebSocket Configuration](./BRAND_CONFIG_GUIDE.md#websocket-configuration)           |

---

## Customization Workflow

### Step-by-Step Process

```
1. Plan Your Branding
   ├─ Define color palette
   ├─ Choose typography
   ├─ Prepare logo assets
   └─ Document requirements

2. Update Configuration
   ├─ Edit brand.config.json
   ├─ Validate configuration
   └─ Generate CSS

3. Customize Components
   ├─ Update logo component
   ├─ Add custom menu items (optional)
   └─ Adjust UI elements (optional)

4. Test Implementation
   ├─ Visual testing
   ├─ Browser compatibility
   ├─ Responsive design
   └─ Accessibility

5. Deploy
   ├─ Production build
   ├─ Environment configuration
   └─ Go live!
```

### Configuration Validation

Always validate your configuration after making changes:

```bash
# Generate CSS (includes validation)
npm run generate:brand-css

# Run linting
npm run test:lint

# Build test
npm run build
```

---

## Best Practices

### 1. Color Accessibility

Ensure your color choices meet WCAG 2.1 accessibility standards.

**Contrast Requirements:**

- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text** (18px+ or 14px+ bold): 3:1 minimum
- **UI components**: 3:1 minimum for interactive elements

**Tools for Testing:**

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools > Lighthouse > Accessibility audit
- [WCAG Color Contrast Checker](https://colora11y.com/)

**Example**: Test your primary color against white/black backgrounds

```
Primary: #3b82f6 on White: #ffffff → 4.5:1 ✅ Pass
Primary: #3b82f6 on Black: #0f172a → 12.4:1 ✅ Pass
```

### 2. Font Selection

**System Fonts (Recommended)**

Advantages:

- ✅ Zero latency (no font loading)
- ✅ Native appearance on each platform
- ✅ Excellent performance
- ✅ No licensing concerns
- ✅ Better privacy (no external requests)

```json
{
    "font_family": {
        "primary": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    }
}
```

**Custom Fonts**

If brand guidelines require custom fonts:

- Use WOFF2 format for best compression
- Implement `font-display: swap` to prevent layout shift
- Subset fonts to include only needed characters
- Preload critical font files
- Always include system font fallbacks

**See**: [BRAND_CONFIG_GUIDE.md - Typography](./BRAND_CONFIG_GUIDE.md#typography) for font loading options

### 3. Branding Consistency

**Color Usage:**

- Use `primary` for main actions (CTAs, links, buttons)
- Use `secondary` for secondary actions and borders
- Use semantic colors consistently (`success` for profit, `danger` for loss, `warning` for alerts)
- Use grey scale for backgrounds and subtle UI elements

**Typography:**

- Maintain consistent font sizing across similar elements
- Use `primary` font family for UI and body text
- Use `monospace` for numeric data, code, and tables

**Logo:**

- Ensure logo works in both light and dark themes
- Test logo at different sizes (mobile, desktop, favicon)
- Use `fill='currentColor'` or dynamic fill for theme support

### 4. Performance

**Optimize Images:**

- Use SVG for logos and icons (better scalability and size)
- Compress PNG/JPG assets (use tools like TinyPNG)
- Provide retina (@2x) versions for raster images
- Use WebP format where supported

**Font Loading:**

- Limit number of font weights (4 max: 400, 500, 600, 700)
- Use system fonts to eliminate font loading entirely
- Implement `font-display: swap` for custom fonts
- Preload critical fonts in HTML head

**CSS Generation:**

- Run `npm run generate:brand-css` only when changing brand config
- Generated CSS is cached and optimized
- No runtime color calculations

**Bundle Size:**

- Remove unused colors from `brand.config.json`
- Minimize custom CSS overrides
- Use built-in components instead of custom implementations

---

## Testing Your Branding

### 1. Visual Testing

**Desktop Testing:**

```bash
npm start
```

Check these areas:

- [ ] Header with logo
- [ ] Navigation menu items
- [ ] Button colors (primary, secondary, tertiary)
- [ ] Form elements (inputs, dropdowns, checkboxes)
- [ ] Success/error messages
- [ ] Dashboard cards and widgets
- [ ] Footer with network status and time
- [ ] Theme toggle (light/dark mode)
- [ ] Language selector (if enabled)

**Mobile Testing:**

Use browser dev tools or real devices to test:

- [ ] Mobile menu (hamburger icon)
- [ ] Logo in mobile header
- [ ] Responsive layout
- [ ] Touch targets (minimum 44x44px)
- [ ] Mobile menu items
- [ ] Theme toggle in mobile menu

**Theme Testing:**

Test both light and dark modes:

```
1. Toggle theme using footer button
2. Verify all colors adapt properly
3. Check logo visibility in both themes
4. Verify text contrast in both themes
```

### 2. Validate Configuration

**Color Validation:**

```bash
npm run generate:brand-css
```

Look for errors in output:

- Invalid color format
- Missing required colors
- Incomplete grey scale

**Build Validation:**

```bash
npm run build
```

Ensures no TypeScript or configuration errors.

**Linting:**

```bash
npm run test:lint
```

### 3. Browser Testing

Test in major browsers:

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (macOS/iOS)

Check for:

- Color rendering consistency
- Font loading and display
- Logo display
- Responsive behavior
- Theme switching

### 4. Accessibility Testing

**Automated Testing:**

```bash
npm test
```

**Manual Testing:**

- [ ] Screen reader navigation (NVDA, JAWS, VoiceOver)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Color contrast (use browser dev tools)
- [ ] Alt text on logo and images
- [ ] Focus indicators visible

**Tools:**

- Chrome DevTools > Lighthouse > Accessibility
- [axe DevTools Extension](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)

---

## Troubleshooting

### Colors Not Updating

**Problem**: Changed colors in `brand.config.json` but UI doesn't reflect changes.

**Solution**:

1. Regenerate CSS variables:

    ```bash
    npm run generate:brand-css
    ```

2. Restart development server:

    ```bash
    npm start
    ```

3. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

4. Check console for errors during CSS generation

**Common Causes**:

- Forgot to run `generate:brand-css`
- Invalid color format (must be hex: `#RRGGBB`)
- Typo in color property name
- Browser cache (try incognito mode)

### Fonts Not Loading

**Problem**: Custom fonts don't appear, fallback to system fonts.

**Solution**:

**For Google Fonts:**

1. Verify font import in `public/index.html`:

    ```html
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
    ```

2. Check font name matches exactly:

    ```json
    {
        "font_family": {
            "primary": "'Inter', -apple-system, sans-serif"
        }
    }
    ```

3. Check browser network tab for font loading errors

**For Self-Hosted Fonts:**

1. Verify font files are in `public/fonts/`
2. Check `@font-face` declaration in `src/styles/_fonts.scss`
3. Verify font file paths are correct
4. Check console for 404 errors

### CSS Generation Script Fails

**Problem**: `npm run generate:brand-css` throws errors.

**Solution**:

1. **Validate JSON syntax**:

    ```bash
    node -e "JSON.parse(require('fs').readFileSync('brand.config.json', 'utf8'))"
    ```

2. **Common JSON errors**:
    - Missing comma between properties
    - Trailing comma at end of object/array
    - Unquoted property names
    - Comments (JSON doesn't support comments)

3. **Check required fields**:
    ```json
    {
        "brand_name": "required",
        "brand_domain": "required",
        "colors": {
            "primary": "required",
            "secondary": "required",
            "grey": {
                "50": "required",
                "100": "required",
                ...
                "900": "required"
            }
        }
    }
    ```

### Invalid Color Format

**Problem**: Error says color format is invalid.

**Solution**:

1. **Use only hexadecimal colors**:

    ```json
    // ✅ Correct
    "primary": "#3b82f6"

    // ❌ Incorrect
    "primary": "rgb(59, 130, 246)"
    "primary": "blue"
    "primary": "hsl(217, 91%, 60%)"
    ```

2. **Use 6-digit hex** (lowercase preferred):

    ```json
    // ✅ Correct
    "primary": "#3b82f6"

    // ⚠️ Works but not preferred
    "primary": "#38f"
    "primary": "#3B82F6"
    ```

3. **Include hash symbol**:

    ```json
    // ✅ Correct
    "primary": "#3b82f6"

    // ❌ Incorrect
    "primary": "3b82f6"
    ```

### Logo Not Displaying

**Problem**: Logo doesn't appear in header.

**Solution**:

1. **Check component export**:

    ```tsx
    // src/components/layout/app-logo/BrandLogo.tsx
    export const BrandLogo = ({ width, height, fill }) => { ... };
    ```

2. **Verify index export**:

    ```tsx
    // src/components/layout/app-logo/index.tsx
    export { BrandLogo } from './BrandLogo';
    ```

3. **Check brand.config.json**:

    ```json
    {
        "platform": {
            "logo": {
                "type": "component",
                "component_name": "BrandLogo", // Must match component name
                "alt_text": "Your Brand"
            }
        }
    }
    ```

4. **Check browser console** for import errors

### Mobile Menu Not Showing

**Problem**: Hamburger menu icon doesn't appear on mobile.

**Solution**:

This is by design! Mobile menu auto-hides when empty. It will show when:

- Custom menu items are added, OR
- Theme toggle is enabled (`enable_theme_toggle: true`), OR
- User is logged in (logout button available)

**To always show mobile menu**, add at least one menu item or enable theme toggle:

```json
{
    "platform": {
        "footer": {
            "enable_theme_toggle": true
        }
    }
}
```

**See**: [BRAND_CONFIG_GUIDE.md - Mobile Menu Auto-Hide](./BRAND_CONFIG_GUIDE.md#mobile-menu-auto-hide-behavior)

---

## Migration from Existing Brand

### 1. Extract Current Colors

If migrating from an existing platform:

1. **Use browser dev tools**:
    - Inspect elements
    - Copy computed colors from CSS

2. **Extract from existing CSS**:

    ```bash
    grep -r "color:" src/styles/ | sort | uniq
    ```

3. **Document brand guidelines**:
    - Primary brand color
    - Secondary colors
    - Success/error/warning colors
    - Grey scale palette

### 2. Document Current Values

Create a mapping document:

```markdown
# Brand Color Mapping

## Old System → New System

Primary Button: #1a8cff → brand.config.json "primary"
Secondary Button: #64748b → brand.config.json "secondary"
Success State: #00c851 → brand.config.json "success"
Error State: #ff4444 → brand.config.json "danger"
Warning State: #ff8800 → brand.config.json "warning"

## Fonts

Primary Font: 'Roboto' → "font_family.primary"
Code Font: 'Roboto Mono' → "font_family.monospace"
```

### 3. Update Incrementally

Don't change everything at once:

**Phase 1: Colors**

1. Update primary, secondary, tertiary colors
2. Generate CSS and test
3. Verify no visual regressions

**Phase 2: Typography**

1. Update font families
2. Ensure font loading works
3. Test across devices

**Phase 3: Logo**

1. Replace logo component
2. Test in both themes
3. Verify responsive sizes

**Phase 4: Customization**

1. Add custom menu items
2. Configure footer settings
3. Final testing

---

## Examples

### Example 1: Financial Tech Brand

**Profile**: Professional trading platform with blue color scheme

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
            "primary": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            "monospace": "'Fira Code', monospace"
        }
    },
    "platform": {
        "name": "FinTech Pro Trading",
        "logo": {
            "type": "component",
            "component_name": "BrandLogo",
            "alt_text": "FinTech Pro"
        },
        "footer": {
            "enable_language_settings": true,
            "enable_theme_toggle": true
        }
    }
}
```

**Characteristics**:

- Professional blue (#0066cc) primary color
- Clean grey scale for business context
- Inter font for modern, readable UI
- Fira Code for technical data display
- Full footer features enabled

---

### Example 2: Dark Premium Theme

**Profile**: Exclusive trading platform with purple/pink accents

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
            "monospace": "'JetBrains Mono', monospace"
        }
    },
    "platform": {
        "name": "EliteTrader",
        "logo": {
            "type": "component",
            "component_name": "BrandLogo",
            "alt_text": "EliteTrader"
        },
        "footer": {
            "enable_language_settings": false,
            "enable_theme_toggle": true
        }
    }
}
```

**Characteristics**:

- Bold purple (#9333ea) with pink accent (#ec4899)
- Dark-focused design (deep blacks)
- Poppins for modern, stylish appearance
- Single language (language selector disabled)
- Theme toggle enabled for light/dark switching

---

### Example 3: Minimal Setup

**Profile**: Simple trading platform, single language, locked theme

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
            "alt_text": "SimpleTrade"
        },
        "footer": {
            "enable_language_settings": false,
            "enable_theme_toggle": false
        }
    }
}
```

**Characteristics**:

- Clean blue primary color
- System fonts (no custom font loading)
- Image-based logo (simpler setup)
- Both footer options disabled (minimal UI)
- Mobile menu auto-hides when user not logged in
- Fastest loading performance (no custom fonts)

---

## Related Documentation

- **[BRAND_CONFIG_GUIDE.md](./BRAND_CONFIG_GUIDE.md)** - Complete brand.config.json reference
- **[LOGO_CUSTOMIZATION_QUICK_START.md](./LOGO_CUSTOMIZATION_QUICK_START.md)** - Logo implementation guide
- **[AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md)** - OAuth authentication setup
- **[WEBSOCKET_CONNECTION_FLOW.md](./WEBSOCKET_CONNECTION_FLOW.md)** - WebSocket API integration
- **[ERROR_LOGGING_GUIDE.md](./ERROR_LOGGING_GUIDE.md)** - Error handling and logging

---

## Support

### Getting Help

1. **Check Documentation**: Review this guide and [BRAND_CONFIG_GUIDE.md](./BRAND_CONFIG_GUIDE.md)
2. **Validate Configuration**: Run `npm run generate:brand-css`
3. **Check Console**: Browser console may show configuration warnings
4. **Review Examples**: See example configurations above
5. **Troubleshooting**: Check [Troubleshooting](#troubleshooting) section

### Common Resources

- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Google Fonts](https://fonts.google.com/)
- [SVG Optimizer](https://jakearchibald.github.io/svgomg/)
- [TinyPNG Image Compression](https://tinypng.com/)

---

## Summary Checklist

Before going live with your white-labeled platform:

- [ ] Updated `brand.config.json` with your brand details
- [ ] Customized logo in `BrandLogo.tsx`
- [ ] Generated CSS variables (`npm run generate:brand-css`)
- [ ] Added custom menu items (if needed)
- [ ] Configured footer settings
- [ ] Tested in light and dark themes
- [ ] Verified colors meet accessibility standards (4.5:1 contrast)
- [ ] Tested on mobile devices
- [ ] Tested in major browsers (Chrome, Firefox, Safari)
- [ ] Validated keyboard navigation and screen reader support
- [ ] Updated authentication URLs for your domain
- [ ] Updated WebSocket URLs for your API
- [ ] Tested end-to-end user flows
- [ ] Created production build (`npm run build`)
- [ ] Deployed to staging environment
- [ ] Performed final QA testing

**Ready to launch!** 🚀
