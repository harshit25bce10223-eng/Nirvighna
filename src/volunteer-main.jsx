import React from 'react';
import ReactDOM from 'react-dom/client';
import { VolunteerApp } from './VolunteerApp.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <VolunteerApp />
    </LanguageProvider>
  </React.StrictMode>
);
