# White-Labeling Changes

This document tracks changes made to convert this repository into a white-labeling solution.

## Date: 2026-02-09

### Changes Made

#### 1. Brand Configuration Reset

**File**: `brand.config.json`

**Before (Deriv-branded)**:
- Brand Name: "Deriv"
- Primary Color: `#ff444f` (Deriv Red)
- Secondary: `#85acb0` (Deriv Teal)
- Tertiary: `#2a3052` (Deriv Navy)
- Domain: deriv.com
- Logo: IcRebrandingDerivBot

**After (Neutral placeholder)**:
- Brand Name: "YourBrand" 
- Primary Color: `#3b82f6` (Blue 500)
- Secondary: `#64748b` (Slate 500)
- Tertiary: `#8b5cf6` (Purple 500)
- Domain: yourbrand.com
- Logo: YourBrandLogo

**New Additions**:
```json
{
  "typography": {
    "font_family": {
      "primary": "System font stack",
      "secondary": "Serif font stack", 
      "monospace": "Monospace font stack"
    },
    "font_sizes": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      // ... more sizes
    }
  }
}
```

#### 2. Brand CSS Generator Enhancement

**File**: `scripts/generate-brand-css.js`

**Enhancements**:
- ✅ Added typography CSS variable generation
- ✅ Updated validation to check typography configuration
- ✅ Enhanced console output to show font changes
- ✅ Added support for `--brand-font-primary`, `--brand-font-secondary`, `--brand-font-monospace`

**Generated CSS Variables** (New):
```css
--brand-font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...;
--brand-font-secondary: Georgia, 'Times New Roman', Times, serif;
--brand-font-monospace: 'Courier New', Courier, monospace;
```

#### 3. Documentation

**New Files Created**:

1. **WHITE_LABELING_GUIDE.md**
   - Complete white-labeling customization guide
   - Color configuration reference
   - Typography setup instructions
   - Platform configuration details
   - Best practices and accessibility guidelines
   - Troubleshooting section
   - Example themes

2. **WHITELABEL_CHANGELOG.md** (This file)
   - Track of all white-labeling changes
   - Before/after comparisons

#### 4. Generated CSS Update

**File**: `src/components/shared/styles/_themes.scss`

**Updated CSS Variables**:
```css
/* Brand colors - dynamically generated from brand.config.json */
--brand-primary: #3b82f6;      /* Changed from #ff444f */
--brand-secondary: #64748b;    /* Changed from #85acb0 */
--brand-tertiary: #8b5cf6;     /* Changed from #2a3052 */
--brand-success: #10b981;      /* Changed from #4bb4b3 */
--brand-danger: #ef4444;       /* Changed from #cc2e3d */
--brand-warning: #f59e0b;      /* Changed from #ffad3a */
--brand-info: #0ea5e9;         /* Changed from #377cfc */
--brand-neutral: #6b7280;      /* Changed from #999999 */

/* Brand typography - dynamically generated from brand.config.json */
--brand-font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--brand-font-secondary: Georgia, 'Times New Roman', Times, serif;
--brand-font-monospace: 'Courier New', Courier, monospace;
```

### Neutral Color Palette

The new default palette uses neutral, professional colors based on Tailwind CSS:

| Purpose | Color | Hex Code | Usage |
|---------|-------|----------|--------|
| Primary | Blue 500 | `#3b82f6` | Main brand color, CTAs, links |
| Secondary | Slate 500 | `#64748b` | Secondary UI elements |
| Tertiary | Purple 500 | `#8b5cf6` | Accent highlights |
| Success | Green 500 | `#10b981` | Success states |
| Danger | Red 500 | `#ef4444` | Error states |
| Warning | Orange 500 | `#f59e0b` | Warning states |
| Info | Sky 500 | `#0ea5e9` | Info states |
| Neutral | Gray 500 | `#6b7280` | Neutral elements |
| Black | Slate 950 | `#0f172a` | Dark backgrounds/text |
| White | White | `#ffffff` | Light backgrounds/text |

### Benefits of Changes

1. **✅ Completely Brand-Agnostic**
   - No Deriv-specific colors or branding
   - Neutral placeholder values
   - Easy for third-parties to customize

2. **✅ Enhanced Typography Control**
   - Font family customization
   - System font stack by default (better performance)
   - Easy to add custom fonts

