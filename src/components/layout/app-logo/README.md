<!-- App logo component documentation for white-labeling -->

# App Logo Component

This directory contains the configurable brand logo system for white-labeling.

## Files

- **`index.tsx`** - Main AppLogo component that reads from `brand.config.json`
- **`BrandLogo.tsx`** - Placeholder SVG logo component (customize this!)
- **`app-logo.scss`** - Logo styling

## Quick Customization

### 1. Update Logo Configuration

Edit `brand.config.json` at the project root:

```json
{
    "platform": {
        "logo": {
            "type": "component",
            "component_name": "BrandLogo",
            "alt_text": "Your Brand",
            "link_url": "/",
            "show_text": false,
            "text": "Your Brand"
        }
    }
}
```

### 2. Customize the Logo

**Option A: Edit the SVG Component**

Replace the SVG in `BrandLogo.tsx`:

```tsx
export const BrandLogo = ({ width = 120, height = 32, fill = 'currentColor' }) => {
    return (
        <svg width={width} height={height} viewBox='0 0 120 32'>
            {/* Your SVG paths here */}
            <path d='M...' fill={fill} />
        </svg>
    );
};
```

**Option B: Use an Image File**

1. Place logo in `public/logo.svg`
2. Update `BrandLogo.tsx`:

```tsx
export const BrandLogo = ({ width = 120, height = 32 }) => {
    return <img src='/logo.svg' alt='Logo' width={width} height={height} />;
};
```

### 3. Restart Development Server

```bash
npm start
```

## Configuration Options

| Property         | Type                       | Default         | Description              |
| ---------------- | -------------------------- | --------------- | ------------------------ |
| `type`           | `"component"` \| `"image"` | `"component"`   | Logo rendering method    |
| `component_name` | `string`                   | `"BrandLogo"`   | Name of logo component   |
| `alt_text`       | `string`                   | `"Trading Bot"` | Accessibility text       |
| `link_url`       | `string`                   | `"/"`           | URL when logo is clicked |
| `show_text`      | `boolean`                  | `false`         | Show text next to logo   |
| `text`           | `string`                   | `platform.name` | Text to display          |

## Examples

### Example 1: Logo with Text

```json
{
    "logo": {
        "type": "component",
        "show_text": true,
        "text": "TradingPro"
    }
}
```

### Example 2: External Image

```json
{
    "logo": {
        "type": "image",
        "alt_text": "Company Logo"
    }
}
```

Then update `BrandLogo.tsx`:

```tsx
export const BrandLogo = () => <img src='/logo.svg' alt='Company Logo' width={120} height={32} />;
```

### Example 3: Custom SVG from Figma

1. Export SVG from Figma
2. Copy the `<svg>` content
3. Paste into `BrandLogo.tsx`:

```tsx
export const BrandLogo = ({ fill = 'currentColor' }) => (
    <svg width='120' height='32' viewBox='0 0 120 32'>
        {/* Paste your Figma SVG paths here */}
        <path d='...' fill={fill} />
    </svg>
);
```

## Tips

✅ **Use SVG** for best quality across all screen sizes
✅ **Use `currentColor`** or `fill` prop to match theme colors
✅ **Optimize SVGs** with [SVGO](https://github.com/svg/svgo)
✅ **Test both light and dark modes** if your app supports themes
✅ **Provide meaningful alt text** for accessibility

## Troubleshooting

### Logo doesn't update after changes

1. Clear browser cache (Cmd/Ctrl + Shift + R)
2. Restart the development server
3. Check browser console for import errors

### Logo appears too large/small

Adjust the `width` and `height` props in `index.tsx`:

```tsx
<BrandLogo width={150} height={40} fill='var(--text-general)' />
```

### Logo color doesn't match theme

Ensure you're using `fill='var(--text-general)'` or another CSS variable:

```tsx
<BrandLogo fill='var(--brand-primary)' />
```

---

**For more details**, see [WHITE_LABELING_GUIDE.md](../../../../WHITE_LABELING_GUIDE.md)
