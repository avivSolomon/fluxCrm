import languages from './translation/translation';
import { getCurrentLangCode } from './language';

// Convert a translation key into a readable Title-Cased fallback
// when the key is missing from the active dictionary.
const toFallbackLabel = (key) => {
  const words = key.replace(/_/g, ' ').split(' ');
  return words.map((w) => (w ? w[0].toUpperCase() + w.substring(1) : w)).join(' ');
};

const getLabel = (lang, key) => {
  try {
    const lowerCaseKey = key
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/ /g, '_');

    if (lang && lang[lowerCaseKey]) return lang[lowerCaseKey];

    return toFallbackLabel(key);
  } catch (error) {
    return 'No translate';
  }
};

const useLanguage = () => {
  const langCode = getCurrentLangCode();
  const lang = languages[langCode] || languages.en_us;

  const translate = (value) => getLabel(lang, value);

  return translate;
};

export default useLanguage;
