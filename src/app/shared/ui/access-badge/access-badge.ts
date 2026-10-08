import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AccountAccess } from '../../../model/types';

// The current user's access to an account (or a transaction on it).
@Component({
  selector: 'app-access-badge',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="access-badge" [class]="access()">{{
    access() === 'none' ? '' : ('common.accessLevel.' + access() | transloco)
  }}</span>`,
  styleUrl: './access-badge.css',
})
export class AccessBadge {
  readonly access = input.required<AccountAccess>();
}
