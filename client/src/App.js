/**
 * Root component of the Todo List Application
 * Handles routing, theme management, and authentication
 */

import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Component imports
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Board from './components/Board';

// Context imports
import { AuthProvider, useAuth } from './context/AuthContext';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';

/**
 * AppWithTheme component
 * Handles theme configuration and application routing
 */
function AppWithTheme() {
  const { darkMode } = useDarkMode();

  // Create MUI theme based on dark mode preference
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#2196f3',
          },
          secondary: {
            main: '#f50057',
          },
          background: {
            default: darkMode ? '#121212' : '#f5f5f5',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
              },
            },
          },
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRoutes />
    </ThemeProvider>
  );
}

/**
 * PrivateRoute component
 * Protects routes that require authentication
 */
const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

/**
 * AppRoutes component
 * Defines application routing logic
 */
function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          token ? (
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/login" 
        element={token ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={token ? <Navigate to="/" replace /> : <Register />} 
      />
      <Route
        path="/board/:id"
        element={
          <PrivateRoute>
            <Board />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Root App component
 * Provides necessary context providers
 */
export default function App() {
  return (
    <Router>
      <DarkModeProvider>
        <AuthProvider>
          <AppWithTheme />
        </AuthProvider>
      </DarkModeProvider>
    </Router>
  );
} 