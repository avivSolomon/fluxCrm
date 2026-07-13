// FluxCRM language configuration (original addition).
// Hebrew + English, with automatic RTL for Hebrew.

export const LANG_STORAGE_KEY = 'fluxcrm_language';

export const LANGUAGES = [
  { code: 'en_us', label: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'he_il', label: 'עברית', flag: '🇮🇱', dir: 'rtl' },
];

export const DEFAULT_LANG_CODE = 'en_us';

export function getCurrentLangCode() {
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) return stored;
  } catch (e) {
    /* ignore */
  }
  return DEFAULT_LANG_CODE;
}

export function getCurrentLang() {
  const code = getCurrentLangCode();
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}

// Persist the chosen language and reload so RTL/LTR + antd locale
// are applied cleanly across the whole app.
export function setLanguage(code) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, code);
  } catch (e) {
    /* ignore */
  }
  window.location.reload();
}
