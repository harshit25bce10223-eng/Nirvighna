import React from 'react';
import ReactDOM from 'react-dom/client';
import { VolunteerApp } from './VolunteerApp.jsx';
import './index.css';

// Normalize URL for HashRouter
if (window.location.pathname && window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
  const path = window.location.pathname;
  window.history.replaceState(null, '', '/#' + path + window.location.search);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VolunteerApp />
  </React.StrictMode>
);
