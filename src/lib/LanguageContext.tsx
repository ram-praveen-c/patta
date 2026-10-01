import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, type Language, type Translations } from "./i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  debugMode: boolean;
  setDebugMode: (val: boolean) => void;
  toggleDebugMode: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("landlens_language");
    return (saved as Language) || "en";
  });

  const [debugMode, setDebugModeState] = useState<boolean>(() => {
    return localStorage.getItem("landlens_debug_mode") === "true";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("landlens_language", lang);
  };

  const setDebugMode = (val: boolean) => {
    setDebugModeState(val);
    localStorage.setItem("landlens_debug_mode", String(val));
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        debugMode,
        setDebugMode,
        toggleDebugMode
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
};
