import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types/auth';
import { AuthService } from '../services/authService';
import './UserProfile.css';

interface UserProfileProps {
  user: User;
  onSignOut?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onSignOut }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await AuthService.signOut();
      if (onSignOut) onSignOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    } finally {
      setSigningOut(false);
    }
  };

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="user-profile" ref={profileRef}>
      <button 
        className="user-profile-button"
        onClick={() => setShowMenu(!showMenu)}
      >
        {user.avatarUrl ? (
          <img 
            src={user.avatarUrl} 
            alt={user.fullName || 'User'} 
            className="user-avatar"
          />
        ) : (
          <div className="user-avatar-placeholder">
            {(user.fullName || user.email || 'U')[0].toUpperCase()}
          </div>
        )}
      </button>
      
      {showMenu && (
        <div className="user-profile-menu">
          <div className="user-info">
            <div className="user-name">{user.fullName || 'User'}</div>
            <div className="user-email">{user.email}</div>
          </div>
          
          <div className="menu-divider"></div>
          
          <button 
            className="menu-item"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;