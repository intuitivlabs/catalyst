import React, { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import Logo from '../components/Logo';
import Image from 'next/image';

export default function NavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav-header">
      <div className="nav-left">
        <Logo />
      </div>
      <button
        className="menu-hamburger mobile-hamburger"
        aria-label="Open menu"
        onClick={() => setOpen(!open)}
        style={{ marginRight: '1rem' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>
      {open && (
        <div className="mobile-menu-overlay" onClick={() => setOpen(false)} />
      )}
      <div className={`mobile-menu${open ? ' open' : ''}`}>
        <button className="close-menu" onClick={() => setOpen(false)} aria-label="Close menu">&times;</button>
        <div className="mobile-menu-content">
          <ThemeToggle />
          {/* Add more menu items here if needed */}
        </div>
      </div>
    </nav>
  );
}
