import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-categories-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categories.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class CategoriesArt {}
