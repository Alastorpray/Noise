import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import es from './locales/es.json'
import de from './locales/de.json'

// Detectar idioma del navegador
const getBrowserLanguage = () => {
  const lang = navigator.language || navigator.userLanguage
  const shortLang = lang.split('-')[0]
  if (['en', 'es', 'de'].includes(shortLang)) {
    return shortLang
  }
  return 'en' // Default
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      de: { translation: de }
    },
    lng: getBrowserLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
