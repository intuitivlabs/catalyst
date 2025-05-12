"use client";

import { useTheme } from '../context/ThemeContext';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { darkMode, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="theme-toggle-container">
      <button
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <div className="toggle-track">
          {/* Light mode icon - improved sun with rays */}
          <div className="toggle-icon light-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <p className="toggle-text">Light</p>
          </div>
          
          {/* Dark mode icon */}
          <div className="toggle-icon dark-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M9.36077 3.29291C6.30062 4.70763 4 7.65876 4 11.1636C4 16.0181 8.03757 20 13 20C16.3376 20 19.1926 17.8162 20.6398 14.8366C20.9442 14.2385 20.4446 13.3934 19.7248 13.5366C19.3028 13.6192 18.8662 13.6636 18.4198 13.6636C14.6332 13.6636 11.4645 10.6183 11.4645 6.93636C11.4645 5.93112 11.6729 4.97747 12.0512 4.12342C12.3496 3.44827 11.7213 2.71427 10.9797 2.90102C10.4374 3.0329 9.90593 3.2025 9.36077 3.29291Z" 
                fill="currentColor"
              />
            </svg>
            <p className="toggle-text">Dark</p>
          </div>
          
          {/* Moving toggle circle */}
          <div className={`toggle-thumb ${darkMode ? "toggle-thumb-right" : "toggle-thumb-left"}`}></div>
        </div>
      </button>
    </div>
  );
}
