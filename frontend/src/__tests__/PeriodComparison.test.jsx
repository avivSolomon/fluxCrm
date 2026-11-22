import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import PeriodComparison from '@/modules/AnalyticsModule/PeriodComparison';

const translate = (k) => k;
const formatMoney = (n) => `$${n}`;
const base = {
  current: { total: 300, count: 1 },
  previous: { total: 100, count: 1 },
  previousFrom: '2025-12',
  previousTo: '2026-01',
};
const show = (changePercent) =>
  render(
    <PeriodComparison
      comparison={{ ...base, changePercent }}
      translate={translate}
      formatMoney={formatMoney}
    />
  );

describe('<PeriodComparison />', () => {
  test('growth is shown in green with a plus sign', () => {
    show(200);
    const tag = screen.getByTestId('change');
    expect(tag.textContent).toContain('+200%');
    expect(tag.className).toContain('green');
    expect(screen.getByText('$100')).toBeTruthy();
  });

  test('a drop is shown in red', () => {
    show(-25.5);
    const tag = screen.getByTestId('change');
    expect(tag.textContent).toContain('-25.5%');
    expect(tag.className).toContain('red');
  });

  test('no earlier data -> a neutral label instead of a percent', () => {
    show(null);
    expect(screen.getByTestId('change').textContent).toBe('no_previous_data');
  });

  test('renders nothing before the data arrives', () => {
    const { container } = render(
      <PeriodComparison comparison={null} translate={translate} formatMoney={formatMoney} />
    );
    expect(container.innerHTML).toBe('');
  });
});
