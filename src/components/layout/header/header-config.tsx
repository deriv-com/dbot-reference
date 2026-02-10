import { ReactNode } from 'react';
import { standalone_routes } from '@/components/shared';
import { LegacyHomeNewIcon as TradershubLogo } from '@deriv/quill-icons/Legacy';
import {
    DerivProductBrandLightDerivBotLogoWordmarkIcon as DerivBotLogo,
    DerivProductBrandLightDerivTraderLogoWordmarkIcon as DerivTraderLogo,
    PartnersProductBrandLightSmarttraderLogoWordmarkIcon as SmarttraderLogo,
} from '@deriv/quill-icons/Logo';
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
        active: false,
        buttonIcon: <DerivTraderLogo height={25} width={114.97} />,
        description: localize('A whole new trading experience on a powerful yet easy to use platform.'),
        href: standalone_routes.trade,
        icon: <DerivTraderLogo height={32} width={148} />,
        showInEU: true,
    },
    {
        active: true,
        buttonIcon: <DerivBotLogo height={25} width={94} />,
        description: localize('Automated trading at your fingertips. No coding needed.'),
        href: standalone_routes.bot,
        icon: <DerivBotLogo height={32} width={121} />,
        showInEU: false,
    },
    {
        active: false,
        buttonIcon: <SmarttraderLogo height={24} width={115} />,
        description: localize('Trade the world’s markets with our popular user-friendly platform.'),
        href: standalone_routes.smarttrader,
        icon: <SmarttraderLogo height={32} width={153} />,
        showInEU: false,
    },
];

export const TRADERS_HUB_LINK_CONFIG = {
    as: 'a',
    href: standalone_routes.traders_hub,
    icon: <TradershubLogo iconSize='xs' />,
    label: 'Home',
};

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
