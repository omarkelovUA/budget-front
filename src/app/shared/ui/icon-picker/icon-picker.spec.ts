import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField } from '@angular/forms/signals';
import { IconPicker } from './icon-picker';

@Component({
  imports: [IconPicker, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-icon-picker [formField]="form.icon" [icons]="['card', 'cash', 'bank']" label="Icon" />`,
})
class Host {
  readonly model = signal({ icon: 'assets/cash.svg' });
  readonly form = form(this.model);
}

describe('IconPicker', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const radios = Array.from(el.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
    return { fixture, el, radios };
  }

  it('shows the offered icons with translated names and the current one checked', async () => {
    const { el, radios } = await render();

    expect(el.querySelector('[role="radiogroup"]')?.getAttribute('aria-label')).toBe('Icon');
    expect(radios.map((r) => r.getAttribute('aria-label'))).toEqual(['Картка', 'Готівка', 'Банк']);
    expect(radios.map((r) => r.checked)).toEqual([false, true, false]);
    expect((el.querySelector('img') as HTMLImageElement).getAttribute('src')).toBe('assets/card.svg');
  });

  it('writes the picked icon back to the form field', async () => {
    const { fixture, radios } = await render();

    radios[2].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.model().icon).toBe('assets/bank.svg');
  });
});
