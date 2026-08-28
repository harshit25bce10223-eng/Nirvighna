import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { CommandCentreLayout } from './components/CommandCentreLayout';
import { CommandCentreLogin } from './pages/command-centre/CommandCentreLogin';
import { CommandCentreDashboard } from './pages/command-centre/CommandCentreDashboard';
import { DrishtiAI } from './components/systems/DrishtiAI';
import { PranaNirvighna } from './components/systems/PranaNirvighna';
import { DhwaniRakshak } from './components/systems/DhwaniRakshak';
import { SanjeevaniPath } from './components/systems/SanjeevaniPath';
import { ErrorBoundary } from './components/ErrorBoundary';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

export function CommandCentreApp() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/cc/login" element={<CommandCentreLogin />} />
          <Route path="/cc" element={<Navigate to="/cc/dashboard" replace />} />
          
          <Route element={<CommandCentreLayout />}>
            <Route path="/cc/dashboard" element={
              <ErrorBoundary sectionName="Command Centre Dashboard">
                <CommandCentreDashboard />
              </ErrorBoundary>
            } />
            <Route path="/cc/drishti" element={
              <ErrorBoundary sectionName="Drishti AI">
                <DrishtiAI />
              </ErrorBoundary>
            } />
            <Route path="/cc/prana" element={
              <ErrorBoundary sectionName="Prana Nirvighna">
                <PranaNirvighna />
              </ErrorBoundary>
            } />
            <Route path="/cc/dhwani" element={
              <ErrorBoundary sectionName="Dhwani Rakshak">
                <DhwaniRakshak />
              </ErrorBoundary>
            } />
            <Route path="/cc/sanjeevani" element={
              <ErrorBoundary sectionName="Sanjeevani Path">
                <SanjeevaniPath />
              </ErrorBoundary>
            } />
            
            {/* Redirect /home to Pilgrim Portal */}
            <Route path="/home" element={<Navigate to="/" replace />} />
            
            {/* Default */}
            <Route path="/" element={<Navigate to="/cc/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/cc/dashboard" replace />} />
          </Route>
        </Routes>
      </LanguageProvider>
    </HashRouter>
  );
}