3. **✅ Better Documentation**
   - Comprehensive white-labeling guide
   - Step-by-step customization instructions
   - Best practices and examples

4. **✅ Automated Workflow**
   - Single command to update branding: `npm run generate:brand-css`
   - Automatic validation
   - Clear error messages

### Migration Path for Third-Party Developers

For developers wanting to brand this platform:

1. **Update `brand.config.json`** with your brand colors and typography
2. **Run `npm run generate:brand-css`** to apply changes
3. **Restart dev server** to see changes
4. **Test across all pages** to ensure consistency

### Testing Performed

- ✅ Generated CSS with new neutral colors
- ✅ Validated configuration structure
- ✅ Verified typography variables generation
- ✅ Confirmed backward compatibility with legacy CSS variables
- ✅ Script validation passes

### Files Modified

```
✏️  Modified:
   - brand.config.json (brand reset to neutral)
   - scripts/generate-brand-css.js (typography support)
   - src/components/shared/styles/_themes.scss (regenerated CSS)

📝 Created:
   - WHITE_LABELING_GUIDE.md (comprehensive guide)
   - WHITELABEL_CHANGELOG.md (this file)
```

### Breaking Changes

None. All changes are backward compatible:
- Legacy CSS variables (`--brand-red-coral`, `--brand-orange`) still work
- Existing components use the same variable names
- Typography is additive (optional enhancement)

---

**Prepared By**: Claude (AI Assistant)
**Review Required**: Yes - Verify colors and branding are acceptable
**Next Steps**: Update README.md to reference WHITE_LABELING_GUIDE.md

---

## Font Integration Fix (2026-02-09 - Part 2)

### Issue Identified

After implementing the brand font variables, we discovered a disconnect:
- ✅ Brand font CSS variables were generated in `_themes.scss`
- ❌ But the app was still using hardcoded `IBM Plex Sans` font
- ❌ No connection between the two font systems

### Resolution

**Files Updated:**

1. **`src/styles/index.scss`**
   ```scss
   // BEFORE
   @import 'https://fonts.googleapis.com/.../IBM+Plex+Sans...';
   body {
       font-family: 'IBM Plex Sans', sans-serif;  // Hardcoded
   }
   
   // AFTER
   // Removed Google Fonts import (now using system fonts)
   body {
       font-family: var(--brand-font-primary);  // Uses brand config
   }
   ```

2. **`src/components/shared/styles/_fonts.scss`**
   ```scss
   // BEFORE
   $FONT_STACK: 'IBM Plex Sans', sans-serif;  // Hardcoded
   
   // AFTER
   $FONT_STACK: var(--brand-font-primary);  // Uses brand config
   ```

3. **`WHITE_LABELING_GUIDE.md`**
   - Added "Loading Custom Fonts" section
   - Documented 3 options: Google Fonts, Self-hosted, System Fonts
   - Provided code examples for each approach

### Benefits

✅ **Fully Integrated** - Font system now uses brand configuration  
✅ **No External Dependencies** - Removed IBM Plex Sans (Google Fonts)  
✅ **Better Performance** - System fonts load instantly (no HTTP request)  
✅ **Easy Customization** - Change fonts in `brand.config.json` only  
✅ **Flexible** - Third-parties can still add custom fonts if needed

### Current Font Stack

**Default (System Fonts)**:
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
```

**Advantages**:
- Zero latency (instant load)
- Native appearance on each OS
- No licensing costs
- Excellent readability

### How It Works Now

```
brand.config.json
    ↓ (typography.font_family.primary)
npm run generate:brand-css
    ↓ (generates CSS variable)
_themes.scss
    ↓ (--brand-font-primary)
index.scss & _fonts.scss
    ↓ (var(--brand-font-primary))
Applied to entire app ✅
```

### Testing

```bash
# 1. Verify CSS variable exists
grep "brand-font-primary" src/components/shared/styles/_themes.scss

# 2. Verify usage in styles
grep "var(--brand-font-primary)" src/styles/index.scss

# 3. Test in browser
npm start
# Open DevTools → Elements → body → Computed → font-family
```

**Expected Result**: Should show system font stack, not IBM Plex Sans

---

**Status**: ✅ Complete - Font system fully integrated with brand configuration
