import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Visibility } from '../../../model/types';

@Component({
  selector: 'app-visibility-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  templateUrl: './visibility-badge.html',
  styleUrl: './visibility-badge.css',
})
export class VisibilityBadge {
  readonly visibility = input.required<Visibility>();
}
