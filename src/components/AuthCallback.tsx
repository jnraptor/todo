import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase will handle the callback automatically
    // Just redirect to home after a brief moment
    const timer = setTimeout(() => {
      navigate('/');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="auth-callback">
      <div className="spinner"></div>
      <p>Completing sign in...</p>
    </div>
  );
};

export default AuthCallback;