import React, { useState, useEffect } from 'react';

interface ConnectionStatusProps {
  isOnline: boolean;
  syncStatus: 'synced' | 'syncing' | 'error';
  queueLength?: number;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isOnline,
  syncStatus,
  queueLength = 0
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  
  // Check if this should be a notification style
  const isNotification = isOnline && syncStatus === 'synced';

  useEffect(() => {
    if (isNotification) {
      // Reset states for notification
      setIsVisible(true);
      setIsAnimatingOut(false);
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setIsAnimatingOut(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 300);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      // For other statuses, always show
      setIsVisible(true);
      setIsAnimatingOut(false);
    }
  }, [isOnline, syncStatus, isNotification]);

  const handleManualDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  // Don't render anything if not visible
  if (!isVisible) {
    return null;
  }

  // Render as notification for "connected and synced"
  if (isNotification) {
    return (
      <div className={`connection-status-notification${isAnimatingOut ? ' slide-out' : ''}`}>
        <div className="notification-content">
          <span className="status-icon">✅</span>
          <span>Connected and synced</span>
        </div>
        <button
          className="notification-close"
          onClick={handleManualDismiss}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    );
  }
  if (!isOnline) {
    return (
      <div className={`connection-status offline${isAnimatingOut ? ' slide-out' : ''}`}>
        <span className="status-icon">🔴</span>
        <span>
          Offline - {queueLength > 0 ? `${queueLength} changes` : 'Changes'} will sync when reconnected
        </span>
      </div>
    );
  }
  
  if (syncStatus === 'syncing') {
    return (
      <div className={`connection-status syncing${isAnimatingOut ? ' slide-out' : ''}`}>
        <span className="status-icon">🔄</span>
        <span>Syncing{queueLength > 0 ? ` ${queueLength} changes` : ''}...</span>
      </div>
    );
  }
  
  if (syncStatus === 'error') {
    return (
      <div className={`connection-status error${isAnimatingOut ? ' slide-out' : ''}`}>
        <span className="status-icon">⚠️</span>
        <span>Sync error - Will retry automatically</span>
      </div>
    );
  }
  
  return null;
};

export default ConnectionStatus;