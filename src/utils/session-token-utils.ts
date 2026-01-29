/**
 * @param token - The session token to store
 * @param expires - Optional ISO 8601 expiry date string from API
 */
export const setSessionToken = (token: string): void => {
    try {
        // Store in localStorage for backward compatibility and local tab sync
        localStorage.setItem('session_token', token);
    } catch (error) {
        console.error('Error setting session token:', error);
    }
};
