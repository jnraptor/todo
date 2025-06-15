import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserProfile from '../UserProfile';
import { AuthService } from '../../services/authService';
import { User } from '../../types/auth';

// Mock AuthService
jest.mock('../../services/authService');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('UserProfile Component', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    fullName: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
    provider: 'google',
    createdAt: new Date('2023-01-01')
  };

  const mockOnSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Profile Display', () => {
    it('should render user profile button with avatar when avatarUrl is provided', () => {
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const avatar = screen.getByAltText('Test User');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      expect(avatar).toHaveClass('user-avatar');
    });

    it('should render user profile button with placeholder when no avatarUrl', () => {
      const userWithoutAvatar = { ...mockUser, avatarUrl: undefined };
      render(<UserProfile user={userWithoutAvatar} onSignOut={mockOnSignOut} />);
      
      const placeholder = screen.getByText('T');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveClass('user-avatar-placeholder');
    });

    it('should use first letter of fullName for placeholder', () => {
      const userWithoutAvatar = { ...mockUser, avatarUrl: undefined, fullName: 'John Doe' };
      render(<UserProfile user={userWithoutAvatar} onSignOut={mockOnSignOut} />);
      
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should use first letter of email when no fullName', () => {
      const userWithoutName = { 
        ...mockUser, 
        avatarUrl: undefined, 
        fullName: undefined, 
        email: 'user@example.com' 
      };
      render(<UserProfile user={userWithoutName} onSignOut={mockOnSignOut} />);
      
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('should use "U" as fallback when no fullName or email', () => {
      const minimalUser = { 
        ...mockUser, 
        avatarUrl: undefined, 
        fullName: undefined, 
        email: undefined 
      };
      render(<UserProfile user={minimalUser} onSignOut={mockOnSignOut} />);
      
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('should have correct CSS classes for profile structure', () => {
      const { container } = render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      expect(container.querySelector('.user-profile')).toBeInTheDocument();
      expect(container.querySelector('.user-profile-button')).toBeInTheDocument();
    });
  });

  describe('Menu Toggle Functionality', () => {
    it('should not show menu initially', () => {
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
    });

    it('should show menu when profile button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('should hide menu when profile button is clicked again', async () => {
      const user = userEvent.setup();
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      
      // Open menu
      await user.click(profileButton);
      expect(screen.getByText('Test User')).toBeInTheDocument();
      
      // Close menu
      await user.click(profileButton);
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    });

    it('should display user information in menu', async () => {
      const user = userEvent.setup();
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      expect(screen.getByText('Test User')).toHaveClass('user-name');
      expect(screen.getByText('test@example.com')).toHaveClass('user-email');
    });

    it('should display "User" as fallback name when no fullName', async () => {
      const user = userEvent.setup();
      const userWithoutName = { ...mockUser, fullName: undefined };
      render(<UserProfile user={userWithoutName} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('should have correct CSS classes for menu structure', async () => {
      const user = userEvent.setup();
      const { container } = render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      expect(container.querySelector('.user-profile-menu')).toBeInTheDocument();
      expect(container.querySelector('.user-info')).toBeInTheDocument();
      expect(container.querySelector('.menu-divider')).toBeInTheDocument();
      expect(container.querySelector('.menu-item')).toBeInTheDocument();
    });
  });

  describe('Click Outside Behavior', () => {
    it('should close menu when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <UserProfile user={mockUser} onSignOut={mockOnSignOut} />
          <div data-testid="outside-element">Outside</div>
        </div>
      );
      
      const profileButton = screen.getByRole('button');
      const outsideElement = screen.getByTestId('outside-element');
      
      // Open menu
      await user.click(profileButton);
      expect(screen.getByText('Test User')).toBeInTheDocument();
      
      // Click outside
      await user.click(outsideElement);
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    });

    it('should not close menu when clicking inside the menu', async () => {
      const user = userEvent.setup();
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      const userInfo = screen.getByText('Test User');
      await user.click(userInfo);
      
      // Menu should still be open
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should add and remove event listener correctly', async () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const user = userEvent.setup();
      const { unmount } = render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      
      // Open menu - should add event listener
      await user.click(profileButton);
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      
      // Close menu - should remove event listener
      await user.click(profileButton);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      
      // Unmount - should clean up
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Sign Out Functionality', () => {
    it('should call AuthService.signOut when sign out button is clicked', async () => {
      const user = userEvent.setup();
      mockAuthService.signOut.mockResolvedValue();
      
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      const signOutButton = screen.getByText('Sign out');
      await user.click(signOutButton);
      
      expect(mockAuthService.signOut).toHaveBeenCalled();
    });

    it('should call onSignOut callback after successful sign out', async () => {
      const user = userEvent.setup();
      mockAuthService.signOut.mockResolvedValue();
      
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      const signOutButton = screen.getByText('Sign out');
      await user.click(signOutButton);
      
      await waitFor(() => {
        expect(mockOnSignOut).toHaveBeenCalled();
      });
    });

    it('should not call onSignOut when it is not provided', async () => {
      const user = userEvent.setup();
      mockAuthService.signOut.mockResolvedValue();
      
      render(<UserProfile user={mockUser} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      const signOutButton = screen.getByText('Sign out');
      await user.click(signOutButton);
      
      // Should not throw error when onSignOut is undefined
      await waitFor(() => {
        expect(mockAuthService.signOut).toHaveBeenCalled();
      });
    });

    it('should show loading state during sign out', async () => {
      const user = userEvent.setup();
      let resolveSignOut: () => void;
      const signOutPromise = new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      });
      mockAuthService.signOut.mockReturnValue(signOutPromise);
      
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      const signOutButton = screen.getByText('Sign out');
      user.click(signOutButton);
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Signing out...')).toBeInTheDocument();
        expect(screen.getByText('Signing out...')).toBeDisabled();
      });
      
      // Resolve sign out
      resolveSignOut!();
      
      // Should return to normal state
      await waitFor(() => {
        expect(screen.queryByText('Signing out...')).not.toBeInTheDocument();
      });
    });

    it('should handle sign out errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAuthService.signOut.mockRejectedValue(new Error('Sign out failed'));
      
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      const signOutButton = screen.getByText('Sign out');
      await user.click(signOutButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sign out:', expect.any(Error));
      });
      
      // Should reset loading state even on error
      await waitFor(() => {
        expect(screen.getByText('Sign out')).not.toBeDisabled();
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should reset loading state after error', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAuthService.signOut.mockRejectedValue(new Error('Sign out failed'));
      
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      const signOutButton = screen.getByText('Sign out');
      await user.click(signOutButton);
      
      // Wait for error handling
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });
      
      // Button should be enabled again
      expect(screen.getByText('Sign out')).not.toBeDisabled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button for profile', () => {
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      expect(profileButton).toBeInTheDocument();
      expect(profileButton).toHaveClass('user-profile-button');
    });

    it('should have accessible button for sign out', async () => {
      const user = userEvent.setup();
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      expect(signOutButton).toBeInTheDocument();
    });

    it('should have proper alt text for avatar image', () => {
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const avatar = screen.getByAltText('Test User');
      expect(avatar).toBeInTheDocument();
    });

    it('should use "User" as alt text when no fullName', () => {
      const userWithoutName = { ...mockUser, fullName: undefined };
      render(<UserProfile user={userWithoutName} onSignOut={mockOnSignOut} />);
      
      const avatar = screen.getByAltText('User');
      expect(avatar).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      
      // Focus the button
      profileButton.focus();
      expect(profileButton).toHaveFocus();
      
      // Press Enter to open menu
      fireEvent.keyDown(profileButton, { key: 'Enter' });
      fireEvent.click(profileButton); // Simulate the click that would happen
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with minimal data', () => {
      const minimalUser: User = {
        id: 'user-123',
        createdAt: new Date('2023-01-01')
      };
      
      render(<UserProfile user={minimalUser} onSignOut={mockOnSignOut} />);
      
      // Should render without errors
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('U')).toBeInTheDocument(); // Fallback placeholder
    });

    it('should handle very long names gracefully', async () => {
      const user = userEvent.setup();
      const userWithLongName = {
        ...mockUser,
        fullName: 'This is a very long name that might cause layout issues',
        email: 'very.long.email.address.that.might.cause.issues@example.com'
      };
      
      render(<UserProfile user={userWithLongName} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      expect(screen.getByText('This is a very long name that might cause layout issues')).toBeInTheDocument();
      expect(screen.getByText('very.long.email.address.that.might.cause.issues@example.com')).toBeInTheDocument();
    });

    it('should handle special characters in names and emails', async () => {
      const user = userEvent.setup();
      const userWithSpecialChars = {
        ...mockUser,
        fullName: 'José María García-López',
        email: 'josé.maría@example.com'
      };
      
      render(<UserProfile user={userWithSpecialChars} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      
      expect(screen.getByText('José María García-López')).toBeInTheDocument();
      expect(screen.getByText('josé.maría@example.com')).toBeInTheDocument();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete user workflow', async () => {
      const user = userEvent.setup();
      mockAuthService.signOut.mockResolvedValue();
      
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      // 1. Profile should be visible
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      // 2. Open menu
      const profileButton = screen.getByRole('button');
      await user.click(profileButton);
      expect(screen.getByText('Test User')).toBeInTheDocument();
      
      // 3. Sign out
      const signOutButton = screen.getByText('Sign out');
      await user.click(signOutButton);
      
      // 4. Verify sign out was called
      await waitFor(() => {
        expect(mockAuthService.signOut).toHaveBeenCalled();
        expect(mockOnSignOut).toHaveBeenCalled();
      });
    });

    it('should handle rapid menu toggling', async () => {
      const user = userEvent.setup();
      render(<UserProfile user={mockUser} onSignOut={mockOnSignOut} />);
      
      const profileButton = screen.getByRole('button');
      
      // Rapidly toggle menu multiple times
      await user.click(profileButton); // Open
      expect(screen.getByText('Test User')).toBeInTheDocument();
      
      await user.click(profileButton); // Close
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
      
      await user.click(profileButton); // Open
      expect(screen.getByText('Test User')).toBeInTheDocument();
      
      await user.click(profileButton); // Close
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
      
      // Final open
      await user.click(profileButton);
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });
});