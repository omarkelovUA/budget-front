import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EmptyArt } from '../illustrations/empty-art';
import { PageHeader } from './page-header';

@Component({
  imports: [PageHeader, EmptyArt],
  template: `
    <app-page-header title="T" subtitle="S">
      <app-empty-art art />
      <button actions type="button">Add</button>
    </app-page-header>
  `,
})
class Host {}

describe('PageHeader', () => {
  it('shows the title, subtitle, actions and the illustration', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h1')?.textContent?.trim()).toBe('T');
    expect(el.querySelector('.subtitle')?.textContent?.trim()).toBe('S');
    expect(el.querySelector('.page-header-actions button')?.textContent).toBe('Add');
    expect(el.querySelector('.page-header-art app-empty-art svg')).not.toBeNull();
  });
});
