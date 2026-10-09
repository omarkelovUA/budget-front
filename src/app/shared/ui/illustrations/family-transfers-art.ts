import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-family-transfers-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './family-transfers.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class FamilyTransfersArt {}
