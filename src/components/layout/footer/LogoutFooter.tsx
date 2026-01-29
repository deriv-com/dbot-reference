import { observer } from 'mobx-react-lite';
import { useLogout } from '@/hooks/useLogout';
import { LegacyLogout1pxIcon } from '@deriv/quill-icons/Legacy';
import { localize } from '@deriv-com/translations';
import { Tooltip } from '@deriv-com/ui';

const LogoutFooter = observer(() => {
    const handleLogout = useLogout();

    return (
        <Tooltip as='button' className='app-footer__icon' onClick={handleLogout} tooltipContent={localize('Log out')}>
            <LegacyLogout1pxIcon iconSize='xs' fill='var(--text-general)' />
        </Tooltip>
    );
});

export default LogoutFooter;
