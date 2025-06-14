import React from 'react';

interface AuthPromptProps {
  onDismiss: () => void;
  onCreateAccount?: () => void;
}

const AuthPrompt: React.FC<AuthPromptProps> = ({ onDismiss, onCreateAccount }) => {
  const handleCreateAccount = () => {
    if (onCreateAccount) {
      onCreateAccount();
    } else {
      // For now, just show an alert since we haven't implemented auth yet
      alert('Account creation will be available in the next update! Your todos are already safely stored in the cloud.');
    }
  };

  return (
    <div className="auth-prompt">
      <div className="auth-prompt-content">
        <h3>🔄 Sync Across All Your Devices</h3>
        <p>Create a free account to access your todos from anywhere!</p>
        <div className="auth-prompt-benefits">
          <div>✓ Access from any device</div>
          <div>✓ Never lose your todos</div>
          <div>✓ Free forever</div>
        </div>
        <div className="auth-prompt-actions">
          <button className="btn-primary" onClick={handleCreateAccount}>
            Create Account
          </button>
          <button className="btn-secondary" onClick={onDismiss}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPrompt;