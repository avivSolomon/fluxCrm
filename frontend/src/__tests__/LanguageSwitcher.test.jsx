import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Replace the server call and the page reload; keep the real language list.
const updateLanguage = vi.fn(() => Promise.resolve({ success: true }));
vi.mock('@/request', () => ({ request: { updateLanguage: (...a) => updateLanguage(...a) } }));
const setLanguage = vi.fn();
vi.mock('@/locale/language', async (importOriginal) => ({
  ...(await importOriginal()),
  setLanguage: (...a) => setLanguage(...a),
}));

import LanguageSwitcher from '@/apps/Header/LanguageSwitcher';

describe('<LanguageSwitcher />', () => {
  beforeEach(() => {
    updateLanguage.mockClear();
    setLanguage.mockClear();
  });

  test('shows the current language', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button').textContent).toContain('English');
  });

  test('choosing Hebrew saves it on the server, then applies it', async () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(await screen.findByRole('menuitem', { name: /עברית/ }));
    await waitFor(() => expect(setLanguage).toHaveBeenCalledWith('he_il'));
    expect(updateLanguage).toHaveBeenCalledWith({ language: 'he_il' });
    // the server is updated before the page is reloaded in the new language
    expect(updateLanguage.mock.invocationCallOrder[0]).toBeLessThan(
      setLanguage.mock.invocationCallOrder[0]
    );
  });

  test('choosing the language that is already active does nothing', async () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(await screen.findByRole('menuitem', { name: /English/ }));
    expect(updateLanguage).not.toHaveBeenCalled();
    expect(setLanguage).not.toHaveBeenCalled();
  });
});
