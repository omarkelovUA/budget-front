import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-transactions-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transactions.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class TransactionsArt {}
