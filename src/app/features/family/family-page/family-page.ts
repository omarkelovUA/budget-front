import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';
import { AuthState } from '../../../core/auth/auth-state';
import { IFamily, IInvite } from '../../../model/types';
import { FamilyRepository } from '../data/family-repository';

@Component({
  selector: 'app-family-page',
  imports: [FormField, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './family-page.html',
  styleUrl: './family-page.css',
})
export class FamilyPage {
  private readonly authState = inject(AuthState);
  private readonly familyRepository = inject(FamilyRepository);

  protected readonly currentUser = this.authState.currentUser;

  private readonly createModel = signal({ name: '' });
  protected readonly createForm = form(this.createModel, (f) => required(f.name));

  private readonly joinModel = signal({ code: '' });
  protected readonly joinForm = form(this.joinModel, (f) => required(f.code));

  protected readonly familyResource = rxResource({
    params: () => this.currentUser()?.familyId ?? undefined,
    stream: () => this.familyRepository.getCurrentFamily(),
  });

  protected readonly isAdmin = computed(() => {
    const userId = this.currentUser()?.id;
    return this.familyResource.value()?.members.some((m) => m.user.id === userId && m.role === 'admin') ?? false;
  });

  protected readonly invite = signal<IInvite | null>(null);
  // Leaving takes two clicks: the first one only asks for confirmation.
  protected readonly confirmingLeave = signal(false);
  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  createFamily() {
    if (!this.createForm().valid()) return;
    this.enterFamily(this.familyRepository.createFamily(this.createForm().value().name), () =>
      this.createModel.set({ name: '' }),
    );
  }

  joinFamily() {
    if (!this.joinForm().valid()) return;
    this.enterFamily(this.familyRepository.joinFamily(this.joinForm().value().code), () =>
      this.joinModel.set({ code: '' }),
    );
  }

  createInvite() {
    this.pending.set(true);
    this.errorMessage.set(null);
    this.familyRepository.createInvite().subscribe({
      next: (invite) => {
        this.pending.set(false);
        this.invite.set(invite);
      },
      error: (err: Error) => {
        this.pending.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }

  leaveFamily() {
    this.pending.set(true);
    this.errorMessage.set(null);
    this.familyRepository.leaveFamily().subscribe({
      next: () => {
        this.pending.set(false);
        this.confirmingLeave.set(false);
        this.invite.set(null);
        this.authState.setFamilyId(null);
      },
      error: (err: Error) => {
        this.pending.set(false);
        this.confirmingLeave.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }

  private enterFamily(request$: Observable<IFamily>, reset: () => void) {
    this.pending.set(true);
    this.errorMessage.set(null);
    request$.subscribe({
      next: (family) => {
        this.pending.set(false);
        reset();
        this.authState.setFamilyId(family.id);
      },
      error: (err: Error) => {
        this.pending.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }
}
