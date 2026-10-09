import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-register-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class RegisterArt {}
