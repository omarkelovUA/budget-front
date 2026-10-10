import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, DOCUMENT, ElementRef, inject, input, output, viewChild } from '@angular/core';

// A modal <dialog> around a form: opens as soon as it's rendered, so the parent shows
// it with @if. Esc closes it and emits (closed); the parent then removes it, and focus
// goes back to whatever opened it.
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="modal" [attr.aria-labelledby]="labelledBy()" (close)="closed.emit()">
      <ng-content />
    </dialog>
  `,
  styleUrl: './modal.css',
})
export class Modal {
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  // The id of the content's heading.
  readonly labelledBy = input.required<string>();
  readonly closed = output();

  constructor() {
    const document = inject(DOCUMENT);
    let opener: HTMLElement | null = null;
    afterNextRender(() => {
      opener = document.activeElement as HTMLElement | null;
      this.dialog().nativeElement.showModal();
    });
    // The dialog is already out of the DOM by then, so the browser doesn't hand focus
    // back to the button that opened it.
    inject(DestroyRef).onDestroy(() => opener?.focus());
  }
}
