<!-- AI-generated logo customization guide for white-labeling -->

# Logo Customization Quick Start

Replace the platform logo with your brand in 3 easy steps!

## 🎨 Step 1: Choose Your Method

### Method A: Edit the SVG Component (Recommended)

**Best for**: Vector logos, scalable graphics, theme-aware designs

1. Open `src/components/layout/app-logo/BrandLogo.tsx`
2. Replace the SVG content with your logo's SVG code
3. Save and refresh browser

```tsx
export const BrandLogo = ({ width = 120, height = 32, fill = 'currentColor' }) => {
    return (
        <svg width={width} height={height} viewBox='0 0 120 32' fill='none'>
            {/* Paste your SVG paths here */}
            <path d='M10 5 L20 25 L30 5' fill={fill} />
            <circle cx='50' cy='15' r='10' fill={fill} />
        </svg>
    );
};
```

### Method B: Use an Image File

**Best for**: PNG/JPG logos, existing image assets

1. Place your logo in `public/logo.svg` (or `.png`)
2. Update `BrandLogo.tsx`:

```tsx
export const BrandLogo = ({ width = 120, height = 32 }) => {
    return <img src='/logo.svg' alt='Logo' width={width} height={height} />;
};
```

## ⚙️ Step 2: Configure in brand.config.json

```json
{
    "platform": {
        "logo": {
            "type": "component",
            "alt_text": "Your Brand Name",
            "link_url": "/",
            "show_text": false,
            "text": "Your Brand"
        }
    }
}
```

**Options**:

- `show_text: true` - Display text next to logo
- `text: "Your Brand"` - Custom text
- `link_url: "/dashboard"` - Custom click destination

## 🚀 Step 3: Test

```bash
npm start
```

Open browser → Check header → Logo should appear!

---

## 📐 Logo Specifications

| Spec          | Recommendation                       |
| ------------- | ------------------------------------ |
| **Format**    | SVG (preferred) or PNG               |
| **Size**      | ~120x32px (width x height)           |
| **Retina**    | 2x for PNG (240x64px)                |
| **Color**     | Use `currentColor` for theme support |
| **File Size** | < 50KB optimized                     |

---

## 🎯 Common Scenarios

### Scenario 1: Add Company Name Next to Logo

```json
{
    "logo": {
        "show_text": true,
        "text": "Acme Trading"
    }
}
```

### Scenario 2: Link Logo to Dashboard

```json
{
    "logo": {
        "link_url": "/dashboard"
    }
}
```

### Scenario 3: Use External Image URL

Update `BrandLogo.tsx`:

```tsx
export const BrandLogo = () => <img src='https://yourdomain.com/logo.svg' alt='Logo' width={120} height={32} />;
```

---

## 🛠️ Export Logo from Design Tools

### Figma

1. Select logo frame
2. Right-click → "Copy/Paste as" → "Copy as SVG"
3. Paste into `BrandLogo.tsx`

### Adobe Illustrator

1. File → Export → Export As
2. Format: SVG
3. Options: Inline Style, Minify
4. Copy paths into `BrandLogo.tsx`

### Sketch

1. Select artboard
2. Export → SVG
3. Open in text editor
4. Copy `<svg>` content into `BrandLogo.tsx`

---

## 🐛 Troubleshooting

**Logo not showing?**

- Check browser console for errors
- Verify file path is correct
- Clear cache (Cmd/Ctrl + Shift + R)

**Logo wrong size?**

- Adjust `width` and `height` in `index.tsx`
- Check viewBox matches your SVG dimensions

**Logo wrong color?**

- Use `fill='var(--text-general)'` for theme color
- Or use `fill='var(--brand-primary)'` for brand color

---

## 📚 Need More Help?

- **Detailed Guide**: [WHITE_LABELING_GUIDE.md](WHITE_LABELING_GUIDE.md#logo-configuration)
- **Component Docs**: [src/components/layout/app-logo/README.md](src/components/layout/app-logo/README.md)
- **Changelog**: [WHITELABEL_CHANGELOG.md](WHITELABEL_CHANGELOG.md#logo-system-implementation)

---

**Happy Branding!** 🎨
