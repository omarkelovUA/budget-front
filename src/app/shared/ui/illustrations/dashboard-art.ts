import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class DashboardArt {}
