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

  useEffect(() => {
    // Check if status is "connected and synced"
    const isConnectedAndSynced = isOnline && syncStatus === 'synced';
    
    if (isConnectedAndSynced) {
      // Show the bar initially
      setIsVisible(true);
      
      // Set timer to hide after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      
      // Cleanup timer on unmount or dependency change
      return () => clearTimeout(timer);
    } else {
      // For all other statuses, always show the bar
      setIsVisible(true);
    }
  }, [isOnline, syncStatus]);

  // Don't render anything if not visible
  if (!isVisible) {
    return null;
  }
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
  
  if (syncStatus === 'syncing') {
    return (
      <div className="connection-status syncing">
        <span className="status-icon">🔄</span>
        <span>Syncing{queueLength > 0 ? ` ${queueLength} changes` : ''}...</span>
      </div>
    );
  }
  
  if (syncStatus === 'error') {
    return (
      <div className="connection-status error">
        <span className="status-icon">⚠️</span>
        <span>Sync error - Will retry automatically</span>
      </div>
    );
  }
  
  // Show synced status when online and synced
  if (isOnline && syncStatus === 'synced') {
    return (
      <div className="connection-status synced">
        <span className="status-icon">✅</span>
        <span>Connected and synced</span>
      </div>
    );
  }
  
  return null;
};

export default ConnectionStatus;