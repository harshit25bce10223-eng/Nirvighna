import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Signup } from './pages/Signup';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Booking } from './pages/Booking';
import { Pass } from './pages/Pass';
import { Travel } from './pages/Travel';
import { Family } from './pages/Family';
import { LostReport } from './pages/LostReport';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { MyBookings } from './pages/MyBookings';
import { MelaRoute } from './pages/MelaRoute';
import { VolunteerHub } from './pages/VolunteerHub';
import { VolunteerDashboard } from './components/VolunteerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { BottomNav } from './components/BottomNav';
import { Navbar } from './components/Navbar';
import { PriorityAudioNav } from './components/PriorityAudioNav';
import { useAuth } from './context/AuthContext';

import { AdminLogin } from './pages/admin/AdminLogin';
import { VolunteerAuthProvider, useVolunteerAuth } from './context/VolunteerAuthContext';
import { VolunteerBottomNav } from './components/VolunteerBottomNav';
import { VolunteerLogin } from './pages/volunteer/VolunteerLogin';
import { VolunteerDashboardPage } from './pages/volunteer/VolunteerDashboardPage';
import { VolunteerScanPage } from './pages/volunteer/VolunteerScanPage';
import { VolunteerScanResultPage } from './pages/volunteer/VolunteerScanResultPage';
import { VolunteerAlertsPage } from './pages/volunteer/VolunteerAlertsPage';
import { VolunteerMedicalAlertPage } from './pages/volunteer/VolunteerMedicalAlertPage';
import { VolunteerLostFoundPage } from './pages/volunteer/VolunteerLostFoundPage';
import { VolunteerProfilePage } from './pages/volunteer/VolunteerProfilePage';
import { VolunteerPrasadCounterPage } from './pages/volunteer/VolunteerPrasadCounterPage';
import { VolunteerFootwearPage } from './pages/volunteer/VolunteerFootwearPage';

import { ErrorBoundary } from './components/ErrorBoundary';
import { isDemoMode } from './lib/runtimeMode';

const CommandCentre = React.lazy(() => import('./components/CommandCentre').then(module => ({ default: module.CommandCentre })));

// Layout wrapper for Pilgrim Portal
const Layout = ({ children }) => {
  const location = useLocation();
  const { isLoggedIn, loading } = useAuth();
  
  const isVolunteerRoute = location.pathname.startsWith('/v');
  const publicRoutes = ['/signup', '/login'];
  const showNav = !isVolunteerRoute && isLoggedIn && !publicRoutes.includes(location.pathname) && !loading;

  return (
    <ErrorBoundary sectionName="Pilgrim Portal">
      <div className="min-h-screen bg-ivory text-gray-900 font-body flex flex-col selection:bg-gold selection:text-indigo-dark">
        {showNav && <Navbar />}
        <main className="flex-1 pb-20">
          {children}
        </main>
        {showNav && <BottomNav />}
      </div>
    </ErrorBoundary>
  );
};

// Layout wrapper for Volunteer Hub
const VolunteerLayout = ({ children }) => {
  const location = useLocation();
  const { isLoggedIn, loading } = useVolunteerAuth();
  const isLoginPage = location.pathname === '/v/login';
  const showVolunteerBottomNav = isLoggedIn && !isLoginPage;

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

    window.addEventListener('nirvighna_temple_alert_dispatch', handleDispatch);
    window.addEventListener('nirvighna_panic_alert', (e) => {
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
    });

    return () => {
      window.removeEventListener('nirvighna_temple_alert_dispatch', handleDispatch);
    };
  }, []);

  return (
    <ErrorBoundary sectionName="Volunteer Operations Hub">
      <div className="min-h-screen bg-gradient-to-br from-[#FAF7F2] via-amber-50/40 to-[#FAF7F2] text-gray-900 font-body selection:bg-gold selection:text-indigo-dark relative">
        {/* Live Command Centre Admin Emergency Dispatch Banner for Volunteers */}
        {liveDispatchAlert && !isLoginPage && (
          <div className="bg-red-950/95 text-red-100 p-3.5 border-b-2 border-red-500 shadow-2xl backdrop-blur-md sticky top-0 z-50 animate-in slide-in-from-top">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500 flex items-center justify-center shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 font-heading">
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
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-lg shadow-sm uppercase shrink-0 font-heading"
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
        {showVolunteerBottomNav && <VolunteerBottomNav />}
      </div>
    </ErrorBoundary>
  );
};

// Role-based protected route wrapper
const RoleRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="text-maroon font-semibold">Verifying authorization...</div>
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser?.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

// Protected route wrapper for general pilgrim pages
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="text-maroon font-semibold">Loading...</div>
      </div>
    );
  }
  
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

