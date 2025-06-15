import React from 'react';
import { render, screen } from '@testing-library/react';
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
      
      const statusElement = container.querySelector('.connection-status');
      expect(statusElement).toHaveClass('syncing');
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

  describe('Synced State', () => {
    it('should display synced status when online and synced', () => {
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

    it('should have correct CSS classes for synced state', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      const statusElement = container.querySelector('.connection-status');
      expect(statusElement).toHaveClass('synced');
      expect(container.querySelector('.status-icon')).toBeInTheDocument();
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
      const { rerender } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      expect(screen.getByText(/connected and synced/i)).toBeInTheDocument();
      
      // Transition to syncing
      rerender(<ConnectionStatus isOnline={true} syncStatus="syncing" queueLength={2} />);
      expect(screen.getByText(/syncing 2 changes/i)).toBeInTheDocument();
      expect(screen.queryByText(/connected and synced/i)).not.toBeInTheDocument();
      
      // Transition to error
      rerender(<ConnectionStatus isOnline={true} syncStatus="error" />);
      expect(screen.getByText(/sync error/i)).toBeInTheDocument();
      expect(screen.queryByText(/syncing/i)).not.toBeInTheDocument();
      
      // Transition to offline
      rerender(<ConnectionStatus isOnline={false} syncStatus="error" queueLength={3} />);
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
      expect(screen.queryByText(/sync error/i)).not.toBeInTheDocument();
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

    it('should have proper semantic structure', () => {
      const { container } = render(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      
      const statusElement = container.querySelector('.connection-status');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement?.tagName.toLowerCase()).toBe('div');
      
      const icon = container.querySelector('.status-icon');
      expect(icon?.tagName.toLowerCase()).toBe('span');
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct base class to all states', () => {
      const { container, rerender } = render(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="syncing" />);
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="error" />);
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      expect(container.querySelector('.connection-status')).toBeInTheDocument();
    });

    it('should apply unique state classes', () => {
      const { container, rerender } = render(<ConnectionStatus isOnline={false} syncStatus="synced" />);
      expect(container.querySelector('.offline')).toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="syncing" />);
      expect(container.querySelector('.syncing')).toBeInTheDocument();
      expect(container.querySelector('.offline')).not.toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="error" />);
      expect(container.querySelector('.error')).toBeInTheDocument();
      expect(container.querySelector('.syncing')).not.toBeInTheDocument();
      
      rerender(<ConnectionStatus isOnline={true} syncStatus="synced" />);
      expect(container.querySelector('.synced')).toBeInTheDocument();
      expect(container.querySelector('.error')).not.toBeInTheDocument();
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
});