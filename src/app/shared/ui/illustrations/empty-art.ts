import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-empty-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class EmptyArt {}
