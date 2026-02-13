import { ReactNode } from 'react';
import { standalone_routes } from '@/components/shared';
import { DerivProductBrandLightDerivBotLogoWordmarkIcon as DerivBotLogo } from '@deriv/quill-icons/Logo';
import { localize } from '@deriv-com/translations';

export type PlatformsConfig = {
    active: boolean;
    buttonIcon: ReactNode;
    description: string;
    href: string;
    icon: ReactNode;
    showInEU: boolean;
};

export type MenuItemsConfig = {
    as: 'a' | 'button';
    href: string;
    icon: ReactNode;
    label: string;
};

export type TAccount = {
    balance: string;
    currency: string;
    icon: React.ReactNode;
    isActive: boolean;

    isVirtual: boolean;
    loginid: string;
    token: string;
    type: string;
};

export const platformsConfig: PlatformsConfig[] = [
    {
        active: true,
        buttonIcon: <DerivBotLogo height={25} width={94} />,
        description: localize('Automated trading at your fingertips. No coding needed.'),
        href: standalone_routes.bot,
        icon: <DerivBotLogo height={32} width={121} />,
        showInEU: false,
    },
];

// ========================================
// MENU ITEMS CONFIGURATION PLACEHOLDER
// ========================================
//
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
//
// Empty by default for white-labeling
export const MenuItems: MenuItemsConfig[] = [];
