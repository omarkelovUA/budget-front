import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// The top of every page: title and subtitle on the primary gradient, the page's
// illustration on the right ([art]) and its main actions ([actions]).
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
