import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';
import es from '@/locales/es.json';
import pt from '@/locales/pt.json';
import ru from '@/locales/ru.json';
import tr from '@/locales/tr.json';
import hi from '@/locales/hi.json';
import id from '@/locales/id.json';
import vi from '@/locales/vi.json';
import ar from '@/locales/ar.json';
import de from '@/locales/de.json';
import fr from '@/locales/fr.json';
import ko from '@/locales/ko.json';
import th from '@/locales/th.json';
import tl from '@/locales/tl.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  es: { translation: es },
  pt: { translation: pt },
  ru: { translation: ru },
  tr: { translation: tr },
  hi: { translation: hi },
  id: { translation: id },
  vi: { translation: vi },
  ar: { translation: ar },
  de: { translation: de },
  fr: { translation: fr },
  ko: { translation: ko },
  th: { translation: th },
  tl: { translation: tl },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'nop-language',
    },
    react: {
      useSuspense: true,
    },
  })
  .catch((error) => {
    console.error('i18n initialization failed:', error);
  });

export default i18n;

