import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-login-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class LoginArt {}
