import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { validateEnv } from './utils/env';

// Validate environment variables before starting the app
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  // Show a user-friendly error message
  document.body.innerHTML = `
    <div style="
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
    ">
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        max-width: 500px;
        text-align: center;
      ">
        <h2 style="color: #e74c3c; margin-bottom: 1rem;">Configuration Error</h2>
        <p style="color: #666; margin-bottom: 1rem;">
          The application is missing required environment variables.
        </p>
        <p style="color: #333; font-family: monospace; background: #f8f9fa; padding: 0.5rem; border-radius: 4px;">
          ${errorMessage}
        </p>
        <p style="color: #666; font-size: 0.9rem; margin-top: 1rem;">
          Please check your environment configuration and try again.
        </p>
      </div>
    </div>
  `;
  throw error;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
