import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    try {
      return localStorage.getItem('nirvighna_language') || 'en';
    } catch {
      return 'en';
    }
  });

  // Save language to localStorage whenever it changes

  // Save language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nirvighna_language', currentLanguage);
  }, [currentLanguage]);

  const setLanguage = (lang) => {
    setCurrentLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
