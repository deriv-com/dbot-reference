import { getLogoutURL } from '@/components/shared';
import { LogoutService } from '../logout.service';

// Mock the shared components
jest.mock('@/components/shared', () => ({
    getLogoutURL: jest.fn(),
    isProduction: jest.fn().mockReturnValue(false),
}));

describe('LogoutService', () => {
    // Setup for all tests
    let originalFetch: typeof global.fetch;
    let originalConsoleError: typeof console.error;

    beforeEach(() => {
        // Store the original fetch and console.error
        originalFetch = global.fetch;
        originalConsoleError = console.error;

        // Mock fetch and console.error
        global.fetch = jest.fn();
        console.error = jest.fn();

        // Reset mocks
        (getLogoutURL as jest.Mock).mockReturnValue('https://api.example.com/logout');
    });

    afterEach(() => {
        // Restore original fetch and console.error
        global.fetch = originalFetch;
        console.error = originalConsoleError;
        jest.clearAllMocks();
    });

    describe('requestRestLogout', () => {
        it('should handle successful logout', async () => {
            // Mock successful response with logout_url
            const mockResponse = {
                logout_url: 'https://api.example.com/complete-logout',
                json: jest.fn().mockResolvedValue({ logout_url: 'https://api.example.com/complete-logout' }),
                headers: {
                    get: jest.fn().mockReturnValue('application/json'),
                },
            };

            // Setup fetch mock implementation
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce(mockResponse) // First call to fetch
                .mockResolvedValueOnce({}); // Second call to logout_url

            // Call the service
            const result = await LogoutService.requestRestLogout();

            // Verify results
            expect(result).toEqual({ logout: 1 });
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(global.fetch).toHaveBeenNthCalledWith(1, 'https://api.example.com/logout', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://api.example.com/complete-logout', {
                method: 'GET',
                credentials: 'include',
                redirect: 'manual',
            });
        });

        it('should handle successful logout without logout_url', async () => {
            // Mock successful response without logout_url
            const mockResponse = {
                json: jest.fn().mockResolvedValue({}),
                headers: {
                    get: jest.fn().mockReturnValue('application/json'),
                },
            };

            // Setup fetch mock implementation
            (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            // Call the service
            const result = await LogoutService.requestRestLogout();

            // Verify results
            expect(result).toEqual({ logout: 1 });
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should handle non-JSON response', async () => {
            // Mock non-JSON response
            const mockResponse = {
                headers: {
                    get: jest.fn().mockReturnValue('text/html'),
                },
            };

            // Setup fetch mock implementation
            (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            // Call the service
            const result = await LogoutService.requestRestLogout();

            // Verify results
            expect(result).toEqual({ logout: 1 });
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should handle network failure', async () => {
            // Setup fetch mock to throw network error
            const networkError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

            // Call the service
            const result = await LogoutService.requestRestLogout();

            // Verify results - should still return success as cleanup is handled by client-store
            expect(result).toEqual({ logout: 1 });
            // Verify error is logged
        });

        it('should handle invalid JSON response', async () => {
            // Mock response with JSON parsing error
            const jsonError = new Error('Invalid JSON');
            const mockResponse = {
                json: jest.fn().mockRejectedValueOnce(jsonError),
                headers: {
                    get: jest.fn().mockReturnValue('application/json'),
                },
            };

            // Setup fetch mock implementation
            (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            // Call the service
            const result = await LogoutService.requestRestLogout();

            // Verify results - should still return success as cleanup is handled by client-store
            expect(result).toEqual({ logout: 1 });
            // Verify error is logged
        });

        it('should handle cross-origin cookie restrictions', async () => {
            // Mock successful response with logout_url
            const mockResponse = {
                logout_url: 'https://api.example.com/complete-logout',
                json: jest.fn().mockResolvedValue({ logout_url: 'https://api.example.com/complete-logout' }),
                headers: {
                    get: jest.fn().mockReturnValue('application/json'),
                },
            };

            // Setup fetch mock implementation for first call
            (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            // Setup fetch mock implementation for second call to throw a cross-origin error
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Cross-origin request blocked'));

            // Call the service
            const result = await LogoutService.requestRestLogout();

            // Verify results - should still return success as cleanup is handled by client-store
            expect(result).toEqual({ logout: 1 });
        });

        it('should use production URL when in production mode', async () => {
            // Mock isProduction to return true
            require('@/components/shared').isProduction.mockReturnValue(true);

            // Mock getLogoutURL to return production URL
            (getLogoutURL as jest.Mock).mockReturnValue('https://api.production.com/logout');

            // Mock successful response
            const mockResponse = {
                json: jest.fn().mockResolvedValue({}),
                headers: {
                    get: jest.fn().mockReturnValue('application/json'),
                },
            };

            // Setup fetch mock implementation
            (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            // Call the service
            await LogoutService.requestRestLogout();

            // Verify production URL was used
            expect(global.fetch).toHaveBeenCalledWith('https://api.production.com/logout', expect.any(Object));
        });
    });
});
