import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Modal } from './modal';
import { pressEscape, stubDialogs } from './modal.testing';

@Component({
  imports: [Modal],
  template: `
    <button type="button" (click)="shown.set(true)">Open</button>
    @if (shown()) {
      <app-modal labelledBy="title" (closed)="shown.set(false)"><h2 id="title">Title</h2></app-modal>
    }
  `,
})
class Host {
  readonly shown = signal(false);
}

describe('Modal', () => {
  beforeEach(() => stubDialogs());

  async function render() {
    const fixture = TestBed.createComponent(Host);
    document.body.append(fixture.nativeElement);
    const opener = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    opener.focus();
    opener.click();
    await fixture.whenStable();
    return { fixture, dialog: fixture.nativeElement.querySelector('dialog') as HTMLDialogElement };
  }

  it('opens as a modal dialog named by its heading', async () => {
    const { dialog } = await render();

    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('aria-labelledby')).toBe('title');
    expect(dialog.querySelector('h2')?.textContent).toBe('Title');
  });

  it('emits closed on Esc', async () => {
    const { fixture, dialog } = await render();

    await pressEscape(dialog);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
  });

  it('hands focus back to its opener when the parent removes it', async () => {
    const { fixture } = await render();
    (fixture.nativeElement.querySelector('h2') as HTMLElement).tabIndex = -1;
    (fixture.nativeElement.querySelector('h2') as HTMLElement).focus();

    fixture.componentInstance.shown.set(false);
    await fixture.whenStable();

    expect(document.activeElement?.textContent).toBe('Open');
  });
});
