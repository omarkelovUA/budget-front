import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AccountAccess } from '../../../model/types';

const LABELS: Record<AccountAccess, string> = {
  owner: 'Мій',
  shared: 'Спільний',
  visible: 'Перегляд',
  none: '',
};

// The current user's access to an account (or a transaction on it).
@Component({
  selector: 'app-access-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="access-badge" [class]="access()">{{ label() }}</span>`,
  styleUrl: './access-badge.css',
})
export class AccessBadge {
  readonly access = input.required<AccountAccess>();
  protected readonly label = computed(() => LABELS[this.access()]);
}
