import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, userEvent } from '../test-utils';
import GlobalToast from '../../components/GlobalToast';

describe('GlobalToast', () => {
  it('should not render when there are no toasts', () => {
    renderWithProviders(<GlobalToast />);
    
    // Should not have any toast elements
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should render toasts from the store', () => {
    renderWithProviders(<GlobalToast />, {
      preloadedState: {
        ui: {
          isLoading: false,
          loadingMessage: '',
          toasts: [
            { id: 1, message: 'Test success message', type: 'success', duration: 5000, createdAt: Date.now() },
          ],
          activeModal: null,
          modalData: null,
          sidebarOpen: true,
        },
        auth: { user: null, token: null, isAuthenticated: false, isLoading: false },
      },
    });
    
    expect(screen.getByText('Test success message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render multiple toasts', () => {
    renderWithProviders(<GlobalToast />, {
      preloadedState: {
        ui: {
          isLoading: false,
          loadingMessage: '',
          toasts: [
            { id: 1, message: 'First toast', type: 'success', duration: 5000, createdAt: Date.now() },
            { id: 2, message: 'Second toast', type: 'error', duration: 5000, createdAt: Date.now() },
          ],
          activeModal: null,
          modalData: null,
          sidebarOpen: true,
        },
        auth: { user: null, token: null, isAuthenticated: false, isLoading: false },
      },
    });
    
    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('should render toast with title', () => {
    renderWithProviders(<GlobalToast />, {
      preloadedState: {
        ui: {
          isLoading: false,
          loadingMessage: '',
          toasts: [
            { id: 1, message: 'Details here', type: 'info', title: 'Important', duration: 5000, createdAt: Date.now() },
          ],
          activeModal: null,
          modalData: null,
          sidebarOpen: true,
        },
        auth: { user: null, token: null, isAuthenticated: false, isLoading: false },
      },
    });
    
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('Details here')).toBeInTheDocument();
  });

  it('should dismiss toast when clicking X button', async () => {
    const user = userEvent.setup();
    
    const { store } = renderWithProviders(<GlobalToast />, {
      preloadedState: {
        ui: {
          isLoading: false,
          loadingMessage: '',
          toasts: [
            { id: 1, message: 'Dismissable toast', type: 'success', duration: 5000, createdAt: Date.now() },
          ],
          activeModal: null,
          modalData: null,
          sidebarOpen: true,
        },
        auth: { user: null, token: null, isAuthenticated: false, isLoading: false },
      },
    });
    
    // Find and click the dismiss button
    const dismissButton = screen.getByRole('button');
    await user.click(dismissButton);
    
    // Check that toast was removed from store
    await waitFor(() => {
      expect(store.getState().ui.toasts).toHaveLength(0);
    });
  });
});