// Protect command centre route based on demo mode or admin session
    return <div className="min-h-screen flex items-center justify-center bg-ivory text-maroon font-semibold">Verifying command access...</div>;
  }
  if (!isDemoMode) {
    return isLoggedIn && currentUser?.role === 'admin'
      ? children
      : <Navigate to="/command-centre/login" replace />;
  }

  let adminSession = null;
  try {
    adminSession = JSON.parse(localStorage.getItem('nirvighna_admin_session') || 'null');
  } catch (_) {
    localStorage.removeItem('nirvighna_admin_session');
  }

  return adminSession?.role === 'admin'
    ? children
    : <Navigate to="/command-centre/login" replace />;
};

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <Routes>
        {/* ─── Unified Command Centre — Single Authoritative Hub ─── */}
        <Route
          path="/command-centre/login"
          element={
            <ErrorBoundary sectionName="Command Centre Staff Login">
              <AdminLogin />
            </ErrorBoundary>
          }
        />
        <Route path="/admin/login" element={<Navigate to="/command-centre/login" replace />} />

        <Route
          path="/command-centre"
          element={
            <CommandCentreRoute>
              <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-ivory text-maroon font-semibold">Loading command operations...</div>}>
                <ErrorBoundary sectionName="Command Centre Unified Safety Hub">
                  <CommandCentre />
                </ErrorBoundary>
              </React.Suspense>
            </CommandCentreRoute>
          }
        />
        <Route path="/admin" element={<Navigate to="/command-centre" replace />} />

        {/* ─── Dedicated Volunteer Hub App Routes (/v/*) ─── */}
        <Route
          path="/v/*"
          element={
            <VolunteerAuthProvider>
              <VolunteerLayout>
                <Routes>
                  <Route path="login" element={<VolunteerLogin />} />
                  <Route path="dashboard" element={<VolunteerDashboardPage />} />
                  <Route path="scan" element={<VolunteerScanPage />} />
                  <Route path="scan-result/:qrId" element={<VolunteerScanResultPage />} />
                  <Route path="medical/:alertId" element={<VolunteerMedicalAlertPage />} />
                  <Route path="alerts" element={<VolunteerAlertsPage />} />
                  <Route path="lost-found" element={<VolunteerLostFoundPage />} />
                  <Route path="prasad" element={<VolunteerPrasadCounterPage />} />
                  <Route path="footwear" element={<VolunteerFootwearPage />} />
                  <Route path="profile" element={<VolunteerProfilePage />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </VolunteerLayout>
            </VolunteerAuthProvider>
          }
        />

        {/* ─── All pilgrim portal routes inside the shared Layout ─── */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                {/* Public routes */}
                <Route path="/signup" element={<Signup />} />
                <Route path="/login" element={<Login />} />

                {/* Protected routes */}
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/book/:templeId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
                <Route path="/pass" element={<ProtectedRoute><Pass /></ProtectedRoute>} />
                <Route path="/travel" element={<ProtectedRoute><Travel /></ProtectedRoute>} />
                <Route path="/family" element={<ProtectedRoute><Family /></ProtectedRoute>} />
                <Route path="/lost-report" element={<ProtectedRoute><LostReport /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
                <Route path="/mela-route" element={<ProtectedRoute><MelaRoute /></ProtectedRoute>} />
                <Route path="/priority-nav" element={<ProtectedRoute><PriorityAudioNav /></ProtectedRoute>} />

                <Route path="/volunteer-hub" element={<RoleRoute allowedRoles={['volunteer', 'admin']}><VolunteerHub /></RoleRoute>} />
                <Route path="/volunteer" element={<RoleRoute allowedRoles={['volunteer', 'admin']}><VolunteerDashboard /></RoleRoute>} />

                {/* Default redirect */}
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
