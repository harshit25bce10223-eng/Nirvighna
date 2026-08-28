import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { VolunteerAuthProvider, useVolunteerAuth } from './context/VolunteerAuthContext';
import { VolunteerBottomNav } from './components/VolunteerBottomNav';
import { VolunteerLogin } from './pages/volunteer/VolunteerLogin';
import { VolunteerScanPage } from './pages/volunteer/VolunteerScanPage';
import { VolunteerScanResultPage } from './pages/volunteer/VolunteerScanResultPage';
import { VolunteerAlertsPage } from './pages/volunteer/VolunteerAlertsPage';
import { VolunteerMedicalAlertPage } from './pages/volunteer/VolunteerMedicalAlertPage';
import { VolunteerLostFoundPage } from './pages/volunteer/VolunteerLostFoundPage';
import { VolunteerProfilePage } from './pages/volunteer/VolunteerProfilePage';
import { VolunteerPrasadCounterPage } from './pages/volunteer/VolunteerPrasadCounterPage';
import { VolunteerFootwearPage } from './pages/volunteer/VolunteerFootwearPage';
import { VolunteerFootwearResultPage } from './pages/volunteer/VolunteerFootwearResultPage';
import { VolunteerInnerGatePage } from './pages/volunteer/VolunteerInnerGatePage';
import { VolunteerGateAlertsPage } from './pages/volunteer/VolunteerGateAlertsPage';
import { ErrorBoundary } from './components/ErrorBoundary';

const VolunteerLayout = ({ children }) => {
  const location = useLocation();
  const { isLoggedIn, loading } = useVolunteerAuth();
  
  // Adjusted standalone pages logic for volunteer app
  const isLoginPage = location.pathname === '/v/login';
  const standalonePages = ['/v/login', '/v/footwear', '/v/prasad'];
  const isFootwearResult = location.pathname.startsWith('/v/footwear-result');
  const showVolunteerBottomNav = isLoggedIn && !standalonePages.includes(location.pathname) && !isFootwearResult;

  const [liveDispatchAlert, setLiveDispatchAlert] = React.useState(null);

  React.useEffect(() => {
    const playAlertSound = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {}
    };

    const handleDispatch = (e) => {
      if (e.detail) {
        setLiveDispatchAlert(e.detail);
        playAlertSound();
      }
    };

    const handlePanicAlert = (e) => {
      if (e.detail) {
        const p = {
          id: 'panic_' + Date.now(),
          templeName: 'Somnath Temple',
          title: '🚨 Panic Screaming Spike Alert',
          message: e.detail.description || 'Sudden high decibel scream spike detected in temple zone.',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };
        setLiveDispatchAlert(p);
        playAlertSound();
      }
    };

    window.addEventListener('nirvighna_temple_alert_dispatch', handleDispatch);
    window.addEventListener('nirvighna_panic_alert', handlePanicAlert);

    return () => {
      window.removeEventListener('nirvighna_temple_alert_dispatch', handleDispatch);
      window.removeEventListener('nirvighna_panic_alert', handlePanicAlert);
    };
  }, []);

  return (
    <ErrorBoundary sectionName="Volunteer Operations Hub">
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] text-gray-900 font-body selection:bg-gold selection:text-indigo-dark relative pt-[max(env(safe-area-inset-top,0px),0px)]">
        {/* Live Command Centre Admin Emergency Dispatch Banner for Volunteers */}
        {liveDispatchAlert && !isLoginPage && (
          <div className="bg-alertRed/95 text-white p-3.5 border-b-2 border-alertRed shadow-2xl backdrop-blur-md sticky top-0 z-50 animate-in slide-in-from-top">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-alertRed/30 border border-alertRed flex items-center justify-center shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-alertRed animate-ping"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-gold.light bg-gold/20 px-2 py-0.5 rounded border border-gold/30 font-heading">
                      COMMAND CENTRE DISPATCH • {liveDispatchAlert.templeName}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{liveDispatchAlert.timestamp}</span>
                  </div>
                  <p className="text-xs font-bold text-white mt-0.5">{liveDispatchAlert.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLiveDispatchAlert(null)}
                className="px-3 py-1 bg-alertRed hover:bg-alertRed/90 text-white font-black text-xs rounded-lg shadow-sm uppercase shrink-0 font-heading"
              >
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        )}

        <main className="pb-24">
          {loading ? (
            <div className="min-h-screen flex items-center justify-center text-sm font-semibold">Verifying volunteer access...</div>
          ) : !isLoginPage && !isLoggedIn ? (
            <Navigate to="/v/login" replace />
          ) : (
            children
          )}
        </main>
        {showVolunteerBottomNav && <VolunteerBottomNav isStandalone={true} />}
      </div>
    </ErrorBoundary>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

export function VolunteerApp() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <ScrollToTop />
        <VolunteerAuthProvider>
          <VolunteerLayout>
            <Routes>
              <Route path="/v/login" element={<VolunteerLogin />} />
              <Route path="/v/dashboard" element={<Navigate to="/v/scan" replace />} />
              <Route path="/v/scan" element={<VolunteerScanPage />} />
              <Route path="/v/scan-result/:qrId" element={<VolunteerScanResultPage />} />
              <Route path="/v/medical/:alertId" element={<VolunteerMedicalAlertPage />} />
              <Route path="/v/alerts" element={<VolunteerAlertsPage />} />
              <Route path="/v/lost-found" element={<VolunteerLostFoundPage />} />
              <Route path="/v/gate-alerts" element={<VolunteerGateAlertsPage />} />
              <Route path="/v/prasad" element={<VolunteerPrasadCounterPage />} />
              <Route path="/v/footwear" element={<VolunteerFootwearPage />} />
              <Route path="/v/footwear-result/:qrId" element={<VolunteerFootwearResultPage />} />
              <Route path="/v/inner-gate" element={<VolunteerInnerGatePage />} />
              <Route path="/v/profile" element={<VolunteerProfilePage />} />
              
              {/* Cross-portal link: Return to Pilgrim Portal */}
              <Route path="/home" element={<Navigate to="/" replace />} />
              
              {/* Default redirect for / or any unknown route */}
              <Route path="/" element={<Navigate to="/v/scan" replace />} />
              <Route path="*" element={<Navigate to="/v/scan" replace />} />
            </Routes>
          </VolunteerLayout>
        </VolunteerAuthProvider>
      </LanguageProvider>
    </HashRouter>
  );
}
