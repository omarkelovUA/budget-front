import { TestBed } from '@angular/core/testing';
import { IDailyCount } from '../../../model/types';
import { DailyBars, niceMax } from './daily-bars';

const DAYS: IDailyCount[] = [
  { day: '2026-10-16', count: 3 },
  { day: '2026-10-17', count: 0 },
  { day: '2026-10-18', count: 7 },
];

describe('DailyBars', () => {
  async function render(days = DAYS) {
    const fixture = TestBed.createComponent(DailyBars);
    fixture.componentRef.setInput('days', days);
    fixture.componentRef.setInput('label', 'Реєстрації за днями');
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('rounds the axis top up to 1, 2 or 5 times a power of ten', () => {
    expect([1, 3, 7, 10, 11, 180, 501].map(niceMax)).toEqual([1, 5, 10, 10, 20, 200, 1000]);
  });

  it('draws a column per day with a count, each day a focusable target', async () => {
    const { el } = await render();

    expect(el.querySelectorAll('path.bar')).toHaveLength(2);
    expect(el.querySelectorAll('rect.hit')).toHaveLength(3);
    expect(el.querySelector('svg')?.getAttribute('aria-label')).toBe('Реєстрації за днями');
    expect(Array.from(el.querySelectorAll('.tick')).map((t) => t.textContent?.trim())).toEqual([
      '10',
      '0',
      '16 жовт.',
      '18 жовт.',
    ]);
  });

  it("shows a day's value on focus and hover", async () => {
    const { fixture, el } = await render();
    const third = el.querySelectorAll('rect.hit')[2];

    third.dispatchEvent(new Event('focus'));
    await fixture.whenStable();
    expect(el.querySelector('.tooltip strong')?.textContent).toBe('7');
    expect(el.querySelector('path.bar.active')).not.toBeNull();

    third.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(el.querySelector('.tooltip')).toBeNull();

    el.querySelectorAll('rect.hit')[0].dispatchEvent(new Event('pointerenter'));
    await fixture.whenStable();
    expect(el.querySelector('.tooltip strong')?.textContent).toBe('3');
  });

  it('keeps every value in a table for screen readers', async () => {
    const { el } = await render();

    expect(el.querySelector('caption')?.textContent?.trim()).toBe('Реєстрації за днями');
    expect(
      Array.from(el.querySelectorAll('tbody td:last-child')).map((td) => td.textContent),
    ).toEqual(['3', '0', '7']);
  });
});
