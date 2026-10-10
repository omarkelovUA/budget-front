import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';
import { rxResource } from '@angular/core/rxjs-interop';
import { email, form, FormField, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';
import { AuthState } from '../../../core/auth/auth-state';
import { IFamily, IReceivedInvitation } from '../../../model/types';
import { FamilyRepository } from '../data/family-repository';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { FamilyArt } from '../../../shared/ui/illustrations/family-art';
import { Modal } from '../../../shared/ui/modal/modal';

// Members plus pending invitations (enforced by the backend).
export const MAX_FAMILY_SIZE = 10;

@Component({
  selector: 'app-family-page',
  imports: [FormField, TranslocoDirective, TranslocoDatePipe, PageHeader, FamilyArt, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './family-page.html',
  styleUrl: './family-page.css',
})
export class FamilyPage {
  private readonly authState = inject(AuthState);
  private readonly familyRepository = inject(FamilyRepository);

  protected readonly currentUser = this.authState.currentUser;
  protected readonly maxFamilySize = MAX_FAMILY_SIZE;

  private readonly createModel = signal({ name: '' });
  protected readonly createForm = form(this.createModel, (f) => required(f.name));

  private readonly inviteModel = signal({ email: '' });
  protected readonly inviteForm = form(this.inviteModel, (f) => {
    required(f.email);
    email(f.email);
  });

  protected readonly familyResource = rxResource({
    params: () => this.currentUser()?.familyId ?? undefined,
    stream: () => this.familyRepository.getCurrentFamily(),
  });

  protected readonly invitationsResource = rxResource({
    params: () => this.currentUser()?.familyId ?? undefined,
    stream: () => this.familyRepository.getInvitations(),
  });

  // null value = the user's email isn't verified (never signed in with Google).
  protected readonly receivedResource = rxResource({
    params: () => this.currentUser()?.id,
    stream: () => this.familyRepository.getReceivedInvitations(),
  });

  protected readonly isAdmin = computed(() => {
    const userId = this.currentUser()?.id;
    return this.familyResource.value()?.members.some((m) => m.user.id === userId && m.role === 'admin') ?? false;
  });

  protected readonly seatsTaken = computed(
    () => (this.familyResource.value()?.members.length ?? 0) + (this.invitationsResource.value()?.length ?? 0),
  );

  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  // The open dialog; its errors show inside it. Leaving and switching families are
  // confirmed in one.
  protected readonly dialog = signal<'create' | 'invite' | 'leave' | null>(null);
  // The invitation whose family the user is asked to switch to.
  protected readonly switchTo = signal<IReceivedInvitation | null>(null);

  openDialog(dialog: 'create' | 'invite' | 'leave') {
    this.errorMessage.set(null);
    this.dialog.set(dialog);
  }

  // A dismissed dialog takes its error with it.
  closeDialog() {
    this.errorMessage.set(null);
    this.dialog.set(null);
    this.switchTo.set(null);
  }

  createFamily() {
    if (!this.createForm().valid()) return;
    this.enterFamily(this.familyRepository.createFamily(this.createForm().value().name), () => {
      this.createModel.set({ name: '' });
      this.closeDialog();
    });
  }

  invite() {
    if (!this.inviteForm().valid()) return;
    this.run(this.familyRepository.invite(this.inviteForm().value().email), () => {
      this.inviteModel.set({ email: '' });
      this.closeDialog();
      this.invitationsResource.reload();
    });
  }

  revokeInvitation(id: string) {
    this.run(this.familyRepository.revokeInvitation(id), () => this.invitationsResource.reload());
  }

  acceptInvitation(invitation: IReceivedInvitation) {
    // Joining another family means leaving the current one, so ask first.
    if (this.currentUser()?.familyId) {
      this.errorMessage.set(null);
      this.switchTo.set(invitation);
      return;
    }
    this.joinFamily(invitation.id);
  }

  joinFamily(id: string) {
    this.enterFamily(this.familyRepository.acceptInvitation(id), () => {
      this.closeDialog();
      this.receivedResource.reload();
    });
  }

  declineInvitation(id: string) {
    this.run(this.familyRepository.declineInvitation(id), () => this.receivedResource.reload());
  }

  loginWithGoogle() {
    this.authState.loginWithGoogle();
  }

  leaveFamily() {
    this.run(this.familyRepository.leaveFamily(), () => {
      this.closeDialog();
      this.authState.setFamilyId(null);
    });
  }

  private enterFamily(request$: Observable<IFamily>, reset: () => void) {
    this.run(request$, (family) => {
      reset();
      this.authState.setFamilyId(family.id);
    });
  }

  private run<T>(request$: Observable<T>, onSuccess: (value: T) => void) {
    this.pending.set(true);
    this.errorMessage.set(null);
    request$.subscribe({
      next: (value) => {
        this.pending.set(false);
        onSuccess(value);
      },
      error: (err: Error) => {
        this.pending.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }
}
