import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AppUpdateGatekeeper } from './components/AppUpdateGatekeeper.jsx';
import './index.css';

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
