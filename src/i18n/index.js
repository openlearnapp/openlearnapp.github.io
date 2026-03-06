import { createI18n } from 'vue-i18n'
import en from './en.json'
import de from './de.json'
import fa from './fa.json'
import ar from './ar.json'

// Map content language folders to UI locale codes
const languageToLocale = {
  'english': 'en',
  'deutsch': 'de',
  'farsi': 'fa',
  'فارسی': 'fa',
  'arabic': 'ar',
  'العربية': 'ar',
}

// RTL languages
const rtlLocales = ['fa', 'ar']

export function getLocaleForLanguage(lang) {
  return languageToLocale[lang] || 'en'
}

export function isRtlLocale(locale) {
  return rtlLocales.includes(locale)
}

const savedLang = localStorage.getItem('lastLearningLanguage')
const initialLocale = savedLang ? (languageToLocale[savedLang] || 'en') : 'en'

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: { en, de, fa, ar },
})

export default i18n
