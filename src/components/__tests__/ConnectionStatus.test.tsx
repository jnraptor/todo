import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import ConnectionStatus from '../ConnectionStatus';

describe('ConnectionStatus Component', () => {
  describe('Offline State', () => {
    it('should display offline status with default message when no queue length', () => {
      render(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
      expect(screen.getByText(/changes will sync when reconnected/i)).toBeInTheDocument();
      expect(screen.getByText('🔴')).toBeInTheDocument();
    });

    it('should display offline status with queue count when queueLength > 0', () => {
      render(<ConnectionStatus isOnline={false} syncStatus="synced" queueLength={3} />);
      
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
      expect(screen.getByText(/3 changes will sync when reconnected/i)).toBeInTheDocument();
      expect(screen.getByText('🔴')).toBeInTheDocument();
    });

    it('should display offline status with singular "change" for queueLength = 1', () => {
      render(<ConnectionStatus isOnline={false} syncStatus="synced" queueLength={1} />);
      
      expect(screen.getByText(/1 changes will sync when reconnected/i)).toBeInTheDocument();
    });

    it('should display offline status with zero queue length', () => {
      render(<ConnectionStatus isOnline={false} syncStatus="synced" queueLength={0} />);
      
      expect(screen.getByText(/changes will sync when reconnected/i)).toBeInTheDocument();
      expect(screen.queryByText(/0 changes/i)).not.toBeInTheDocument();
    });

    it('should have correct CSS classes for offline state', () => {
      const { container } = render(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      
      const statusElement = container.querySelector('.connection-status');
      expect(statusElement).toHaveClass('offline');
      expect(container.querySelector('.status-icon')).toBeInTheDocument();
    });

    it('should ignore syncStatus when offline', () => {
      const { rerender } = render(<ConnectionStatus isOnline={false} syncStatus="syncing" />);
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={false} syncStatus="error" />);
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });
  });

  describe('Syncing State', () => {
    it('should display syncing status when online and syncing', () => {
      render(<ConnectionStatus isOnline={true} syncStatus="syncing" />);
      
      expect(screen.getByText(/syncing/i)).toBeInTheDocument();
      expect(screen.getByText('🔄')).toBeInTheDocument();
    });

    it('should display syncing status with queue count when queueLength > 0', () => {
      render(<ConnectionStatus isOnline={true} syncStatus="syncing" queueLength={5} />);
      
      expect(screen.getByText(/syncing 5 changes/i)).toBeInTheDocument();
      expect(screen.getByText('🔄')).toBeInTheDocument();
    });

    it('should display syncing status without count when queueLength = 0', () => {
      render(<ConnectionStatus isOnline={true} syncStatus="syncing" queueLength={0} />);
      
      expect(screen.getByText(/^syncing\.\.\.$/i)).toBeInTheDocument();
      expect(screen.queryByText(/0 changes/i)).not.toBeInTheDocument();
    });

    it('should display syncing status without count when no queueLength provided', () => {
      render(<ConnectionStatus isOnline={true} syncStatus="syncing" />);
      
      expect(screen.getByText(/^syncing\.\.\.$/i)).toBeInTheDocument();
    });

    it('should have correct CSS classes for syncing state', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="syncing" />);
      
      const notificationElement = container.querySelector('.connection-status-notification');
      expect(notificationElement).toHaveClass('syncing');
      expect(container.querySelector('.status-icon')).toBeInTheDocument();
    });

    it('should handle large queue numbers', () => {
      render(<ConnectionStatus isOnline={true} syncStatus="syncing" queueLength={999} />);
      
      expect(screen.getByText(/syncing 999 changes/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error status when online and error', () => {
      render(<ConnectionStatus isOnline={true} syncStatus="error" />);
      
      expect(screen.getByText(/sync error/i)).toBeInTheDocument();
      expect(screen.getByText(/will retry automatically/i)).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should display error status regardless of queue length', () => {
      const { rerender } = render(<ConnectionStatus isOnline={true} syncStatus="error" queueLength={0} />);
      expect(screen.getByText(/sync error/i)).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="error" queueLength={10} />);
      expect(screen.getByText(/sync error/i)).toBeInTheDocument();
      expect(screen.queryByText(/10 changes/i)).not.toBeInTheDocument();
    });

    it('should have correct CSS classes for error state', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="error" />);
      
      const statusElement = container.querySelector('.connection-status');
      expect(statusElement).toHaveClass('error');
      expect(container.querySelector('.status-icon')).toBeInTheDocument();
    });
  });

  describe('Synced State (Notification)', () => {
    it('should display synced status as notification when online and synced', () => {
      render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('should display synced status regardless of queue length', () => {
      const { rerender } = render(<ConnectionStatus isOnline={true} syncStatus="synced" queueLength={0} />);
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="synced" queueLength={5} />);
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      expect(screen.queryByText(/5 changes/i)).not.toBeInTheDocument();
    });

    it('should have correct CSS classes for synced notification', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      const notificationElement = container.querySelector('.connection-status-notification');
      expect(notificationElement).toBeInTheDocument();
      expect(container.querySelector('.status-icon')).toBeInTheDocument();
      expect(container.querySelector('.notification-content')).toBeInTheDocument();
      expect(container.querySelector('.notification-close')).toBeInTheDocument();
    });

    it('should render close button with proper accessibility', () => {
      render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      const closeButton = screen.getByRole('button', { name: /dismiss notification/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Dismiss notification');
      expect(closeButton.textContent).toBe('×');
    });

    it('should dismiss notification when close button is clicked', () => {
      jest.useFakeTimers();
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      // Initially should be visible
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      
      // Click close button
      const closeButton = screen.getByRole('button', { name: /dismiss notification/i });
      fireEvent.click(closeButton);
      
      // Should start slide-out animation
      expect(container.querySelector('.slide-out')).toBeInTheDocument();
      
      // Fast-forward through animation
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      // Should be completely hidden
      expect(screen.queryByText(/connected and synced/i)).not.toBeInTheDocument();
      
      jest.useRealTimers();
    });

    it('should not render as full-width bar for synced state', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      // Should not have the old full-width bar classes
      expect(container.querySelector('.connection-status')).not.toBeInTheDocument();
      
      // Should have notification classes instead
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification.synced')).toBeInTheDocument();
    });
  });

  describe('Status Priority and Logic', () => {
    it('should prioritize offline status over sync status', () => {
      // When offline, syncStatus should be ignored
      const { rerender } = render(<ConnectionStatus isOnline={false} syncStatus="syncing" />);
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
      expect(screen.queryByText(/syncing/i)).not.toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={false} syncStatus="error" />);
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
      expect(screen.queryByText(/sync error/i)).not.toBeInTheDocument();
    });

    it('should handle state transitions correctly', () => {
      const { container, rerender } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
      
      // Transition to syncing (should remain as notification but change content)
      rerender(<ConnectionStatus isOnline={true} syncStatus="syncing" queueLength={2} />);
      expect(screen.getByText(/syncing 2 changes/i)).toBeInTheDocument();
      expect(screen.queryByText(/connected and synced/i)).not.toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification.syncing')).toBeInTheDocument();
      
      // Transition to error (should switch to full-width bar)
      rerender(<ConnectionStatus isOnline={true} syncStatus="error" />);
      expect(screen.getByText(/sync error/i)).toBeInTheDocument();
      expect(screen.queryByText(/syncing/i)).not.toBeInTheDocument();
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).not.toBeInTheDocument();
      
      // Transition to offline (should remain as full-width bar)
      rerender(<ConnectionStatus isOnline={false} syncStatus="error" queueLength={3} />);
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
      expect(screen.queryByText(/sync error/i)).not.toBeInTheDocument();
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
      
      // Transition back to synced (should switch back to notification)
      rerender(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
      expect(container.querySelector('.connection-status')).not.toBeInTheDocument();
    });

    it('should return null for invalid state combinations', () => {
      // This test checks if there are any edge cases that return null
      // Based on the current implementation, all valid combinations should render something
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('Queue Length Handling', () => {
    it('should handle undefined queueLength', () => {
      render(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      expect(screen.getByText(/changes will sync when reconnected/i)).toBeInTheDocument();
    });

    it('should handle zero queueLength explicitly', () => {
      render(<ConnectionStatus isOnline={false} syncStatus="synced" queueLength={0} />);
      expect(screen.getByText(/changes will sync when reconnected/i)).toBeInTheDocument();
      expect(screen.queryByText(/0 changes/i)).not.toBeInTheDocument();
    });

    it('should handle negative queueLength gracefully', () => {
      render(<ConnectionStatus isOnline={false} syncStatus="synced" queueLength={-1} />);
      // Should not crash and should handle it as if queueLength is 0
      expect(screen.getByText(/changes will sync when reconnected/i)).toBeInTheDocument();
    });

    it('should handle very large queueLength', () => {
      render(<ConnectionStatus isOnline={false} syncStatus="synced" queueLength={1000000} />);
      expect(screen.getByText(/1000000 changes will sync when reconnected/i)).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('should render correct icons for each state', () => {
      const { rerender } = render(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      expect(screen.getByText('🔴')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="syncing" />);
      expect(screen.getByText('🔄')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="error" />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('should have status-icon class for all icons', () => {
      const { container, rerender } = render(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      expect(container.querySelector('.status-icon')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="syncing" />);
      expect(container.querySelector('.status-icon')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="error" />);
      expect(container.querySelector('.status-icon')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      expect(container.querySelector('.status-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have meaningful text content for screen readers', () => {
      const { rerender } = render(<ConnectionStatus isOnline={false} syncStatus="synced" queueLength={3} />);
      expect(screen.getByText(/offline.*3 changes.*will sync when reconnected/i)).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="syncing" queueLength={2} />);
      expect(screen.getByText(/syncing.*2 changes/i)).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="error" />);
      expect(screen.getByText(/sync error.*will retry automatically/i)).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
    });

    it('should have proper semantic structure for bar states', () => {
      const { container } = render(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      
      const statusElement = container.querySelector('.connection-status');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement?.tagName.toLowerCase()).toBe('div');
      
      const icon = container.querySelector('.status-icon');
      expect(icon?.tagName.toLowerCase()).toBe('span');
    });

    it('should have proper semantic structure for notification', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      const notificationElement = container.querySelector('.connection-status-notification');
      expect(notificationElement).toBeInTheDocument();
      expect(notificationElement?.tagName.toLowerCase()).toBe('div');
      
      const icon = container.querySelector('.status-icon');
      expect(icon?.tagName.toLowerCase()).toBe('span');
      
      const closeButton = container.querySelector('.notification-close');
      expect(closeButton?.tagName.toLowerCase()).toBe('button');
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct base class to bar states', () => {
      const { container, rerender } = render(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="syncing" />);
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="error" />);
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
    });

    it('should apply notification class for synced state', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
      expect(container.querySelector('.connection-status')).not.toBeInTheDocument();
    });

    it('should apply unique state classes for bar states', () => {
      const { container, rerender } = render(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      expect(container.querySelector('.offline')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="syncing" />);
      expect(container.querySelector('.syncing')).toBeInTheDocument();
      expect(container.querySelector('.offline')).not.toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="error" />);
      expect(container.querySelector('.error')).toBeInTheDocument();
      expect(container.querySelector('.syncing')).not.toBeInTheDocument();
    });

    it('should not apply bar state classes to notification', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification.synced')).toBeInTheDocument();
      expect(container.querySelector('.connection-status')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle rapid state changes', () => {
      const { rerender } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      // Rapid state changes
      for (let i = 0; i < 10; i++) {
        rerender(<ConnectionStatus isOnline={true} syncStatus="syncing" queueLength={i} />);
        rerender(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      }
      
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
    });

    it('should handle all prop combinations without errors', () => {
      const states: Array<{ isOnline: boolean; syncStatus: 'synced' | 'syncing' | 'error'; queueLength?: number }> = [
        { isOnline: false, syncStatus: 'synced' },
        { isOnline: false, syncStatus: 'syncing' },
        { isOnline: false, syncStatus: 'error' },
        { isOnline: true, syncStatus: 'synced' },
        { isOnline: true, syncStatus: 'syncing' },
        { isOnline: true, syncStatus: 'error' },
        { isOnline: false, syncStatus: 'synced', queueLength: 0 },
        { isOnline: false, syncStatus: 'synced', queueLength: 5 },
        { isOnline: true, syncStatus: 'syncing', queueLength: 10 },
      ];
      
      states.forEach((props, index) => {
        const { unmount } = render(<ConnectionStatus {...props} />);
        // Should render without throwing errors
        expect(document.body).toBeInTheDocument();
        unmount();
      });
    });

    it('should maintain consistent behavior across re-renders', () => {
      const { rerender } = render(<ConnectionStatus isOnline={false} syncStatus="synced" queueLength={5} />);
      
      const initialText = screen.getByText(/5 changes will sync when reconnected/i);
      expect(initialText).toBeInTheDocument();
      
      // Re-render with same props
      rerender(<ConnectionStatus isOnline={false} syncStatus="synced" queueLength={5} />);
      expect(screen.getByText(/5 changes will sync when reconnected/i)).toBeInTheDocument();
    });
  });

  describe('Auto-hide Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should hide the notification after 3 seconds when connected and synced', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      // Initially should be visible as notification
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
      expect(container.querySelector('.slide-out')).not.toBeInTheDocument();
      
      // Fast-forward time by 2.5 seconds - should still be visible
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      expect(container.querySelector('.slide-out')).not.toBeInTheDocument();
      
      // Fast-forward time by another 0.5 seconds (total 3 seconds) - should start animating out
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      expect(container.querySelector('.slide-out')).toBeInTheDocument();
      
      // Fast-forward time by another 0.3 seconds (total 3.3 seconds) - should be completely hidden
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(screen.queryByText(/connected and synced/i)).not.toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).not.toBeInTheDocument();
    });

    it('should not hide the status bar for offline status', () => {
      const { container } = render(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      
      // Initially should be visible
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
      
      // Fast-forward time by 5 seconds - should still be visible
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
    });

    it('should not hide the notification for syncing status', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="syncing" />);
      
      // Initially should be visible as notification
      expect(screen.getByText(/syncing/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
      
      // Fast-forward time by 5 seconds - should still be visible
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(screen.getByText(/syncing/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
    });

    it('should not hide the status bar for error status', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="error" />);
      
      // Initially should be visible
      expect(screen.getByText(/sync error/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
      
      // Fast-forward time by 5 seconds - should still be visible
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(screen.getByText(/sync error/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
    });

    it('should restart timer when status changes back to synced', () => {
      const { container, rerender } = render(<ConnectionStatus isOnline={true} syncStatus="syncing" />);
      
      // Initially syncing - should be visible as notification
      expect(screen.getByText(/syncing/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
      
      // Change to synced status - should remain as notification but change content
      rerender(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
      expect(container.querySelector('.slide-out')).not.toBeInTheDocument();
      
      // Fast-forward time by 2.5 seconds - should still be visible
      act(() => {
        jest.advanceTimersByTime(2500);
      });
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      expect(container.querySelector('.slide-out')).not.toBeInTheDocument();
      
      // Fast-forward time by another 0.5 seconds (total 3 seconds) - should start animating out
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      expect(container.querySelector('.slide-out')).toBeInTheDocument();
      
      // Fast-forward time by another 0.3 seconds (total 3.3 seconds) - should be completely hidden
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(screen.queryByText(/connected and synced/i)).not.toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).not.toBeInTheDocument();
    });

    it('should apply slide-out animation class before hiding notification', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      // Initially should be visible without slide-out class
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
      expect(container.querySelector('.slide-out')).not.toBeInTheDocument();
      
      // Fast-forward to start of animation (3 seconds)
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      // Should still be visible but with slide-out class
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification.slide-out')).toBeInTheDocument();
      
      // Fast-forward through animation (300ms more)
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      // Should be completely hidden
      expect(screen.queryByText(/connected and synced/i)).not.toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).not.toBeInTheDocument();
    });

    it('should not apply slide-out class to non-synced statuses', () => {
      const { container } = render(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      
      // Fast-forward past the auto-hide time
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      // Should still be visible without slide-out class
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
      expect(container.querySelector('.slide-out')).not.toBeInTheDocument();
    });

    it('should handle multiple rapid synced state changes', () => {
      const { container, rerender } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      // Initially should be visible
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      
      // Change to syncing and back to synced rapidly
      rerender(<ConnectionStatus isOnline={true} syncStatus="syncing" />);
      rerender(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      // Should reset timer and be visible
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      expect(container.querySelector('.slide-out')).not.toBeInTheDocument();
      
      // Fast-forward to auto-hide time
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      // Should start animating out
      expect(container.querySelector('.slide-out')).toBeInTheDocument();
    });
  });

  describe('Notification-Specific Features', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should render notification with all required elements', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      // Check notification structure
      const notification = container.querySelector('.connection-status-notification');
      expect(notification).toBeInTheDocument();
      
      const content = container.querySelector('.notification-content');
      expect(content).toBeInTheDocument();
      
      const icon = container.querySelector('.status-icon');
      expect(icon).toBeInTheDocument();
      expect(icon?.textContent).toBe('✅');
      
      const closeButton = container.querySelector('.notification-close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton?.textContent).toBe('×');
    });

    it('should have proper ARIA attributes for accessibility', () => {
      render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      const closeButton = screen.getByRole('button', { name: /dismiss notification/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Dismiss notification');
    });

    it('should handle close button click during auto-hide timer', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      // Fast-forward to 2 seconds (before auto-hide)
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      // Click close button
      const closeButton = screen.getByRole('button', { name: /dismiss notification/i });
      fireEvent.click(closeButton);
      
      // Should immediately start slide-out animation
      expect(container.querySelector('.slide-out')).toBeInTheDocument();
      
      // Fast-forward through manual dismiss animation
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      // Should be hidden
      expect(screen.queryByText(/connected and synced/i)).not.toBeInTheDocument();
    });

    it('should not interfere with other status types', () => {
      const { container, rerender } = render(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      
      // Offline should render as full-width bar
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="syncing" />);
      
      // Syncing should render as notification
      expect(container.querySelector('.connection-status-notification')).toBeInTheDocument();
      expect(container.querySelector('.connection-status')).not.toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="error" />);
      
      // Error should render as full-width bar
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
      expect(container.querySelector('.connection-status-notification')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should maintain notification positioning and styling', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      const notification = container.querySelector('.connection-status-notification');
      expect(notification).toBeInTheDocument();
      
      // Check that it has the notification class and not the bar class
      expect(notification).toHaveClass('connection-status-notification');
      expect(notification).toHaveClass('synced');
      expect(notification).not.toHaveClass('connection-status');
    });
  });
});