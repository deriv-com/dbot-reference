import { observer as globalObserver } from '@/external/bot-skeleton/utils/observer';
import { ErrorLogger } from '@/utils/error-logger';
import { renderHook } from '@testing-library/react';
import { useInvalidTokenHandler } from '../useInvalidTokenHandler';

// Mock dependencies
jest.mock('@/external/bot-skeleton/utils/observer', () => ({
    observer: {
        register: jest.fn(),
        unregister: jest.fn(),
    },
}));

jest.mock('@/utils/error-logger', () => ({
    ErrorLogger: {
        error: jest.fn(),
    },
}));

jest.mock('@/components/shared', () => ({
    generateOAuthURL: jest.fn(),
}));

// Import after mocking
import { generateOAuthURL } from '@/components/shared';

describe('useInvalidTokenHandler', () => {
    let mockGenerateOAuthURL: jest.Mock;
    let mockWindowLocationReplace: jest.Mock;
    let mockWindowLocationReload: jest.Mock;
    let originalLocation: Location;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Setup mock functions
        mockGenerateOAuthURL = generateOAuthURL as jest.Mock;
        mockWindowLocationReplace = jest.fn();
        mockWindowLocationReload = jest.fn();

        // Save original location
        originalLocation = window.location;

        // Mock window.location
        delete (window as any).location;
        window.location = {
            ...originalLocation,
            replace: mockWindowLocationReplace,
            reload: mockWindowLocationReload,
        } as any;

        // Mock storage
        Storage.prototype.removeItem = jest.fn();
        Storage.prototype.clear = jest.fn();
    });

    afterEach(() => {
        // Restore original location
        window.location = originalLocation;
        jest.restoreAllMocks();
    });

    describe('Hook Registration', () => {
        it('should register InvalidToken event handler on mount', () => {
            renderHook(() => useInvalidTokenHandler());

            expect(globalObserver.register).toHaveBeenCalledWith(
                'InvalidToken',
                expect.any(Function)
            );
        });

        it('should unregister InvalidToken event handler on unmount', () => {
            const { unmount } = renderHook(() => useInvalidTokenHandler());

            unmount();

            expect(globalObserver.unregister).toHaveBeenCalledWith(
                'InvalidToken',
                expect.any(Function)
            );
        });

        it('should return unregisterHandler function', () => {
            const { result } = renderHook(() => useInvalidTokenHandler());

            expect(result.current).toHaveProperty('unregisterHandler');
            expect(typeof result.current.unregisterHandler).toBe('function');
        });

        it('should allow manual unregistration via returned function', () => {
            const { result } = renderHook(() => useInvalidTokenHandler());

            result.current.unregisterHandler();

            expect(globalObserver.unregister).toHaveBeenCalledWith(
                'InvalidToken',
                expect.any(Function)
            );
        });
    });

    describe('Invalid Token Handling - Success Path', () => {
        it('should clear invalid auth data from sessionStorage', async () => {
            mockGenerateOAuthURL.mockResolvedValue('https://oauth.example.com/authorize');

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler
            await handler();

            expect(sessionStorage.removeItem).toHaveBeenCalledWith('auth_info');
            expect(sessionStorage.clear).toHaveBeenCalled();
        });

        it('should clear invalid auth data from localStorage', async () => {
            mockGenerateOAuthURL.mockResolvedValue('https://oauth.example.com/authorize');

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler
            await handler();

            expect(localStorage.removeItem).toHaveBeenCalledWith('active_loginid');
            expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
            expect(localStorage.removeItem).toHaveBeenCalledWith('accountsList');
            expect(localStorage.removeItem).toHaveBeenCalledWith('clientAccounts');
        });

        it('should generate OAuth URL and redirect', async () => {
            const mockOAuthURL = 'https://oauth.example.com/authorize?client_id=123';
            mockGenerateOAuthURL.mockResolvedValue(mockOAuthURL);

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler
            await handler();

            expect(mockGenerateOAuthURL).toHaveBeenCalled();
            expect(mockWindowLocationReplace).toHaveBeenCalledWith(mockOAuthURL);
        });

        it('should use window.location.replace instead of reload', async () => {
            const mockOAuthURL = 'https://oauth.example.com/authorize';
            mockGenerateOAuthURL.mockResolvedValue(mockOAuthURL);

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler
            await handler();

            expect(mockWindowLocationReplace).toHaveBeenCalledWith(mockOAuthURL);
            expect(mockWindowLocationReload).not.toHaveBeenCalled();
        });
    });

    describe('Invalid Token Handling - Fallback Scenarios', () => {
        it('should reload page if OAuth URL generation returns null', async () => {
            mockGenerateOAuthURL.mockResolvedValue(null);

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler
            await handler();

            expect(ErrorLogger.error).toHaveBeenCalledWith(
                'InvalidToken',
                'Failed to generate OAuth URL, falling back to reload'
            );
            expect(mockWindowLocationReload).toHaveBeenCalled();
        });

        it('should reload page if OAuth URL generation returns undefined', async () => {
            mockGenerateOAuthURL.mockResolvedValue(undefined);

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler
            await handler();

            expect(ErrorLogger.error).toHaveBeenCalledWith(
                'InvalidToken',
                'Failed to generate OAuth URL, falling back to reload'
            );
            expect(mockWindowLocationReload).toHaveBeenCalled();
        });

        it('should reload page if OAuth URL generation returns empty string', async () => {
            mockGenerateOAuthURL.mockResolvedValue('');

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler
            await handler();

            expect(ErrorLogger.error).toHaveBeenCalledWith(
                'InvalidToken',
                'Failed to generate OAuth URL, falling back to reload'
            );
            expect(mockWindowLocationReload).toHaveBeenCalled();
        });

        it('should reload page if OAuth URL generation throws error', async () => {
            const mockError = new Error('OAuth generation failed');
            mockGenerateOAuthURL.mockRejectedValue(mockError);

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler
            await handler();

            expect(ErrorLogger.error).toHaveBeenCalledWith(
                'InvalidToken',
                'Error handling invalid token',
                mockError
            );
            expect(mockWindowLocationReload).toHaveBeenCalled();
        });

        it('should reload page if storage clearing throws error', async () => {
            const storageError = new Error('Storage error');
            Storage.prototype.removeItem = jest.fn().mockImplementation(() => {
                throw storageError;
            });

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler
            await handler();

            expect(ErrorLogger.error).toHaveBeenCalledWith(
                'InvalidToken',
                'Error handling invalid token',
                storageError
            );
            expect(mockWindowLocationReload).toHaveBeenCalled();
        });
    });

    describe('Prevents Infinite Reload Loop', () => {
        it('should clear auth data before redirecting to prevent loop', async () => {
            const mockOAuthURL = 'https://oauth.example.com/authorize';
            mockGenerateOAuthURL.mockResolvedValue(mockOAuthURL);

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler
            await handler();

            // Verify storage was cleared BEFORE redirect
            const removeItemCalls = (localStorage.removeItem as jest.Mock).mock.invocationCallOrder;
            const replaceCalls = mockWindowLocationReplace.mock.invocationCallOrder;

            // All removeItem calls should happen before replace
            removeItemCalls.forEach((removeOrder: number) => {
                replaceCalls.forEach((replaceOrder: number) => {
                    expect(removeOrder).toBeLessThan(replaceOrder);
                });
            });
        });

        it('should clear sessionStorage completely to remove stale data', async () => {
            const mockOAuthURL = 'https://oauth.example.com/authorize';
            mockGenerateOAuthURL.mockResolvedValue(mockOAuthURL);

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler
            await handler();

            expect(sessionStorage.clear).toHaveBeenCalled();
        });
    });

    describe('Error Logging', () => {
        it('should log error when OAuth URL generation fails', async () => {
            mockGenerateOAuthURL.mockResolvedValue(null);

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler
            await handler();

            expect(ErrorLogger.error).toHaveBeenCalledWith(
                'InvalidToken',
                'Failed to generate OAuth URL, falling back to reload'
            );
        });

        it('should log error when exception occurs', async () => {
            const mockError = new Error('Unexpected error');
            mockGenerateOAuthURL.mockRejectedValue(mockError);

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler
            await handler();

            expect(ErrorLogger.error).toHaveBeenCalledWith(
                'InvalidToken',
                'Error handling invalid token',
                mockError
            );
        });
    });

    describe('Multiple Invalid Token Events', () => {
        it('should handle multiple sequential invalid token events', async () => {
            const mockOAuthURL = 'https://oauth.example.com/authorize';
            mockGenerateOAuthURL.mockResolvedValue(mockOAuthURL);

            renderHook(() => useInvalidTokenHandler());

            // Get the registered handler
            const registerCall = (globalObserver.register as jest.Mock).mock.calls[0];
            const handler = registerCall[1];

            // Trigger the handler multiple times
            await handler();
            await handler();
            await handler();

            expect(mockGenerateOAuthURL).toHaveBeenCalledTimes(3);
            expect(mockWindowLocationReplace).toHaveBeenCalledTimes(3);
        });
    });

    describe('Hook Lifecycle', () => {
        it('should not leak memory by properly cleaning up on unmount', () => {
            const { unmount } = renderHook(() => useInvalidTokenHandler());

            // Register should be called once
            expect(globalObserver.register).toHaveBeenCalledTimes(1);

            unmount();

            // Unregister should be called once
            expect(globalObserver.unregister).toHaveBeenCalledTimes(1);
        });

        it('should register new handler on remount', () => {
            const { unmount } = renderHook(() => useInvalidTokenHandler());

            expect(globalObserver.register).toHaveBeenCalledTimes(1);

            unmount();

            // Mount a new instance
            renderHook(() => useInvalidTokenHandler());

            // Should register again after remount
            expect(globalObserver.register).toHaveBeenCalledTimes(2);
        });
    });
});
