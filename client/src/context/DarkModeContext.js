/**
 * DarkModeContext
 * Provides dark mode functionality throughout the application
 * Persists user preference in localStorage
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext();

/**
 * DarkModeProvider component
 * Wraps the application to provide dark mode functionality
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function DarkModeProvider({ children }) {
  // Initialize dark mode from localStorage or default to false
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Persist dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  /**
   * Toggles between light and dark mode
   */
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

/**
 * Custom hook to access dark mode context
 * @returns {Object} Dark mode context value
 */
export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
}; 