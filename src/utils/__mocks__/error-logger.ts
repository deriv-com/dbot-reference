// Mock for ErrorLogger
export const ErrorLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    configure: jest.fn(),
    setErrorReportingService: jest.fn(),
    setUserContext: jest.fn(),
    clearUserContext: jest.fn(),
    getConfig: jest.fn(),
};

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
}
