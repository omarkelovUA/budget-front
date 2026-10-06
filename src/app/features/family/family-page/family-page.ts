import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { email, form, FormField, required } from '@angular/forms/signals';
import { AuthState } from '../../../core/auth/auth-state';
import { FamilyRepository } from '../data/family-repository';

@Component({
  selector: 'app-family-page',
  imports: [FormField],
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

  private readonly inviteModel = signal({ email: '' });
  protected readonly inviteForm = form(this.inviteModel, (f) => {
    required(f.email);
    email(f.email);
  });

  protected readonly familyResource = rxResource({
    params: () => this.currentUser()?.familyId ?? undefined,
    stream: ({ params }) => this.familyRepository.getFamily(params),
  });

  createFamily() {
    if (!this.createForm().valid()) return;
    const user = this.currentUser();
    if (!user) return;

    this.familyRepository.createFamily(this.createForm().value().name, user).subscribe({
      next: (family) => {
        this.authState.setFamilyId(family.id);
        this.createModel.set({ name: '' });
      },
      error: (err) => console.error('Create family failed:', err),
    });
  }

  inviteMember() {
    if (!this.inviteForm().valid()) return;
    const familyId = this.currentUser()?.familyId;
    if (!familyId) return;

    this.familyRepository.inviteMember(familyId, this.inviteForm().value().email).subscribe({
      next: () => {
        this.inviteModel.set({ email: '' });
        this.familyResource.reload();
      },
      error: (err) => console.error('Invite failed:', err),
    });
  }
}
