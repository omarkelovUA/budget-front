import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { email, form, FormField, required } from '@angular/forms/signals';
import { TranslocoDirective } from '@jsverse/transloco';
import { TranslocoDatePipe, TranslocoDecimalPipe } from '@jsverse/transloco-locale';
import { Observable } from 'rxjs';
import { SubscriptionState } from '../../../model/types';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { DashboardArt } from '../../../shared/ui/illustrations/dashboard-art';
import { EmptyArt } from '../../../shared/ui/illustrations/empty-art';
import { OperatorRepository } from '../data/operator-repository';
import { DailyBars } from '../daily-bars/daily-bars';

// The states Play reports, in the order the page lists them.
const PLAY_STATES: SubscriptionState[] = [
  'active',
  'in_grace',
  'canceled',
  'on_hold',
  'paused',
  'pending',
  'expired',
];

// For whoever runs the service (operatorGuard): usage over the last 30 days, and the free
// access given by hand (backend ARCHITECTURE §3.4, §3.5).
@Component({
  selector: 'app-operator-page',
  imports: [
    FormField,
    TranslocoDirective,
    TranslocoDatePipe,
    TranslocoDecimalPipe,
    PageHeader,
    DashboardArt,
    EmptyArt,
    DailyBars,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './operator-page.html',
  styleUrl: './operator-page.css',
})
export class OperatorPage {
  private readonly operatorRepository = inject(OperatorRepository);

  protected readonly playStates = PLAY_STATES;

  protected readonly statsResource = rxResource({
    stream: () => this.operatorRepository.getStats(),
  });
  protected readonly grantsResource = rxResource({
    stream: () => this.operatorRepository.getGrants(),
  });

  // until: 'YYYY-MM-DD', the last day of access; empty for no end.
  private readonly grantModel = signal({ email: '', until: '' });
  protected readonly grantForm = form(this.grantModel, (f) => {
    required(f.email);
    email(f.email);
  });

  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  grant() {
    if (!this.grantForm().valid()) return;
    const { email, until } = this.grantForm().value();
    // Through the end of the chosen day, in the operator's time zone.
    const expiresAt = until ? new Date(`${until}T23:59:59`) : null;
    this.run(this.operatorRepository.grant(email, expiresAt), () =>
      this.grantModel.set({ email: '', until: '' }),
    );
  }

  revoke(userId: string) {
    this.run(this.operatorRepository.revoke(userId), () => undefined);
  }

  // A grant changes who's entitled, so the numbers are reloaded along with the list.
  private run<T>(request$: Observable<T>, onSuccess: () => void) {
    this.pending.set(true);
    this.errorMessage.set(null);
    request$.subscribe({
      next: () => {
        this.pending.set(false);
        onSuccess();
        this.grantsResource.reload();
        this.statsResource.reload();
      },
      error: (err: Error) => {
        this.pending.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }
}
