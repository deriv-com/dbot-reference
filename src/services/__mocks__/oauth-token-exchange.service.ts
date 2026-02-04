// Mock for OAuthTokenExchangeService
export const OAuthTokenExchangeService = {
    exchangeCodeForToken: jest.fn(),
    getAuthInfo: jest.fn(),
    clearAuthInfo: jest.fn(),
    isAuthenticated: jest.fn(),
    getAccessToken: jest.fn(),
    refreshAccessToken: jest.fn(),
};
