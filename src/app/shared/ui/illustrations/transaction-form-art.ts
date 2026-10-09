import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-transaction-form-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transaction-form.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class TransactionFormArt {}
