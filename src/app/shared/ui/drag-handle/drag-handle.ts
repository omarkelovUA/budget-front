import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { Icon } from '../icon/icon';

// The grip a card is dragged by (inside a cdkDrag), so clicking the card still opens it
// and touch scrolling still works. From the keyboard, the arrow keys move the card one
// place back or forward: (move) emits -1 or +1, and focus stays on the handle.
@Component({
  selector: 'app-drag-handle',
  imports: [Icon],
  hostDirectives: [CdkDragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-icon src="assets/drag.svg" />`,
  styleUrl: './drag-handle.css',
  host: {
    role: 'button',
    tabindex: '0',
    '[attr.aria-label]': 'label()',
    '[title]': 'label()',
    '(keydown.arrowup)': 'step($event, -1)',
    '(keydown.arrowleft)': 'step($event, -1)',
    '(keydown.arrowdown)': 'step($event, 1)',
    '(keydown.arrowright)': 'step($event, 1)',
  },
})
export class DragHandle {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly label = input.required<string>();
  readonly move = output<-1 | 1>();

  protected step(event: Event, by: -1 | 1) {
    event.preventDefault();
    this.move.emit(by);
    // The card is moved in the DOM, which can drop focus; bring it back once rendered.
    setTimeout(() => this.host.nativeElement.focus());
  }
}
