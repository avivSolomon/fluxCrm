import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import { getCurrentLangCode, getCurrentLang, LANG_STORAGE_KEY } from '@/locale/language';
import useLanguage from '@/locale/useLanguage';

describe('language preference (client side)', () => {
  test('defaults to English when nothing is stored', () => {
    expect(getCurrentLangCode()).toBe('en_us');
    expect(getCurrentLang().dir).toBe('ltr');
  });

  test('a stored Hebrew preference switches the direction to RTL', () => {
    window.localStorage.setItem(LANG_STORAGE_KEY, 'he_il');
    expect(getCurrentLangCode()).toBe('he_il');
    expect(getCurrentLang().dir).toBe('rtl');
  });

  test('an unknown stored value is ignored', () => {
    window.localStorage.setItem(LANG_STORAGE_KEY, 'xx_yy');
    expect(getCurrentLangCode()).toBe('en_us');
  });

  test('translate() uses the active dictionary and falls back to a readable label', () => {
    window.localStorage.setItem(LANG_STORAGE_KEY, 'he_il');
    const { result } = renderHook(() => useLanguage());
    expect(result.current('export_csv')).toBe('ייצוא ל-CSV');
    expect(result.current('some_missing_key')).toBe('Some Missing Key');
  });
});
