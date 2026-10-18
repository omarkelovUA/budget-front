import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TranslocoDatePipe } from '@jsverse/transloco-locale';
import { rxResource } from '@angular/core/rxjs-interop';
import { email, form, FormField, required } from '@angular/forms/signals';
import { forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import { AuthState } from '../../../core/auth/auth-state';
import { ICategory, IFamily, IReceivedInvitation, IUser } from '../../../model/types';
import { CategoryRepository } from '../../categories/data/category-repository';
import { FamilyRepository } from '../data/family-repository';
import { SubscriptionRepository } from '../data/subscription-repository';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { FamilyArt } from '../../../shared/ui/illustrations/family-art';
import { Modal } from '../../../shared/ui/modal/modal';

// Members plus pending invitations (enforced by the backend).
export const MAX_FAMILY_SIZE = 10;

// Family subscriptions are sold through Google Play, in the Android app.
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.familybudget';

type FamilyDialog = 'rename' | 'invite' | 'join' | 'leave';

// Every user has a family (their own from sign-up on). Alone in it, they can invite
// someone or ask to join someone else's family; with others, admins invite and remove
// members, and everyone can leave. Adding members needs an admin's subscription, bought
// in the Android app; admins see its status here.
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
  private readonly categoryRepository = inject(CategoryRepository);
  private readonly subscriptionRepository = inject(SubscriptionRepository);

  protected readonly currentUser = this.authState.currentUser;
  protected readonly maxFamilySize = MAX_FAMILY_SIZE;
  protected readonly playStoreUrl = PLAY_STORE_URL;

  private readonly renameModel = signal({ name: '' });
  protected readonly renameForm = form(this.renameModel, (f) => required(f.name));

  private readonly inviteModel = signal({ email: '' });
  protected readonly inviteForm = form(this.inviteModel, (f) => {
    required(f.email);
    email(f.email);
  });

  private readonly joinModel = signal({ email: '' });
  protected readonly joinForm = form(this.joinModel, (f) => {
    required(f.email);
    email(f.email);
  });

  protected readonly familyResource = rxResource({
    params: () => this.currentUser()?.familyId ?? undefined,
    // Whether the family is frozen may have changed since the app loaded it.
    stream: () => this.familyRepository.getCurrentFamily().pipe(tap((family) => this.authState.setFamily(family))),
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

  protected readonly ownRequestResource = rxResource({
    params: () => this.currentUser()?.id,
    stream: () => this.familyRepository.getOwnJoinRequest(),
  });

  protected readonly isAdmin = computed(() => {
    const userId = this.currentUser()?.id;
    return this.familyResource.value()?.members.some((m) => m.user.id === userId && m.role === 'admin') ?? false;
  });

  protected readonly entitled = computed(() => this.familyResource.value()?.entitled ?? false);

  // The admin's own subscription; the family may also be covered by another admin's.
  protected readonly subscriptionResource = rxResource({
    params: () => (this.isAdmin() ? this.currentUser()?.id : undefined),
    stream: () => this.subscriptionRepository.getSubscription(),
  });

  // What the admin's subscription card says while the family is entitled: a key under
  // family.subscription, and the date it mentions. Undefined until it's known.
  protected readonly subscriptionStatus = computed(() => {
    if (!this.entitled() || !this.subscriptionResource.hasValue()) return undefined;
    const own = this.subscriptionResource.value();
    if (!own?.active) return { key: 'otherAdmin', date: null };
    if (own.source === 'manual') return own.expiresAt ? { key: 'manualUntil', date: own.expiresAt } : { key: 'manual', date: null };
    return { key: own.autoRenewing ? 'renews' : 'until', date: own.expiresAt };
  });

  protected readonly incomingResource = rxResource({
    params: () => (this.isAdmin() ? (this.currentUser()?.familyId ?? undefined) : undefined),
    stream: () => this.familyRepository.getIncomingJoinRequests(),
  });

  protected readonly alone = computed(() => this.familyResource.value()?.members.length === 1);
  // Join requests need a verified email, like invitations.
  protected readonly canAskToJoin = computed(
    () => this.alone() && this.receivedResource.value() != null && this.ownRequestResource.value() === null,
  );

  protected readonly seatsTaken = computed(
    () => (this.familyResource.value()?.members.length ?? 0) + (this.invitationsResource.value()?.length ?? 0),
  );

  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  // The open dialog; its errors show inside it.
  protected readonly dialog = signal<FamilyDialog | null>(null);
  // The invitation whose family the user is asked to switch to.
  protected readonly switchTo = signal<IReceivedInvitation | null>(null);
  // The member an admin is asked to confirm removing.
  protected readonly removing = signal<IUser | null>(null);
  // The one-time review of which categories the family sees, when its first other member
  // arrives (the admin's first invitation or approved join request): the family's
  // categories, and the ids the admin unticked to keep personal.
  protected readonly reviewing = signal<ICategory[] | null>(null);
  protected readonly keepPersonal = signal<ReadonlySet<string>>(new Set());
  protected readonly anyDialog = computed(
    () => !!(this.dialog() || this.switchTo() || this.removing() || this.reviewing()),
  );

  openDialog(dialog: FamilyDialog) {
    if (dialog === 'rename') this.renameModel.set({ name: this.familyResource.value()?.name ?? '' });
    this.errorMessage.set(null);
    this.dialog.set(dialog);
  }

  // A dismissed dialog takes its error with it.
  closeDialog() {
    this.errorMessage.set(null);
    this.dialog.set(null);
    this.switchTo.set(null);
    this.removing.set(null);
  }

  rename() {
    if (!this.renameForm().valid()) return;
    this.run(this.familyRepository.renameFamily(this.renameForm().value().name), () => {
      this.closeDialog();
      this.familyResource.reload();
    });
  }

  invite() {
    if (!this.inviteForm().valid()) return;
    const first = this.needsCategoryReview();
    this.run(this.familyRepository.invite(this.inviteForm().value().email), () => {
      this.inviteModel.set({ email: '' });
      this.closeDialog();
      this.invitationsResource.reload();
      if (first) this.startCategoryReview();
    });
  }

  revokeInvitation(id: string) {
    this.run(this.familyRepository.revokeInvitation(id), () => this.invitationsResource.reload());
  }

  askToJoin() {
    if (!this.joinForm().valid()) return;
    this.run(this.familyRepository.requestToJoin(this.joinForm().value().email), () => {
      this.joinModel.set({ email: '' });
      this.closeDialog();
      this.ownRequestResource.reload();
    });
  }

  cancelJoinRequest() {
    this.run(this.familyRepository.cancelJoinRequest(), () => this.ownRequestResource.reload());
  }

  approveJoinRequest(id: string) {
    const first = this.needsCategoryReview();
    this.run(this.familyRepository.approveJoinRequest(id), () => {
      this.familyResource.reload();
      this.incomingResource.reload();
      if (first) this.startCategoryReview();
    });
  }

  toggleKeepPersonal(id: string) {
    this.keepPersonal.update((ids) => {
      const next = new Set(ids);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  // Hides the unticked categories, then marks the review done so it isn't offered again.
  finishCategoryReview() {
    const hides = [...this.keepPersonal()].map((id) => this.categoryRepository.hideCategory(id));
    const request$ = (hides.length ? forkJoin(hides) : of([])).pipe(
      switchMap(() => this.familyRepository.markCategoriesReviewed()),
    );
    this.run(request$, () => {
      this.reviewing.set(null);
      this.familyResource.reload();
    });
  }

  // Closing without choosing keeps every category in the family; it isn't asked again.
  skipCategoryReview() {
    this.reviewing.set(null);
    this.familyRepository.markCategoriesReviewed().subscribe(() => this.familyResource.reload());
  }

  private needsCategoryReview(): boolean {
    return this.familyResource.value()?.categoriesReviewed === false;
  }

  private startCategoryReview() {
    this.categoryRepository.getCategories().subscribe((categories) => {
      this.keepPersonal.set(new Set());
      this.errorMessage.set(null);
      this.reviewing.set(categories.filter((c) => c.visibility === 'shared'));
    });
  }

  declineJoinRequest(id: string) {
    this.run(this.familyRepository.declineJoinRequest(id), () => this.incomingResource.reload());
  }

  acceptInvitation(invitation: IReceivedInvitation) {
    // Joining another family means leaving the current one: ask first, unless the user
    // is alone in it (their own family simply goes away).
    if (!this.alone()) {
      this.errorMessage.set(null);
      this.switchTo.set(invitation);
      return;
    }
    this.joinFamily(invitation.id);
  }

  joinFamily(id: string) {
    this.enterFamily(this.familyRepository.acceptInvitation(id), () => {
      this.receivedResource.reload();
      this.ownRequestResource.reload();
    });
  }

  declineInvitation(id: string) {
    this.run(this.familyRepository.declineInvitation(id), () => this.receivedResource.reload());
  }

  loginWithGoogle() {
    this.authState.loginWithGoogle();
  }

  confirmRemove(member: IUser) {
    this.errorMessage.set(null);
    this.removing.set(member);
  }

  removeMember(userId: string) {
    this.run(this.familyRepository.removeMember(userId), () => {
      this.closeDialog();
      this.familyResource.reload();
    });
  }

  // The user gets a new family of their own.
  leaveFamily() {
    this.enterFamily(this.familyRepository.leaveFamily());
  }

  private enterFamily(request$: Observable<IFamily>, reload?: () => void) {
    this.run(request$, (family) => {
      this.closeDialog();
      this.authState.setFamily(family);
      reload?.();
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
