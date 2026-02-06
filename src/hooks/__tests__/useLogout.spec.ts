import { ErrorLogger } from '@/utils/error-logger';
import { renderHook, waitFor } from '@testing-library/react';
import { useLogout } from '../useLogout';

// Mock dependencies
jest.mock('@/hooks/useStore', () => ({
    useStore: jest.fn(),
}));

jest.mock('@/utils/error-logger', () => ({
    ErrorLogger: {
        error: jest.fn(),
    },
}));

// Import after mocking
import { useStore } from '@/hooks/useStore';

describe('useLogout', () => {
    let mockLogout: jest.Mock;
    let mockClient: { logout: jest.Mock };

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Setup mock logout function
        mockLogout = jest.fn();
        mockClient = {
            logout: mockLogout,
        };

        // Mock useStore to return our mock client
        (useStore as jest.Mock).mockReturnValue({
            client: mockClient,
        });

        // Mock localStorage and sessionStorage
        Storage.prototype.removeItem = jest.fn();
        Storage.prototype.clear = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Successful Logout', () => {
        it('should call client.logout() when handleLogout is invoked', async () => {
            mockLogout.mockResolvedValue(undefined);

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            await handleLogout();

            expect(mockLogout).toHaveBeenCalledTimes(1);
        });

        it('should not throw error on successful logout', async () => {
            mockLogout.mockResolvedValue(undefined);

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            await expect(handleLogout()).resolves.not.toThrow();
        });

        it('should not call ErrorLogger on successful logout', async () => {
            mockLogout.mockResolvedValue(undefined);

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            await handleLogout();

            expect(ErrorLogger.error).not.toHaveBeenCalled();
        });
    });

    describe('Logout Error Handling', () => {
        it('should log error when client.logout() fails', async () => {
            const mockError = new Error('Logout failed');
            mockLogout.mockRejectedValue(mockError);

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            await handleLogout();

            expect(ErrorLogger.error).toHaveBeenCalledWith('Logout', 'Logout failed', mockError);
        });

        it('should clear auth-related sessionStorage items on logout failure', async () => {
            const mockError = new Error('Logout failed');
            mockLogout.mockRejectedValue(mockError);

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            await handleLogout();

            await waitFor(() => {
                expect(sessionStorage.removeItem).toHaveBeenCalledWith('auth_info');
            });
        });

        it('should clear auth-related localStorage items on logout failure', async () => {
            const mockError = new Error('Logout failed');
            mockLogout.mockRejectedValue(mockError);

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            await handleLogout();

            await waitFor(() => {
                expect(localStorage.removeItem).toHaveBeenCalledWith('active_loginid');
                expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
                expect(localStorage.removeItem).toHaveBeenCalledWith('accountsList');
                expect(localStorage.removeItem).toHaveBeenCalledWith('clientAccounts');
                expect(localStorage.removeItem).toHaveBeenCalledWith('account_type');
            });
        });

        it('should not clear all storage on first attempt', async () => {
            const mockError = new Error('Logout failed');
            mockLogout.mockRejectedValue(mockError);

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            await handleLogout();

            await waitFor(() => {
                expect(sessionStorage.clear).not.toHaveBeenCalled();
                expect(localStorage.clear).not.toHaveBeenCalled();
            });
        });
    });

    describe('Storage Clearing Fallback', () => {
        it('should clear all storage if targeted clearing fails', async () => {
            const mockError = new Error('Logout failed');
            mockLogout.mockRejectedValue(mockError);

            // Mock removeItem to throw error
            const storageError = new Error('Storage error');
            Storage.prototype.removeItem = jest.fn().mockImplementation(() => {
                throw storageError;
            });

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            await handleLogout();

            await waitFor(() => {
                expect(ErrorLogger.error).toHaveBeenCalledWith(
                    'Logout',
                    'Failed to clear auth storage',
                    storageError
                );
                expect(sessionStorage.clear).toHaveBeenCalled();
                expect(localStorage.clear).toHaveBeenCalled();
            });
        });

        it('should log error if final storage clear also fails', async () => {
            const mockError = new Error('Logout failed');
            mockLogout.mockRejectedValue(mockError);

            // Mock both removeItem and clear to throw errors
            const storageError = new Error('Storage error');
            const finalError = new Error('Final storage error');
            Storage.prototype.removeItem = jest.fn().mockImplementation(() => {
                throw storageError;
            });
            Storage.prototype.clear = jest.fn().mockImplementation(() => {
                throw finalError;
            });

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            await handleLogout();

            await waitFor(() => {
                expect(ErrorLogger.error).toHaveBeenCalledWith(
                    'Logout',
                    'Failed to clear all storage',
                    finalError
                );
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle case when useStore returns null', async () => {
            (useStore as jest.Mock).mockReturnValue(null);

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            // Should not throw error
            await expect(handleLogout()).resolves.not.toThrow();
        });

        it('should handle case when useStore returns undefined', async () => {
            (useStore as jest.Mock).mockReturnValue(undefined);

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            // Should not throw error
            await expect(handleLogout()).resolves.not.toThrow();
        });

        it('should handle case when client is null', async () => {
            (useStore as jest.Mock).mockReturnValue({ client: null });

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            // Should not throw error
            await expect(handleLogout()).resolves.not.toThrow();
        });

        it('should handle case when client is undefined', async () => {
            (useStore as jest.Mock).mockReturnValue({ client: undefined });

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            // Should not throw error
            await expect(handleLogout()).resolves.not.toThrow();
        });
    });

    describe('Hook Stability', () => {
        it('should return the same function reference when client does not change', () => {
            const { result, rerender } = renderHook(() => useLogout());
            const firstRender = result.current;

            rerender();
            const secondRender = result.current;

            expect(firstRender).toBe(secondRender);
        });

        it('should return new function reference when client changes', () => {
            const { result, rerender } = renderHook(() => useLogout());
            const firstRender = result.current;

            // Change the client
            const newMockClient = { logout: jest.fn() };
            (useStore as jest.Mock).mockReturnValue({ client: newMockClient });

            rerender();
            const secondRender = result.current;

            expect(firstRender).not.toBe(secondRender);
        });
    });

    describe('Multiple Logout Calls', () => {
        it('should handle multiple sequential logout calls', async () => {
            mockLogout.mockResolvedValue(undefined);

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            await handleLogout();
            await handleLogout();
            await handleLogout();

            expect(mockLogout).toHaveBeenCalledTimes(3);
        });

        it('should handle concurrent logout calls', async () => {
            mockLogout.mockResolvedValue(undefined);

            const { result } = renderHook(() => useLogout());
            const handleLogout = result.current;

            await Promise.all([handleLogout(), handleLogout(), handleLogout()]);

            expect(mockLogout).toHaveBeenCalledTimes(3);
        });
    });
});
