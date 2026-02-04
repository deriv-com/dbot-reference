import { useEffect } from 'react';
import { observer as globalObserver } from '@/external/bot-skeleton/utils/observer';

/**
 * Hook to handle invalid token events by reloading the page
 *
 * This hook listens for 'InvalidToken' events emitted by the API base when
 * a token is invalid. When such an event is detected, it reloads the page
 * to trigger a new authentication flow.
 *
 * @returns {{ unregisterHandler: () => void }} An object containing a function to unregister the event handler
 */
export const useInvalidTokenHandler = (): { unregisterHandler: () => void } => {
    const handleInvalidToken = () => {
        // Reload the page to trigger new authentication
        window.location.reload();
    };

    // Subscribe to the InvalidToken event
    useEffect(() => {
        globalObserver.register('InvalidToken', handleInvalidToken);

        // Cleanup the subscription when the component unmounts
        return () => {
            globalObserver.unregister('InvalidToken', handleInvalidToken);
        };
    }, []);

    // Return a function to unregister the handler manually if needed
    return {
        unregisterHandler: () => {
            globalObserver.unregister('InvalidToken', handleInvalidToken);
        },
    };
};

export default useInvalidTokenHandler;
