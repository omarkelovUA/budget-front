import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-account-close-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-close.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class AccountCloseArt {}
