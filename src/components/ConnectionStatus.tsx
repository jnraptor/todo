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
  
  // Check if this should be a notification style (both syncing and synced)
  const isNotification = isOnline && (syncStatus === 'syncing' || syncStatus === 'synced');

  useEffect(() => {
    if (isNotification) {
      if (syncStatus === 'syncing') {
        // Always update for syncing state
        setIsVisible(true);
        setIsAnimatingOut(false);
      } else if (syncStatus === 'synced') {
        // Always setup timer for synced state
        setIsVisible(true);
        setIsAnimatingOut(false);
        
        // Auto-hide after 3 seconds
        const dismissTimer = setTimeout(() => {
          setIsAnimatingOut(true);
          setTimeout(() => {
            setIsVisible(false);
          }, 300);
        }, 3000);
        
        return () => {
          clearTimeout(dismissTimer);
        };
      }
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

  // Render as notification for both syncing and synced
  if (isNotification) {
    const notificationClass = `connection-status-notification ${syncStatus}${isAnimatingOut ? ' slide-out' : ''}`;
    
    if (syncStatus === 'syncing') {
      return (
        <div className={notificationClass}>
          <div className="notification-content">
            <span className="status-icon">🔄</span>
            <span>Syncing{queueLength > 0 ? ` ${queueLength} changes` : ''}...</span>
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
    } else if (syncStatus === 'synced') {
      return (
        <div className={notificationClass}>
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
  }

  // Offline state
  if (!isOnline) {
    return (
      <div className="connection-status offline">
        <span className="status-icon">🔴</span>
        <span>
          Offline - {queueLength > 0 ? `${queueLength} changes` : 'Changes'} will sync when reconnected
        </span>
      </div>
    );
  }
  
  // Error state
  if (syncStatus === 'error') {
    return (
      <div className="connection-status error">
        <span className="status-icon">⚠️</span>
        <span>Sync error - Will retry automatically</span>
      </div>
    );
  }
  
  return null;
};

export default ConnectionStatus;