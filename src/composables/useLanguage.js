import { ref } from 'vue'

// Shared reactive state (singleton pattern — same instance across all components)
const selectedLanguage = ref(localStorage.getItem('lastLearningLanguage') || null)

// Flag emoji mapping for interface languages
const languageFlags = {
  'deutsch': '\u{1F1E9}\u{1F1EA}',
  'english': '\u{1F1EC}\u{1F1E7}',
  'fran\u00E7ais': '\u{1F1EB}\u{1F1F7}',
  'espa\u00F1ol': '\u{1F1EA}\u{1F1F8}',
  'italiano': '\u{1F1EE}\u{1F1F9}',
  'portugu\u00EAs': '\u{1F1F5}\u{1F1F9}',
  'polski': '\u{1F1F5}\u{1F1F1}',
  't\u00FCrk\u00E7e': '\u{1F1F9}\u{1F1F7}',
  '\u0627\u0644\u0639\u0631\u0628\u064A\u0629': '\u{1F1F8}\u{1F1E6}',
  '\u4E2D\u6587': '\u{1F1E8}\u{1F1F3}',
  '\u65E5\u672C\u8A9E': '\u{1F1EF}\u{1F1F5}',
  '\uD55C\uAD6D\uC5B4': '\u{1F1F0}\u{1F1F7}',
}

function setLanguage(lang) {
  selectedLanguage.value = lang
  if (lang) {
    localStorage.setItem('lastLearningLanguage', lang)
  } else {
    localStorage.removeItem('lastLearningLanguage')
  }
}

function getFlag(lang) {
  return languageFlags[lang] || '\u{1F310}'
}

export function useLanguage() {
  return {
    selectedLanguage,
    languageFlags,
    setLanguage,
    getFlag
  }
}
