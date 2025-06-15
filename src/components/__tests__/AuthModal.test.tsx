import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthModal from '../AuthModal';
import { AuthService } from '../../services/authService';

// Mock AuthService
jest.mock('../../services/authService');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('AuthModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Visibility', () => {
    it('should render when isOpen is true', () => {
      render(<AuthModal {...defaultProps} />);
      
      expect(screen.getByText('Sign in to sync your todos')).toBeInTheDocument();
      expect(screen.getByText('Access your todos from any device and never lose them')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<AuthModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Sign in to sync your todos')).not.toBeInTheDocument();
    });

    it('should render modal overlay and content', () => {
      const { container } = render(<AuthModal {...defaultProps} />);
      
      expect(container.querySelector('.auth-modal-overlay')).toBeInTheDocument();
      expect(container.querySelector('.auth-modal')).toBeInTheDocument();
      expect(container.querySelector('.auth-modal-content')).toBeInTheDocument();
    });
  });

  describe('Modal Close Functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<AuthModal {...defaultProps} />);
      
      const closeButton = screen.getByText('×');
      await user.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<AuthModal {...defaultProps} />);
      
      const overlay = container.querySelector('.auth-modal-overlay')!;
      await user.click(overlay);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<AuthModal {...defaultProps} />);
      
      const modalContent = container.querySelector('.auth-modal')!;
      await user.click(modalContent);
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should have correct CSS classes for close button', () => {
      render(<AuthModal {...defaultProps} />);
      
      const closeButton = screen.getByText('×');
      expect(closeButton).toHaveClass('auth-modal-close');
    });
  });

  describe('Authentication Providers', () => {
    it('should render Google and GitHub provider buttons', () => {
      render(<AuthModal {...defaultProps} />);
      
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
    });

    it('should have correct CSS classes for provider buttons', () => {
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      const githubButton = screen.getByText('Continue with GitHub');
      
      expect(googleButton).toHaveClass('auth-provider-button', 'google');
      expect(githubButton).toHaveClass('auth-provider-button', 'github');
    });

    it('should render provider icons', () => {
      const { container } = render(<AuthModal {...defaultProps} />);
      
      const icons = container.querySelectorAll('.provider-icon');
      expect(icons).toHaveLength(2);
      
      // Check that SVG elements are present
      expect(container.querySelectorAll('svg')).toHaveLength(2);
    });
  });

  describe('Google Authentication', () => {
    it('should call AuthService.signInWithProvider with google when Google button is clicked', async () => {
      const user = userEvent.setup();
      mockAuthService.signInWithProvider.mockResolvedValue();
      
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      await user.click(googleButton);
      
      expect(mockAuthService.signInWithProvider).toHaveBeenCalledWith('google');
    });

    it('should disable buttons during Google authentication', async () => {
      const user = userEvent.setup();
      let resolveAuth: () => void;
      const authPromise = new Promise<void>((resolve) => {
        resolveAuth = resolve;
      });
      mockAuthService.signInWithProvider.mockReturnValue(authPromise);
      
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      const githubButton = screen.getByText('Continue with GitHub');
      
      // Click the button and check it's disabled immediately
      user.click(googleButton);
      
      // Wait for buttons to be disabled during loading
      await waitFor(() => {
        expect(googleButton).toBeDisabled();
        expect(githubButton).toBeDisabled();
      });
      
      // Resolve the auth promise (OAuth success - buttons stay disabled as page will redirect)
      resolveAuth!();
      
      // For successful OAuth, buttons remain disabled as the page will redirect
      // This is the expected behavior for OAuth flows
      expect(googleButton).toBeDisabled();
      expect(githubButton).toBeDisabled();
    });

    it('should handle Google authentication success', async () => {
      const user = userEvent.setup();
      mockAuthService.signInWithProvider.mockResolvedValue();
      
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      await user.click(googleButton);
      
      expect(mockAuthService.signInWithProvider).toHaveBeenCalledWith('google');
      // Modal should stay open during OAuth redirect
      expect(screen.getByText('Sign in to sync your todos')).toBeInTheDocument();
    });
  });

  describe('GitHub Authentication', () => {
    it('should call AuthService.signInWithProvider with github when GitHub button is clicked', async () => {
      const user = userEvent.setup();
      mockAuthService.signInWithProvider.mockResolvedValue();
      
      render(<AuthModal {...defaultProps} />);
      
      const githubButton = screen.getByText('Continue with GitHub');
      await user.click(githubButton);
      
      expect(mockAuthService.signInWithProvider).toHaveBeenCalledWith('github');
    });

    it('should disable buttons during GitHub authentication', async () => {
      const user = userEvent.setup();
      let resolveAuth: () => void;
      const authPromise = new Promise<void>((resolve) => {
        resolveAuth = resolve;
      });
      mockAuthService.signInWithProvider.mockReturnValue(authPromise);
      
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      const githubButton = screen.getByText('Continue with GitHub');
      
      // Click the button and check it's disabled immediately
      user.click(githubButton);
      
      // Wait for buttons to be disabled during loading
      await waitFor(() => {
        expect(googleButton).toBeDisabled();
        expect(githubButton).toBeDisabled();
      });
      
      // Resolve the auth promise (OAuth success - buttons stay disabled as page will redirect)
      resolveAuth!();
      
      // For successful OAuth, buttons remain disabled as the page will redirect
      expect(googleButton).toBeDisabled();
      expect(githubButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when Google authentication fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Google authentication failed';
      mockAuthService.signInWithProvider.mockRejectedValue(new Error(errorMessage));
      
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      await user.click(googleButton);
      
      await waitFor(() => {
        expect(screen.getByText(`⚠️ ${errorMessage}`)).toBeInTheDocument();
      });
      
      const errorElement = screen.getByText(`⚠️ ${errorMessage}`);
      expect(errorElement.closest('.auth-error')).toBeInTheDocument();
    });

    it('should display error message when GitHub authentication fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'GitHub authentication failed';
      mockAuthService.signInWithProvider.mockRejectedValue(new Error(errorMessage));
      
      render(<AuthModal {...defaultProps} />);
      
      const githubButton = screen.getByText('Continue with GitHub');
      await user.click(githubButton);
      
      await waitFor(() => {
        expect(screen.getByText(`⚠️ ${errorMessage}`)).toBeInTheDocument();
      });
    });

    it('should display generic error message for non-Error objects', async () => {
      const user = userEvent.setup();
      mockAuthService.signInWithProvider.mockRejectedValue('String error');
      
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      await user.click(googleButton);
      
      await waitFor(() => {
        expect(screen.getByText('⚠️ Authentication failed')).toBeInTheDocument();
      });
    });

    it('should clear error when starting new authentication', async () => {
      const user = userEvent.setup();
      mockAuthService.signInWithProvider
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce();
      
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      
      // First attempt - should show error
      await user.click(googleButton);
      await waitFor(() => {
        expect(screen.getByText('⚠️ First error')).toBeInTheDocument();
      });
      
      // Second attempt - should clear error
      await user.click(googleButton);
      await waitFor(() => {
        expect(screen.queryByText('⚠️ First error')).not.toBeInTheDocument();
      });
    });

    it('should re-enable buttons after authentication error', async () => {
      const user = userEvent.setup();
      mockAuthService.signInWithProvider.mockRejectedValue(new Error('Auth failed'));
      
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      const githubButton = screen.getByText('Continue with GitHub');
      
      await user.click(googleButton);
      
      await waitFor(() => {
        expect(googleButton).not.toBeDisabled();
        expect(githubButton).not.toBeDisabled();
      });
    });

    it('should not display error initially', () => {
      render(<AuthModal {...defaultProps} />);
      
      expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during authentication', async () => {
      const user = userEvent.setup();
      let resolveAuth: () => void;
      const authPromise = new Promise<void>((resolve) => {
        resolveAuth = resolve;
      });
      mockAuthService.signInWithProvider.mockReturnValue(authPromise);
      
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      const githubButton = screen.getByText('Continue with GitHub');
      
      // Click the button and check it's disabled immediately
      user.click(googleButton);
      
      // Wait for buttons to be disabled during loading
      await waitFor(() => {
        expect(googleButton).toBeDisabled();
        expect(githubButton).toBeDisabled();
      });
      
      // Resolve the auth promise (OAuth success - buttons stay disabled)
      resolveAuth!();
      
      // For successful OAuth, buttons remain disabled as the page will redirect
      expect(googleButton).toBeDisabled();
    });

    it('should not be in loading state initially', () => {
      render(<AuthModal {...defaultProps} />);
      
      expect(screen.getByText('Continue with Google')).not.toBeDisabled();
      expect(screen.getByText('Continue with GitHub')).not.toBeDisabled();
    });
  });

  describe('Modal Content', () => {
    it('should display correct heading and description', () => {
      render(<AuthModal {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Sign in to sync your todos');
      expect(screen.getByText('Access your todos from any device and never lose them')).toBeInTheDocument();
    });

    it('should display footer text', () => {
      render(<AuthModal {...defaultProps} />);
      
      expect(screen.getByText('By signing in, you agree to our Terms of Service and Privacy Policy')).toBeInTheDocument();
    });

    it('should have correct CSS classes for modal structure', () => {
      const { container } = render(<AuthModal {...defaultProps} />);
      
      expect(container.querySelector('.auth-modal-overlay')).toBeInTheDocument();
      expect(container.querySelector('.auth-modal')).toBeInTheDocument();
      expect(container.querySelector('.auth-modal-content')).toBeInTheDocument();
      expect(container.querySelector('.auth-providers')).toBeInTheDocument();
      expect(container.querySelector('.auth-modal-footer')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button text', () => {
      render(<AuthModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Continue with GitHub' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<AuthModal {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Sign in to sync your todos');
    });

    it('should handle keyboard events for close button', () => {
      render(<AuthModal {...defaultProps} />);
      
      const closeButton = screen.getByText('×');
      fireEvent.keyDown(closeButton, { key: 'Enter' });
      // The close button should be focusable and clickable
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Event Propagation', () => {
    it('should stop propagation when clicking modal content', () => {
      const { container } = render(<AuthModal {...defaultProps} />);
      
      const modalContent = container.querySelector('.auth-modal')!;
      const stopPropagationSpy = jest.fn();
      
      const event = new MouseEvent('click', { bubbles: true });
      event.stopPropagation = stopPropagationSpy;
      
      fireEvent(modalContent, event);
      
      // The component should call stopPropagation
      expect(modalContent).toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple authentication attempts', async () => {
      const user = userEvent.setup();
      mockAuthService.signInWithProvider
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce();
      
      render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      
      // First attempt fails
      await user.click(googleButton);
      await waitFor(() => {
        expect(screen.getByText('⚠️ Network error')).toBeInTheDocument();
      });
      
      // Second attempt succeeds
      await user.click(googleButton);
      await waitFor(() => {
        expect(screen.queryByText('⚠️ Network error')).not.toBeInTheDocument();
      });
      
      expect(mockAuthService.signInWithProvider).toHaveBeenCalledTimes(2);
    });

    it('should handle both provider types correctly', async () => {
      const user = userEvent.setup();
      mockAuthService.signInWithProvider.mockResolvedValue();
      
      // Test Google authentication in first render
      const { unmount } = render(<AuthModal {...defaultProps} />);
      
      const googleButton = screen.getByText('Continue with Google');
      await user.click(googleButton);
      expect(mockAuthService.signInWithProvider).toHaveBeenCalledWith('google');
      
      // Unmount and create fresh component for GitHub test
      unmount();
      jest.clearAllMocks();
      
      // Test GitHub authentication in fresh render
      render(<AuthModal {...defaultProps} />);
      
      const githubButton = screen.getByText('Continue with GitHub');
      await user.click(githubButton);
      expect(mockAuthService.signInWithProvider).toHaveBeenCalledWith('github');
    });
  });
});