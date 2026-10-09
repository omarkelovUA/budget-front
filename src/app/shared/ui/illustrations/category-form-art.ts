import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-category-form-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-form.svg',
  styleUrl: './illustration.css',
  host: { 'aria-hidden': 'true', class: 'art' },
})
export class CategoryFormArt {}
