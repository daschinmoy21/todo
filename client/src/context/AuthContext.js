/**
 * AuthContext
 * Manages authentication state throughout the application
 * Handles token storage and user session
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

/**
 * AuthProvider component
 * Provides authentication functionality to the application
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  /**
   * Handles user login by storing the token
   * @param {string} newToken - JWT token received from the server
   */
  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  /**
   * Handles user logout by removing the token
   */
  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  // Show loading state while checking for token
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context
 * @returns {Object} Authentication context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};