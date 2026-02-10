import { BrowserRouter } from 'react-router-dom';
import { mockStore, StoreProvider } from '@/hooks/useStore';
import { mock_ws } from '@/utils/mock';
import { useDevice } from '@deriv-com/ui';
import { render, screen } from '@testing-library/react';
import MenuContent from '../menu-content';

jest.mock('@deriv-com/ui', () => ({
    ...jest.requireActual('@deriv-com/ui'),
    useDevice: jest.fn(() => ({ isDesktop: false })),
}));

// Updated tests to reflect white-labeling changes:
// - Removed Reports menu item
// - Menu now only shows theme toggle and logout button
describe('MenuContent Component', () => {
    const mock_store = mockStore(mock_ws as any);

    // Mock client as logged in to show logout button
    mock_store.client.is_logged_in = true;

    const mockOnLogout = jest.fn();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BrowserRouter>
            <StoreProvider mockStore={mock_store}>{children}</StoreProvider>
        </BrowserRouter>
    );

    beforeEach(() => {
        Object.defineProperty(window, 'matchMedia', {
            value: jest.fn(),
            writable: true,
        });
        mockOnLogout.mockClear();
    });

    it('renders MenuItem components correctly with theme toggle and logout', () => {
        render(<MenuContent onLogout={mockOnLogout} />, { wrapper });
        expect(screen.getByText(/Dark theme/)).toBeInTheDocument();
        expect(screen.getByText(/Log out/)).toBeInTheDocument();
    });

    it('adjusts text size for mobile devices', () => {
        render(<MenuContent onLogout={mockOnLogout} />, { wrapper });
        const text = screen.getByText(/Dark theme/);
        expect(text).toHaveClass('derivs-text__size--md');
    });

    it('adjusts text size for desktop devices', () => {
        (useDevice as jest.Mock).mockReturnValue({ isDesktop: true });
        render(<MenuContent onLogout={mockOnLogout} />, { wrapper });
        const text = screen.getByText(/Dark theme/);
        expect(text).toHaveClass('derivs-text__size--sm');
    });

    it('does not render theme toggle when disabled', () => {
        render(<MenuContent onLogout={mockOnLogout} enableThemeToggle={false} />, { wrapper });
        expect(screen.queryByText(/Dark theme/)).not.toBeInTheDocument();
        expect(screen.getByText(/Log out/)).toBeInTheDocument();
    });

    it('does not render logout button when user is not logged in', () => {
        const non_logged_in_store = mockStore(mock_ws as any);
        non_logged_in_store.client.is_logged_in = false;

        const nonLoggedInWrapper = ({ children }: { children: React.ReactNode }) => (
            <BrowserRouter>
                <StoreProvider mockStore={non_logged_in_store}>{children}</StoreProvider>
            </BrowserRouter>
        );

        render(<MenuContent enableThemeToggle={true} />, { wrapper: nonLoggedInWrapper });
        expect(screen.getByText(/Dark theme/)).toBeInTheDocument();
        expect(screen.queryByText(/Log out/)).not.toBeInTheDocument();
    });
});
