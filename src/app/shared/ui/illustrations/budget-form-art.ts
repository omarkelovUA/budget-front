import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-budget-form-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './budget-form.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class BudgetFormArt {}
