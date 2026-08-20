import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Shield, UserCheck, ShieldAlert, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const brandTitles = {
  en: 'NIRVIGHNA',
  hi: 'निर्विघ्न',
  gu: 'નિર્વિઘ્ન',
};

const brandSubtitles = {
  en: 'Gujarat Pilgrim Portal',
  hi: 'गुजरात तीर्थ पोर्टल',
  gu: 'ગુજરાત તીર્થ પોર્ટલ',
};

const roleTranslations = {
  en: { pilgrim: 'PILGRIM', volunteer: 'Volunteer', admin: 'Admin' },
  hi: { pilgrim: 'श्रद्धालु', volunteer: 'स्वयंसेवक', admin: 'व्यवस्थापक' },
  gu: { pilgrim: 'યાત્રાળુ', volunteer: 'સ્વયંસેવક', admin: 'એડમિન' },
};

export const Navbar = () => {
  const { currentUser } = useAuth();
  const { currentLanguage, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLanguage = () => {
    const nextLang = currentLanguage === 'en' ? 'hi' : currentLanguage === 'hi' ? 'gu' : 'en';
    setLanguage(nextLang);
  };

  const getActiveRole = () => {
    if (location.pathname.startsWith('/volunteer')) return 'volunteer';
    if (location.pathname.startsWith('/admin')) return 'admin';
    return 'pilgrim';
  };

  const activeRole = getActiveRole();

  return (
    <header className="relative bg-[#0F0D22]/95 backdrop-blur-2xl text-white border-b border-gold/30 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
      {/* Top subtle golden light streak */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold/80 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand Header */}
        <div 
          onClick={() => navigate('/home')}
          className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group select-none shrink-0"
        >
          {/* Logo Emblem with Divine Halo */}
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[2px] bg-gradient-to-tr from-gold via-amber-200 to-amber-500 shadow-[0_0_14px_rgba(235,178,57,0.35)] group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(235,178,57,0.55)] transition-all duration-300 overflow-hidden flex items-center justify-center bg-white shrink-0">
            <img 
              src="/official_logo.png" 
              alt="Nirvighna Official Temple Emblem" 
              className="w-full h-full object-contain p-0.5 drop-shadow-md" 
            />
          </div>

          {/* Brand Title & Devotional Sub-tagline */}
          <div className="flex flex-col justify-center min-w-[95px] sm:min-w-[130px]">
            <h1 className="text-lg sm:text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-gold font-heading leading-tight whitespace-nowrap drop-shadow-xs">
              {brandTitles[currentLanguage] || 'NIRVIGHNA'}
            </h1>
            <span className="hidden sm:block text-[8.5px] font-extrabold tracking-widest text-amber-300/80 uppercase leading-none font-sans mt-0.5">
              {brandSubtitles[currentLanguage] || 'Gujarat Pilgrim Portal'}
            </span>
          </div>
        </div>

        {/* Action Controls & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Language Switcher Pill */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-white/10 hover:bg-gold hover:text-indigo-dark text-amber-100 border border-gold/35 hover:border-gold transition-all duration-200 shadow-sm active:scale-95 cursor-pointer backdrop-blur-md font-heading group"
            title="Switch Language (English / हिन्दी / ગુજરાતી)"
          >
            <Globe className="w-3.5 h-3.5 text-gold group-hover:text-indigo-dark transition-transform duration-300 group-hover:rotate-45" />
            <span className="tracking-wide text-xs">
              {currentLanguage === 'en' ? 'English' : currentLanguage === 'hi' ? 'हिन्दी' : 'ગુજરાતી'}
            </span>
          </button>

          {/* Role Badge / Switcher */}
          {currentUser?.role === 'admin' ? (
            /* Admin sees all 3 options */
            <div className="bg-indigo-card/90 backdrop-blur-md p-1 rounded-xl border border-gold/30 flex items-center gap-1 text-xs font-bold shadow-inner">
              <button
                onClick={() => navigate('/home')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeRole === 'pilgrim' ? 'bg-gold text-indigo-dark shadow-sm font-black' : 'text-gray-300 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{roleTranslations[currentLanguage]?.pilgrim || 'Pilgrim'}</span>
              </button>
              <button
                onClick={() => navigate('/volunteer')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeRole === 'volunteer' ? 'bg-gold text-indigo-dark shadow-sm font-black' : 'text-gray-300 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{roleTranslations[currentLanguage]?.volunteer || 'Volunteer'}</span>
              </button>
              <button
                onClick={() => navigate('/admin')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeRole === 'admin' ? 'bg-maroon text-ivory shadow-sm font-black' : 'text-gray-300 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{roleTranslations[currentLanguage]?.admin || 'Admin'}</span>
              </button>
            </div>
          ) : currentUser?.role === 'volunteer' ? (
            /* Volunteer sees Pilgrim + Volunteer */
            <div className="bg-indigo-card/90 backdrop-blur-md p-1 rounded-xl border border-gold/30 flex items-center gap-1 text-xs font-bold shadow-inner">
              <button
                onClick={() => navigate('/home')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeRole === 'pilgrim' ? 'bg-gold text-indigo-dark shadow-sm font-black' : 'text-gray-300 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{roleTranslations[currentLanguage]?.pilgrim || 'Pilgrim'}</span>
              </button>
              <button
                onClick={() => navigate('/volunteer')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeRole === 'volunteer' ? 'bg-gold text-indigo-dark shadow-sm font-black' : 'text-gray-300 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{roleTranslations[currentLanguage]?.volunteer || 'Volunteer'}</span>
              </button>
            </div>
          ) : (
            /* Normal Pilgrim Badge — Clean, Royal Gold Glass Pill */
            <div className="flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-gold/25 to-amber-500/15 border border-gold/50 text-gold font-heading tracking-wide shadow-[0_2px_12px_rgba(235,178,57,0.15)] backdrop-blur-md select-none transition-all">
              <UserCheck className="w-3.5 h-3.5 text-gold shrink-0 drop-shadow-xs" />
              <span className="tracking-wider">{roleTranslations[currentLanguage]?.pilgrim || 'PILGRIM'}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

