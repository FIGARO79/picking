import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    // 1. Verificar preferencia manual guardada
    const saved = localStorage.getItem('auditor_lang');
    if (saved === 'es' || saved === 'pt') return saved;

    // 2. Autodetectar el idioma del navegador/dispositivo
    try {
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang && browserLang.toLowerCase().startsWith('pt')) {
        return 'pt'; // Portugués de Brasil
      }
    } catch (e) {
      console.warn("No se pudo autodetectar el idioma:", e);
    }

    // 3. Fallback a español
    return 'es';
  });

  const changeLanguage = (lang) => {
    if (lang === 'es' || lang === 'pt') {
      setLocale(lang);
      localStorage.setItem('auditor_lang', lang);
    }
  };

  // Función de traducción simple t(key) con fallback a español
  const t = (key) => {
    if (!translations[locale] || !translations[locale][key]) {
      // Fallback a español
      if (translations['es'] && translations['es'][key]) {
        return translations['es'][key];
      }
      return key;
    }
    return translations[locale][key];
  };

  const contextValue = useMemo(() => ({
    locale,
    changeLanguage,
    t
  }), [locale]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation debe ser usado dentro de un LanguageProvider');
  }
  return context;
};
