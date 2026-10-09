import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-family-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './family.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class FamilyArt {}
