import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// An SVG from public/assets painted with the current text colour (CSS mask), so icons
// follow the theme; an <img> would keep the file's own colours. Decorative: the
// surrounding control names it.
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  styleUrl: './icon.css',
  host: { 'aria-hidden': 'true', '[style.mask-image]': 'mask()' },
})
export class Icon {
  // A stored icon path, e.g. 'assets/card.svg'.
  readonly src = input.required<string>();
  protected readonly mask = computed(() => `url("${this.src()}")`);
}
