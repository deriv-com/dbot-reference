import { MAX_MOBILE_WIDTH, STORED_ITEM_NOT_FOUND, TFormStrategy } from '../constants';
import {
    getAccountType,
    getDeviceType,
    getQsActiveTabString,
    getRsDropdownTextFromLocalStorage,
    getRsStrategyType,
    getStrategyType,
    getTradeParameterData,
    isDemoAccount,
    isVirtualAccount,
    LOAD_MODAL_TABS,
    rudderstack_text_error,
} from '../utils';

// Mock localStorage
const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
    };
})();

// Mock STRATEGIES function
jest.mock('../../pages/bot-builder/quick-strategy/config', () => ({
    STRATEGIES: jest.fn(() => ({
        test_strategy: { rs_strategy_name: 'Test Strategy' },
        another_strategy: { rs_strategy_name: 'Another Strategy' },
    })),
}));

// Mock DOMParser
const mockDOMParser = {
    parseFromString: jest.fn(),
};

// Mock window object
const mockWindow = {
    innerWidth: 1024,
};

describe('Analytics Utils', () => {
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        mockLocalStorage.clear();

        // Setup global mocks
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
        });

        Object.defineProperty(global, 'DOMParser', {
            value: jest.fn(() => mockDOMParser),
            writable: true,
        });

        Object.defineProperty(window, 'innerWidth', {
            value: mockWindow.innerWidth,
            writable: true,
        });
    });

    describe('getRsDropdownTextFromLocalStorage', () => {
        it('should return parsed JSON from localStorage', () => {
            const testData = { symbol: 'EUR/USD', tradetype: 'CALL' };
            mockLocalStorage.setItem('qs-analytics', JSON.stringify(testData));

            const result = getRsDropdownTextFromLocalStorage();

            expect(result).toEqual(testData);
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith('qs-analytics');
        });

        it('should return empty object when localStorage item is null', () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const result = getRsDropdownTextFromLocalStorage();

            expect(result).toEqual({});
        });

        it('should return empty object and log error when JSON parsing fails', () => {
            mockLocalStorage.getItem.mockReturnValue('invalid-json');
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = getRsDropdownTextFromLocalStorage();

            expect(result).toEqual({});
            expect(consoleSpy).toHaveBeenCalledWith(rudderstack_text_error);

            consoleSpy.mockRestore();
        });

        it('should handle localStorage throwing an error', () => {
            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error('localStorage not available');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = getRsDropdownTextFromLocalStorage();

            expect(result).toEqual({});
            expect(consoleSpy).toHaveBeenCalledWith(rudderstack_text_error);

            consoleSpy.mockRestore();
        });
    });

    describe('getRsStrategyType', () => {
        it('should return strategy name for valid strategy', () => {
            const result = getRsStrategyType('test_strategy');
            expect(result).toBe('Test Strategy');
        });

        it('should return undefined for invalid strategy', () => {
            const result = getRsStrategyType('invalid_strategy');
            expect(result).toBeUndefined();
        });

        it('should handle empty string', () => {
            const result = getRsStrategyType('');
            expect(result).toBeUndefined();
        });
    });

    describe('getQsActiveTabString', () => {
        it('should return "trade parameters" for TRADE_PARAMETERS tab', () => {
            const result = getQsActiveTabString('TRADE_PARAMETERS');
            expect(result).toBe('trade parameters');
        });

        it('should return "learn more" for any other tab', () => {
            expect(getQsActiveTabString('LEARN_MORE')).toBe('learn more');
            expect(getQsActiveTabString('OTHER_TAB')).toBe('learn more');
            expect(getQsActiveTabString('')).toBe('learn more');
        });
    });

    describe('getTradeParameterData', () => {
        it('should return trade parameter data with stored texts when available', () => {
            const mockStoredTexts = {
                symbol: 'Stored Symbol',
                tradetype: 'Stored Trade Type',
                type: 'Stored Type',
                stake: 'Stored Stake',
            };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStoredTexts));

            const formStrategy = {
                form_values: {
                    symbol: 'Form Symbol',
                    tradetype: 'Form Trade Type',
                    type: 'Form Type',
                    stake: 'Form Stake',
                },
                selected_strategy: 'test_strategy',
            };

            const result = getTradeParameterData(formStrategy);

            expect(result).toEqual({
                asset_type: 'Stored Symbol',
                trade_type: 'Stored Trade Type',
                purchase_condition: 'Stored Type',
                initial_stake: 'Stored Stake',
            });
        });

        it('should return form values when stored texts are not found', () => {
            const mockStoredTexts = {
                symbol: STORED_ITEM_NOT_FOUND,
                tradetype: STORED_ITEM_NOT_FOUND,
                type: STORED_ITEM_NOT_FOUND,
                stake: STORED_ITEM_NOT_FOUND,
            };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStoredTexts));

            const formStrategy = {
                form_values: {
                    symbol: 'Form Symbol',
                    tradetype: 'Form Trade Type',
                    type: 'Form Type',
                    stake: 'Form Stake',
                },
                selected_strategy: 'test_strategy',
            };

            const result = getTradeParameterData(formStrategy);

            expect(result).toEqual({
                asset_type: 'Form Symbol',
                trade_type: 'Form Trade Type',
                purchase_condition: 'Form Type',
                initial_stake: 'Form Stake',
            });
        });

        it('should return form values when stored texts are empty', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({}));

            const formStrategy = {
                form_values: {
                    symbol: 'Form Symbol',
                    tradetype: 'Form Trade Type',
                    type: 'Form Type',
                    stake: 'Form Stake',
                },
                selected_strategy: 'test_strategy',
            };

            const result = getTradeParameterData(formStrategy);

            expect(result).toEqual({
                asset_type: 'Form Symbol',
                trade_type: 'Form Trade Type',
                purchase_condition: 'Form Type',
                initial_stake: 'Form Stake',
            });
        });

        it('should return undefined when form_values is not provided', () => {
            const formStrategy = { selected_strategy: 'test_strategy' };
            const result = getTradeParameterData(formStrategy as TFormStrategy);
            expect(result).toBeUndefined();
        });
    });

    describe('getStrategyType', () => {
        it('should return "new" for dbot XML with is_dbot="true"', () => {
            const mockXmlDoc = {
                getElementsByTagName: jest.fn(() => [{}]),
                documentElement: {
                    getAttribute: jest.fn(() => 'true'),
                },
            };
            mockDOMParser.parseFromString.mockReturnValue(mockXmlDoc);

            const result = getStrategyType('<xml is_dbot="true"></xml>');

            expect(result).toBe('new');
            expect(mockDOMParser.parseFromString).toHaveBeenCalledWith('<xml is_dbot="true"></xml>', 'application/xml');
        });

        it('should return "old" for XML with is_dbot="false"', () => {
            const mockXmlDoc = {
                getElementsByTagName: jest.fn(() => [{}]),
                documentElement: {
                    getAttribute: jest.fn(() => 'false'),
                },
            };
            mockDOMParser.parseFromString.mockReturnValue(mockXmlDoc);

            const result = getStrategyType('<xml is_dbot="false"></xml>');

            expect(result).toBe('old');
        });

        it('should return "old" for XML without xml tags', () => {
            const mockXmlDoc = {
                getElementsByTagName: jest.fn(() => []),
            };
            mockDOMParser.parseFromString.mockReturnValue(mockXmlDoc);

            const result = getStrategyType('<div></div>');

            expect(result).toBe('old');
        });

        it('should return "old" when parsing throws an error', () => {
            mockDOMParser.parseFromString.mockImplementation(() => {
                throw new Error('Parsing error');
            });

            const result = getStrategyType('invalid xml');

            expect(result).toBe('old');
        });

        it('should handle ArrayBuffer input', () => {
            const mockXmlDoc = {
                getElementsByTagName: jest.fn(() => [{}]),
                documentElement: {
                    getAttribute: jest.fn(() => 'true'),
                },
            };
            mockDOMParser.parseFromString.mockReturnValue(mockXmlDoc);

            const buffer = new ArrayBuffer(8);
            const result = getStrategyType(buffer);

            expect(result).toBe('new');
            expect(mockDOMParser.parseFromString).toHaveBeenCalledWith('[object ArrayBuffer]', 'application/xml');
        });
    });

    describe('isDemoAccount', () => {
        it('should return true for loginid starting with VRTC (classic demo)', () => {
            expect(isDemoAccount('VRTC12345')).toBe(true);
            expect(isDemoAccount('VRTC99999')).toBe(true);
        });

        it('should return true for loginid starting with VRW (demo wallet)', () => {
            expect(isDemoAccount('VRW12345')).toBe(true);
            expect(isDemoAccount('VRW99999')).toBe(true);
        });

        it('should return true for loginid starting with DEM', () => {
            expect(isDemoAccount('DEM12345')).toBe(true);
            expect(isDemoAccount('DEM99999')).toBe(true);
        });

        it('should return false for loginid containing but not starting with DEM', () => {
            expect(isDemoAccount('CRDEM123')).toBe(false);
            expect(isDemoAccount('CR123DEM')).toBe(false);
        });

        it('should return false for real account loginids', () => {
            expect(isDemoAccount('CR12345')).toBe(false);
            expect(isDemoAccount('MF12345')).toBe(false);
            expect(isDemoAccount('MLT12345')).toBe(false);
            expect(isDemoAccount('MX12345')).toBe(false);
            expect(isDemoAccount('ROT90002094')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isDemoAccount('')).toBe(false);
        });

        it('should handle case sensitivity correctly', () => {
            expect(isDemoAccount('vrtc12345')).toBe(false); // lowercase should not match
            expect(isDemoAccount('vrw12345')).toBe(false); // lowercase should not match
            expect(isDemoAccount('dem12345')).toBe(false); // lowercase should not match
        });
    });

    describe('getAccountType', () => {
        it('should return "demo" for demo loginid when loginid is provided', () => {
            const result = getAccountType('VRTC12345');
            expect(result).toBe('demo');
        });

        it('should return "real" for real loginid when loginid is provided', () => {
            const result = getAccountType('CR12345');
            expect(result).toBe('real');
        });

        it('should return "demo" for loginid containing DEM', () => {
            const result = getAccountType('DEM12345');
            expect(result).toBe('demo');
        });

        it('should return public when no loginid provided', () => {
            mockLocalStorage.getItem.mockReturnValue('demo');

            const result = getAccountType();

            expect(result).toBe('public');
        });

        it('should return public when localStorage returns null and no loginid', () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const result = getAccountType();

            expect(result).toBe('public');
        });

        it('should return public when localStorage throws an error and no loginid', () => {
            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error('localStorage not available');
            });

            const result = getAccountType();

            expect(result).toBe('public');
        });

        it('should return public when localStorage returns empty string and no loginid', () => {
            mockLocalStorage.getItem.mockReturnValue('');

            const result = getAccountType();

            expect(result).toBe('public');
        });

        it('should prioritize loginid over localStorage', () => {
            mockLocalStorage.getItem.mockReturnValue('real');

            const result = getAccountType('VRTC12345');

            expect(result).toBe('demo');
        });
    });

    describe('isVirtualAccount', () => {
        it('should return true when loginid is VRTC demo account (loginid takes precedence)', () => {
            mockLocalStorage.getItem.mockReturnValue('real');
            expect(isVirtualAccount('VRTC12345')).toBe(true);
        });

        it('should return true when loginid is VRW demo account (loginid takes precedence)', () => {
            mockLocalStorage.getItem.mockReturnValue('real');
            expect(isVirtualAccount('VRW12345')).toBe(true);
        });

        it('should return true when loginid starts with DEM (loginid takes precedence)', () => {
            mockLocalStorage.getItem.mockReturnValue('real');
            expect(isVirtualAccount('DEM12345')).toBe(true);
        });

        it('should return false when loginid is real account (loginid takes precedence over localStorage)', () => {
            mockLocalStorage.getItem.mockReturnValue('demo');
            expect(isVirtualAccount('CR12345')).toBe(false);
        });

        it('should return true when localStorage has demo and no loginid provided', () => {
            mockLocalStorage.getItem.mockReturnValue('demo');
            expect(isVirtualAccount('')).toBe(true);
        });

        it('should return false when localStorage has real and no loginid provided', () => {
            mockLocalStorage.getItem.mockReturnValue('real');
            expect(isVirtualAccount('')).toBe(false);
        });

        it('should return false when localStorage is null and no loginid provided', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            expect(isVirtualAccount('')).toBe(false);
        });

        it('should return false when localStorage throws error and no loginid', () => {
            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error('localStorage not available');
            });
            expect(isVirtualAccount('')).toBe(false);
        });

        it('should prioritize loginid over localStorage in all cases', () => {
            // Demo loginid with real localStorage
            mockLocalStorage.getItem.mockReturnValue('real');
            expect(isVirtualAccount('VRTC12345')).toBe(true);

            // Real loginid with demo localStorage
            mockLocalStorage.getItem.mockReturnValue('demo');
            expect(isVirtualAccount('CR12345')).toBe(false);
        });
    });

    describe('getDeviceType', () => {
        it('should return "mobile" when window width is less than or equal to MAX_MOBILE_WIDTH', () => {
            Object.defineProperty(window, 'innerWidth', {
                value: MAX_MOBILE_WIDTH,
                writable: true,
            });

            const result = getDeviceType();

            expect(result).toBe('mobile');
        });

        it('should return "mobile" when window width is less than MAX_MOBILE_WIDTH', () => {
            Object.defineProperty(window, 'innerWidth', {
                value: MAX_MOBILE_WIDTH - 1,
                writable: true,
            });

            const result = getDeviceType();

            expect(result).toBe('mobile');
        });

        it('should return "desktop" when window width is greater than MAX_MOBILE_WIDTH', () => {
            Object.defineProperty(window, 'innerWidth', {
                value: MAX_MOBILE_WIDTH + 1,
                writable: true,
            });

            const result = getDeviceType();

            expect(result).toBe('desktop');
        });

        it('should return "desktop" when window is undefined (SSR)', () => {
            const originalWindow = global.window;
            delete (global as unknown as { window: unknown }).window;

            const result = getDeviceType();

            expect(result).toBe('desktop');

            global.window = originalWindow;
        });
    });

    describe('LOAD_MODAL_TABS', () => {
        it('should contain expected tab values', () => {
            expect(LOAD_MODAL_TABS).toEqual(['recent', 'local', 'google drive']);
        });
    });
});
