import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Endpoint from '..';

const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
    value: {
        reload: mockReload,
        hostname: 'bot.deriv.com', // Mock production environment for consistent tests
    },
    writable: true,
});

describe('<Endpoint />', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should render the endpoint component', () => {
        render(<Endpoint />);

        expect(screen.getByText('Change API endpoint')).toBeInTheDocument();
        expect(screen.getByText('Server')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Reset to original settings' })).toBeInTheDocument();
    });

    it('should handle form submission', async () => {
        render(<Endpoint />);

        const serverUrlInput = screen.getByTestId('dt_endpoint_server_url_input');
        const submitButton = screen.getByRole('button', { name: 'Submit' });

        await userEvent.clear(serverUrlInput);
        await userEvent.type(serverUrlInput, 'qa10.deriv.dev');
        await userEvent.click(submitButton);

        expect(localStorage.getItem('config.server_url') ?? '').toBe('qa10.deriv.dev');
    });

    it('should reset to default server URL when reset button is clicked', async () => {
        render(<Endpoint />);

        const serverUrlInput = screen.getByTestId('dt_endpoint_server_url_input');
        const resetButton = screen.getByRole('button', { name: 'Reset to original settings' });

        // Set a custom server URL and save it
        await userEvent.clear(serverUrlInput);
        await userEvent.type(serverUrlInput, 'qa10.deriv.dev');
        const submitButton = screen.getByRole('button', { name: 'Submit' });
        await userEvent.click(submitButton);

        // Verify it was saved
        expect(localStorage.getItem('config.server_url')).toBe('qa10.deriv.dev');

        // Click reset button
        await userEvent.click(resetButton);

        // Should clear localStorage and reset to default
        expect(localStorage.getItem('config.server_url')).toBeNull();
        // The input should now show the default server (production server since hostname is mocked as bot.deriv.com)
        expect(serverUrlInput).toHaveValue('api-core.deriv.com/options/v1/ws');
    });
});
