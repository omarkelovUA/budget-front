import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-budgets-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './budgets.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class BudgetsArt {}
