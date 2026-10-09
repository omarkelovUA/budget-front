import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-settings-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class SettingsArt {}
