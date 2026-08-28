import React from 'react';
import { Home, Calendar, Bell, User, Mic } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const translations = {
  en: {
    home: 'Home',
    bookings: 'Bookings',
    voiceGuide: 'Voice Guide',
    alerts: 'Alerts',
    profile: 'Profile',
  },
  hi: {
    home: 'होम',
    bookings: 'बुकिंग',
    voiceGuide: 'ध्वनि गाइड',
    alerts: 'सूचनाएं',
    profile: 'प्रोफाइल',
  },
  gu: {
    home: 'હોમ',
    bookings: 'બુકિંગ',
    voiceGuide: 'વોઇસ ગાઇડ',
    alerts: 'સૂચના',
    profile: 'પ્રોફાઇલ',
  },
};

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const navItems = [
    { path: '/home',         icon: Home,     label: t.home },
    { path: '/my-bookings',  icon: Calendar, label: t.bookings },
    { path: '/priority-nav', icon: Mic,      label: t.voiceGuide },
    { path: '/notifications',icon: Bell,     label: t.alerts },
    { path: '/profile',      icon: User,     label: t.profile },
  ];

  return (
    <nav className="fixed bottom-[max(env(safe-area-inset-bottom,0px),0.75rem)] left-3 right-3 bg-ivory/95 backdrop-blur-2xl border-2 border-gold/40 py-1.5 px-2 flex justify-around items-center z-50 max-w-lg mx-auto rounded-2xl shadow-temple select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path ||
                        (item.path === '/book' && location.pathname.startsWith('/book'));
        
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`relative flex flex-col items-center justify-center min-w-[58px] px-2 py-1.5 rounded-xl transition-all duration-200 card-press cursor-pointer ${
              isActive
                ? 'bg-gradient-to-br from-maroon via-maroon.dark to-maroon.dark text-gold shadow-md scale-102 ring-1 ring-gold/40'
                : 'text-temple.textMuted hover:text-maroon hover:bg-cream.light/70'
            }`}
          >
            <Icon className={`w-[19px] h-[19px] mb-0.5 transition-transform ${isActive ? 'text-gold.light scale-110' : 'text-temple.textMuted'}`} />
            
            <span className={`text-[10px] font-extrabold leading-tight tracking-tight font-heading ${
              isActive ? 'text-gold.light font-black' : 'temple.text font-bold'
            }`}>
              {item.label}
            </span>

            {/* Active gold indicator dot */}
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-gold mt-0.5 shadow-goldGlow" />
            )}
          </button>
        );
      })}
    </nav>
  );
};


