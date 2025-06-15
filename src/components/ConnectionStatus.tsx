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

  useEffect(() => {
    // Check if status is "connected and synced"
    const isConnectedAndSynced = isOnline && syncStatus === 'synced';
    
    if (isConnectedAndSynced) {
      // Show the bar initially and reset animation state
      setIsVisible(true);
      setIsAnimatingOut(false);
      
      // Set timer to start hide animation after 3 seconds
      const timer = setTimeout(() => {
        setIsAnimatingOut(true);
        // After animation completes, hide the component completely
        setTimeout(() => {
          setIsVisible(false);
        }, 300); // Match the CSS transition duration
      }, 3000);
      
      // Cleanup timer on unmount or dependency change
      return () => clearTimeout(timer);
    } else {
      // For all other statuses, always show the bar and reset animation state
      setIsVisible(true);
      setIsAnimatingOut(false);
    }
  }, [isOnline, syncStatus]);

  // Don't render anything if not visible
  if (!isVisible) {
    return null;
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
  
  // Show synced status when online and synced
  if (isOnline && syncStatus === 'synced') {
    return (
      <div className={`connection-status synced${isAnimatingOut ? ' slide-out' : ''}`}>
        <span className="status-icon">✅</span>
        <span>Connected and synced</span>
      </div>
    );
  }
  
  return null;
};

export default ConnectionStatus;