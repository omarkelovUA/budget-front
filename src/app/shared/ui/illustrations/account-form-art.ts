import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-account-form-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-form.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class AccountFormArt {}
