import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthPrompt from '../AuthPrompt';

// Mock window.alert
const mockAlert = jest.fn();
Object.defineProperty(window, 'alert', {
  writable: true,
  value: mockAlert,
});

describe('AuthPrompt Component', () => {
  const mockOnDismiss = jest.fn();
  const mockOnCreateAccount = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Prompt Display', () => {
    it('should render the main heading', () => {
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('🔄 Sync Across All Your Devices');
    });

    it('should render the description text', () => {
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      expect(screen.getByText('Create a free account to access your todos from anywhere!')).toBeInTheDocument();
    });

    it('should render all benefit items', () => {
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      expect(screen.getByText('✓ Access from any device')).toBeInTheDocument();
      expect(screen.getByText('✓ Never lose your todos')).toBeInTheDocument();
      expect(screen.getByText('✓ Free forever')).toBeInTheDocument();
    });

    it('should render both action buttons', () => {
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Maybe Later' })).toBeInTheDocument();
    });

    it('should have correct CSS classes for structure', () => {
      const { container } = render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      expect(container.querySelector('.auth-prompt')).toBeInTheDocument();
      expect(container.querySelector('.auth-prompt-content')).toBeInTheDocument();
      expect(container.querySelector('.auth-prompt-benefits')).toBeInTheDocument();
      expect(container.querySelector('.auth-prompt-actions')).toBeInTheDocument();
    });

    it('should have correct CSS classes for buttons', () => {
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      const createButton = screen.getByRole('button', { name: 'Create Account' });
      const dismissButton = screen.getByRole('button', { name: 'Maybe Later' });
      
      expect(createButton).toHaveClass('btn-primary');
      expect(dismissButton).toHaveClass('btn-secondary');
    });
  });

  describe('Dismiss Functionality', () => {
    it('should call onDismiss when "Maybe Later" button is clicked', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: 'Maybe Later' });
      await user.click(dismissButton);
      
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when clicked', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: 'Maybe Later' });
      await user.click(dismissButton);
      
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple dismiss clicks', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: 'Maybe Later' });
      
      await user.click(dismissButton);
      await user.click(dismissButton);
      await user.click(dismissButton);
      
      expect(mockOnDismiss).toHaveBeenCalledTimes(3);
    });
  });

  describe('Account Creation Flow', () => {
    it('should call onCreateAccount when provided and "Create Account" button is clicked', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} onCreateAccount={mockOnCreateAccount} />);
      
      const createButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(createButton);
      
      expect(mockOnCreateAccount).toHaveBeenCalledTimes(1);
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should call onCreateAccount when clicked', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} onCreateAccount={mockOnCreateAccount} />);
      
      const createButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(createButton);
      
      expect(mockOnCreateAccount).toHaveBeenCalledTimes(1);
    });

    it('should show alert when onCreateAccount is not provided', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      const createButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(createButton);
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Account creation will be available in the next update! Your todos are already safely stored in the cloud.'
      );
      expect(mockOnCreateAccount).not.toHaveBeenCalled();
    });

    it('should show alert when onCreateAccount is undefined', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} onCreateAccount={undefined} />);
      
      const createButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(createButton);
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Account creation will be available in the next update! Your todos are already safely stored in the cloud.'
      );
    });

    it('should handle multiple create account clicks when callback provided', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} onCreateAccount={mockOnCreateAccount} />);
      
      const createButton = screen.getByRole('button', { name: 'Create Account' });
      
      await user.click(createButton);
      await user.click(createButton);
      
      expect(mockOnCreateAccount).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple create account clicks when no callback provided', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      const createButton = screen.getByRole('button', { name: 'Create Account' });
      
      await user.click(createButton);
      await user.click(createButton);
      
      expect(mockAlert).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button roles', () => {
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Maybe Later' })).toBeInTheDocument();
    });

    it('should have accessible heading structure', () => {
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('🔄 Sync Across All Your Devices');
    });

    it('should be keyboard accessible', async () => {
      render(<AuthPrompt onDismiss={mockOnDismiss} onCreateAccount={mockOnCreateAccount} />);
      
      const createButton = screen.getByRole('button', { name: 'Create Account' });
      const dismissButton = screen.getByRole('button', { name: 'Maybe Later' });
      
      // Focus and activate create button with keyboard
      createButton.focus();
      expect(createButton).toHaveFocus();
      
      fireEvent.keyDown(createButton, { key: 'Enter' });
      fireEvent.click(createButton); // Simulate the click that would happen
      expect(mockOnCreateAccount).toHaveBeenCalled();
      
      // Focus and activate dismiss button with keyboard
      dismissButton.focus();
      expect(dismissButton).toHaveFocus();
      
      fireEvent.keyDown(dismissButton, { key: 'Enter' });
      fireEvent.click(dismissButton); // Simulate the click that would happen
      expect(mockOnDismiss).toHaveBeenCalled();
    });

    it('should have meaningful text content for screen readers', () => {
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      // Check that all important text is present and accessible
      expect(screen.getByText(/sync across all your devices/i)).toBeInTheDocument();
      expect(screen.getByText('Create a free account to access your todos from anywhere!')).toBeInTheDocument();
      expect(screen.getByText(/access from any device/i)).toBeInTheDocument();
      expect(screen.getByText(/never lose your todos/i)).toBeInTheDocument();
      expect(screen.getByText(/free forever/i)).toBeInTheDocument();
    });
  });

  describe('Content Structure', () => {
    it('should render benefits in correct order', () => {
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      const benefits = screen.getByText('✓ Access from any device').parentElement;
      expect(benefits).toBeInTheDocument();
      
      const benefitTexts = Array.from(benefits!.children).map(child => child.textContent);
      expect(benefitTexts).toEqual([
        '✓ Access from any device',
        '✓ Never lose your todos',
        '✓ Free forever'
      ]);
    });

    it('should render action buttons in correct order', () => {
      const { container } = render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      const actionsContainer = container.querySelector('.auth-prompt-actions');
      const buttons = actionsContainer?.querySelectorAll('button');
      
      expect(buttons).toHaveLength(2);
      expect(buttons![0]).toHaveTextContent('Create Account');
      expect(buttons![1]).toHaveTextContent('Maybe Later');
    });

    it('should have proper semantic structure', () => {
      const { container } = render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      const prompt = container.querySelector('.auth-prompt');
      expect(prompt?.tagName.toLowerCase()).toBe('div');
      
      const content = container.querySelector('.auth-prompt-content');
      expect(content?.tagName.toLowerCase()).toBe('div');
      
      const heading = screen.getByRole('heading');
      expect(heading.tagName.toLowerCase()).toBe('h3');
    });
  });

  describe('Event Handling', () => {
    it('should handle click events correctly', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} onCreateAccount={mockOnCreateAccount} />);
      
      // Test create account click
      const createButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(createButton);
      expect(mockOnCreateAccount).toHaveBeenCalledTimes(1);
      
      // Test dismiss click
      const dismissButton = screen.getByRole('button', { name: 'Maybe Later' });
      await user.click(dismissButton);
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not interfere with each other when both callbacks are provided', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} onCreateAccount={mockOnCreateAccount} />);
      
      const createButton = screen.getByRole('button', { name: 'Create Account' });
      const dismissButton = screen.getByRole('button', { name: 'Maybe Later' });
      
      await user.click(createButton);
      expect(mockOnCreateAccount).toHaveBeenCalledTimes(1);
      expect(mockOnDismiss).not.toHaveBeenCalled();
      
      await user.click(dismissButton);
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
      expect(mockOnCreateAccount).toHaveBeenCalledTimes(1); // Should not increase
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicking', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} onCreateAccount={mockOnCreateAccount} />);
      
      const createButton = screen.getByRole('button', { name: 'Create Account' });
      
      // Rapid clicking
      await user.click(createButton);
      await user.click(createButton);
      await user.click(createButton);
      
      expect(mockOnCreateAccount).toHaveBeenCalledTimes(3);
    });

    it('should render correctly when only required props are provided', () => {
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Maybe Later' })).toBeInTheDocument();
    });

    it('should handle null/undefined callbacks gracefully', () => {
      // This tests the component's resilience to edge cases
      expect(() => {
        render(<AuthPrompt onDismiss={mockOnDismiss} onCreateAccount={null as any} />);
      }).not.toThrow();
      
      expect(() => {
        render(<AuthPrompt onDismiss={mockOnDismiss} onCreateAccount={undefined} />);
      }).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete user interaction flow', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} onCreateAccount={mockOnCreateAccount} />);
      
      // User reads the content
      expect(screen.getByText(/sync across all your devices/i)).toBeInTheDocument();
      expect(screen.getByText('Create a free account to access your todos from anywhere!')).toBeInTheDocument();
      
      // User sees benefits
      expect(screen.getByText('✓ Access from any device')).toBeInTheDocument();
      expect(screen.getByText('✓ Never lose your todos')).toBeInTheDocument();
      expect(screen.getByText('✓ Free forever')).toBeInTheDocument();
      
      // User decides to create account
      const createButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(createButton);
      
      expect(mockOnCreateAccount).toHaveBeenCalledTimes(1);
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('should handle user dismissal flow', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} onCreateAccount={mockOnCreateAccount} />);
      
      // User reads content but decides to dismiss
      const dismissButton = screen.getByRole('button', { name: 'Maybe Later' });
      await user.click(dismissButton);
      
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
      expect(mockOnCreateAccount).not.toHaveBeenCalled();
    });

    it('should handle fallback flow when no create account callback', async () => {
      const user = userEvent.setup();
      render(<AuthPrompt onDismiss={mockOnDismiss} />);
      
      const createButton = screen.getByRole('button', { name: 'Create Account' });
      await user.click(createButton);
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Account creation will be available in the next update! Your todos are already safely stored in the cloud.'
      );
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });
});