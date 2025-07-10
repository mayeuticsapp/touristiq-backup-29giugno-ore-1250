import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import it from './locales/it.json';
import en from './locales/en.json';
import es from './locales/es.json';
import de from './locales/de.json';

const resources = {
  it: { translation: it },
  en: { translation: en },
  es: { translation: es },
  de: { translation: de }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'it', // Default language
    debug: false,
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;