/**
 * Application entry point
 * Renders the root App component with React StrictMode
 */

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

// Render the application in strict mode for additional checks
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
); 