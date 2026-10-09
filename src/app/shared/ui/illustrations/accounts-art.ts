import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-accounts-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accounts.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class AccountsArt {}
