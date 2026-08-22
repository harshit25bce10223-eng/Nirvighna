import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const NirvighnaLoader = ({ message, lang: langOverride }) => {
  let activeLang = langOverride || 'en';
  try {
    const langContext = useLanguage();
    if (!langOverride && langContext && langContext.currentLanguage) {
      activeLang = langContext.currentLanguage;
    }
  } catch (e) {
    activeLang = langOverride || 'en';
  }

  const loaderConfig = {
    en: {
      word: 'NIRVIGHNA',
      letters: ['N', 'I', 'R', 'V', 'I', 'G', 'H', 'N', 'A'],
      defaultMsg: 'Sacred Pilgrim Portal',
      fontSize: 'text-sm sm:text-base tracking-widest',
      gap: 'gap-0.5'
    },
    hi: {
      word: 'निर्विघ्न',
      letters: ['निर्विघ्न'],
      defaultMsg: 'पवित्र तीर्थ पोर्टल',
      fontSize: 'text-xl sm:text-2xl tracking-normal',
      gap: 'gap-0'
    },
    gu: {
      word: 'નિર્વિઘ્ન',
      letters: ['નિર્વિઘ્ન'],
      defaultMsg: 'પવિત્ર યાત્રા પોર્ટલ',
      fontSize: 'text-xl sm:text-2xl tracking-normal',
      gap: 'gap-0'
    }
  };

  const current = loaderConfig[activeLang] || loaderConfig.en;

  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-6 animate-in fade-in select-none">
      {/* logo container */}
      <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center">
        {/* glowing aura */}
        <div className="absolute inset-0 rounded-full border-2 border-gold/40 animate-ping duration-1000"></div>
        <div className="absolute -inset-1.5 rounded-full border border-maroon/30 animate-spin-slow"></div>

        
        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-gold/70 overflow-hidden p-1">
          <img 
            src="/official_logo.png" 
            alt="Nirvighna Emblem" 
            className="w-full h-full object-contain crisp-img select-none"
          />
        </div>
      </div>
      
      {/* animated text */}
      <div className={`flex items-center ${current.gap} font-heading font-black ${current.fontSize} text-transparent bg-clip-text bg-gradient-to-r from-maroon via-red-900 to-maroon`}>
        {current.letters.map((char, index) => (
          <span
            key={index}
            className="animate-letter drop-shadow-2xs inline-block text-maroon"
            style={{ animationDelay: `${index * 130}ms` }}
          >
            {char}
          </span>
        ))}
      </div>
      
      <p className="text-[10px] sm:text-[11px] text-amber-800/80 font-bold uppercase tracking-widest text-center max-w-[240px] leading-relaxed font-heading">
        {message || current.defaultMsg}
      </p>
    </div>
  );
};

export default NirvighnaLoader;
