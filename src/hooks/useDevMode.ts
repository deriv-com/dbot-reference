import { useEffect } from 'react';
import { botNotification } from '@/components/bot-notification/bot-notification';
import { WS_SERVERS } from '@/components/shared/utils/config/config';
import { LocalStorageConstants } from '@deriv-com/utils';

const DEV_SERVER_URL = WS_SERVERS.STAGING;
//to be checked after login function done.

const useDevMode = () => {
    const switchToDevServer = () => {
        // Show connecting notification first
        botNotification(`Connecting to dev server: ${DEV_SERVER_URL} (Cmd+Shift+D)`, undefined, {
            type: 'info',
            autoClose: 2000,
        });

        // Delay localStorage change to allow snackbar to be read
        setTimeout(() => {
            localStorage.setItem(LocalStorageConstants.configServerURL, DEV_SERVER_URL);
            // Manually reload page to apply server changes
            window.location.reload();
        }, 1500);
    };

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Check for Cmd+Shift+D on Mac or Ctrl+Shift+D on Windows/Linux
            const isModifierPressed = event.metaKey || event.ctrlKey;
            const isShiftPressed = event.shiftKey;
            const isDPressed = event.code === 'KeyD';

            if (isModifierPressed && isShiftPressed && isDPressed) {
                event.preventDefault();
                switchToDevServer();
            }
        };

        // Add event listener
        document.addEventListener('keydown', handleKeyPress);

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, []);

    return { switchToDevServer };
};

export default useDevMode;
