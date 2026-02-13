// ⚠️ PLACEHOLDER LOGO - REPLACE WITH YOUR BRAND ⚠️
// This is a generic template placeholder
// Replace this SVG with your own brand logo
// See: src/components/layout/app-logo/README.md for instructions

type TBrandLogoProps = {
    width?: number;
    height?: number;
    fill?: string;
    className?: string;
};

export const BrandLogo = ({
    width = 120,
    height = 32,
    fill = 'currentColor',
    className = ''
}: TBrandLogoProps) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 120 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Brand Logo Placeholder"
        >
            {/* PLACEHOLDER - Replace with your brand's SVG */}

            {/* Dashed border box to indicate placeholder */}
            <rect
                x="1"
                y="1"
                width="118"
                height="30"
                rx="4"
                opacity="0.3"
                fill="none"
            />

            {/* Image icon placeholder */}
            <g transform="translate(8, 8)">
                {/* Picture frame icon */}
                <rect x="0" y="0" width="16" height="16" rx="2" stroke={fill} strokeWidth="1.5" fill="none" opacity="0.4" />

                {/* Mountain/landscape icon inside */}
                <path
                    d="M2 12L6 8L9 11L14 6V14H2V12Z"
                    fill={fill}
                    opacity="0.3"
                />

                {/* Sun/circle in corner */}
                <circle cx="11" cy="5" r="1.5" fill={fill} opacity="0.3" />
            </g>

            {/* "YOUR LOGO" text */}
            <text
                x="30"
                y="20"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="11"
                fontWeight="500"
                fill={fill}
                opacity="0.5"
                letterSpacing="0.5"
            >
                BRAND LOGO
            </text>

        </svg>
    );
};

// CUSTOMIZATION OPTIONS:
//
// Option 1: Replace SVG inline (Recommended for vector logos)
// --------------------------------------------------------
// Delete the placeholder SVG above and paste your logo's SVG code:
//
// export const BrandLogo = ({ width = 120, height = 32, fill = 'currentColor' }) => {
//     return (
//         <svg width={width} height={height} viewBox="0 0 120 32" fill="none">
//             {/* Your logo's SVG paths here */}
//             <path d="M..." fill={fill} />
//             <path d="M..." fill={fill} />
//         </svg>
//     );
// };
//
//
// Option 2: Use image file (For PNG/JPG logos)
// ---------------------------------------------
// 1. Place your logo in: public/logo.svg (or .png)
// 2. Replace this component with:
//
// export const BrandLogo = ({ width = 120, height = 32, className = '' }: TBrandLogoProps) => {
//     return (
//         <img
//             src="/logo.svg"
//             alt="Brand Logo"
//             width={width}
//             height={height}
//             className={className}
//         />
//     );
// };
//
//
// Option 3: Use external URL
// ---------------------------
// export const BrandLogo = ({ width = 120, height = 32 }: TBrandLogoProps) => {
//     return (
//         <img
//             src="https://yourdomain.com/logo.svg"
//             alt="Brand Logo"
//             width={width}
//             height={height}
//         />
//     );
// };
//
// For detailed instructions, see: src/components/layout/app-logo/README.md
