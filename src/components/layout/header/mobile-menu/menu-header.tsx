// Updated to show brand logo instead of "Menu" text
import { ComponentProps } from 'react';
import { BrandLogo } from '@/components/layout/app-logo/BrandLogo';
import { LabelPairedGlobeSmRegularIcon } from '@deriv/quill-icons';
import { useTranslations } from '@deriv-com/translations';
import { Text, useDevice } from '@deriv-com/ui';

type TMenuHeader = {
    hideLanguageSetting: boolean;
    // Using ComponentProps<'button'>['onClick'] for better type safety and consistency
    // with button onClick event handlers
    openLanguageSetting: ComponentProps<'button'>['onClick'];
};

const MenuHeader = ({ hideLanguageSetting, openLanguageSetting }: TMenuHeader) => {
    const { currentLang, localize } = useTranslations();
    const { isDesktop } = useDevice();

    return (
        <div className='mobile-menu__header'>
            {/* [AI] Show brand logo instead of "Menu" text */}
            <BrandLogo width={100} height={28} fill='var(--text-general)' />
            {/* [/AI] */}

            {!hideLanguageSetting && (
                <button
                    className='mobile-menu__header__language items-center'
                    onClick={openLanguageSetting}
                    aria-label={`${localize('Change language')} - ${localize('Current language')}: ${currentLang}`}
                    aria-expanded='false'
                    aria-haspopup='menu'
                >
                    <LabelPairedGlobeSmRegularIcon />
                    <Text className='ml-[0.4rem]' size={isDesktop ? 'xs' : 'sm'} weight='bold'>
                        {currentLang}
                    </Text>
                </button>
            )}
        </div>
    );
};

export default MenuHeader;
