import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AppUpdateGatekeeper } from './components/AppUpdateGatekeeper.jsx';
import './index.css';

// Normalize URL for HashRouter (if user types /command-centre instead of /#/command-centre)
if (window.location.pathname && window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
  const path = window.location.pathname;
  window.history.replaceState(null, '', '/#' + path + window.location.search);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <AppUpdateGatekeeper>
          <App />
        </AppUpdateGatekeeper>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);
