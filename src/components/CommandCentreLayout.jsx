import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Video, Activity, Radio, HeartPulse, Sparkles, TrendingUp, Ticket, Zap, Users, ShieldCheck, Settings, ChevronRight, Menu, X, Bell, LogOut, Layers } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'drishti', label: 'Drishti AI', icon: Video, badge: 'Camera' },
  { id: 'prana', label: 'Prana Nirvighna', icon: Activity, badge: 'Risk' },
  { id: 'dhwani', label: 'Dhwani Rakshak', icon: Radio, badge: 'Audio' },
  { id: 'sanjeevani', label: 'Sanjeevani Path', icon: HeartPulse, badge: 'Medical' },
  { id: 'prediction', label: 'AI Prediction', icon: TrendingUp, badge: 'Forecast' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const CommandCentreLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentLanguage, setLanguage } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);

  // Sync active tab from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/cc/drishti')) setActiveTab('drishti');
    else if (path.includes('/cc/prana')) setActiveTab('prana');
    else if (path.includes('/cc/dhwani')) setActiveTab('dhwani');
    else if (path.includes('/cc/sanjeevani')) setActiveTab('sanjeevani');
    else if (path.includes('/cc/prediction')) setActiveTab('prediction');
    else if (path.includes('/cc/settings')) setActiveTab('settings');
    else setActiveTab('dashboard');
  }, [location.pathname]);

  // Mock notification system
  useEffect(() => {
    const handleNotification = (e) => {
      if (e.detail) {
        setNotifications(prev => [e.detail, ...prev.slice(0, 9)]);
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.5);
        } catch (_) {}
      }
    };
    window.addEventListener('nirvighna_notification_alert', handleNotification);
    return () => window.removeEventListener('nirvighna_notification_alert', handleNotification);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-amber-300 font-body selection:bg-amber-600 selection:text-slate-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0D0D14] border-r border-amber-500/20 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand */}
        <div className="p-4 sm:p-5 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <img src="/official_logo.png" alt="" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-300">Nirvighna</p>
              <p className="text-[10px] text-slate-500">Command Centre</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800/50"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hub info */}
        <div className="px-4 py-3 border-b border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">Active Station</p>
          <p className="text-xs text-amber-400 font-medium mt-0.5 leading-snug">Somnath Command Ops</p>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={(e) => { e.preventDefault(); setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  active 
                    ? 'bg-amber-500/15 text-amber-300 border-r-2 border-amber-500 font-bold' 
                    : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/50'
                }`}
              >
                <item.icon className={`w-4.5 h-4.5 shrink-0 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge && (
                  <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-bold ${active ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/50 rounded-xl border border-slate-700">
            <Bell className="w-5 h-5 text-amber-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400">Live Alerts</p>
              <p className="text-xs font-bold text-amber-300">3 Active</p>
            </div>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
          <button
            onClick={() => navigate('/cc/login')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#0D0D14]/95 backdrop-blur-xl border-b border-amber-500/20">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800/50"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <img src="/official_logo.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-amber-300">Nirvighna</p>
                  <p className="text-[9px] text-slate-500">Command Centre</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="flex bg-slate-800/50 rounded-full p-1 border border-slate-700 gap-0.5">
                {['en', 'hi', 'gu'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                      currentLanguage === lang
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800/50">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-2 border-l border-slate-700">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-amber-300">Command Officer</p>
                  <p className="text-[9px] text-slate-500 font-mono">Somnath Station</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Notifications Panel */}
        {notifications.length > 0 && (
          <div className="fixed top-16 right-4 z-40 w-80 sm:w-96 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Live Alerts
              </h3>
              <button onClick={() => setNotifications([])} className="text-slate-500 hover:text-slate-300 text-xs">Clear All</button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.map((n, i) => (
                <div key={i} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="text-xs font-bold text-amber-300">{n.title}</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">{n.message}</p>
                  <p className="text-[9px] text-slate-500 mt-1">{n.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default CommandCentreLayout;