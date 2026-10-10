import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { AuthState } from './core/auth/auth-state';
import { SettingsDialog } from './features/settings/settings-dialog/settings-dialog';
import { CategoryRepository } from './features/categories/data/category-repository';
import { FamilyRepository } from './features/family/data/family-repository';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SettingsDialog, TranslocoDirective],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css',
})
export class App {
  private readonly authState = inject(AuthState);
  private readonly router = inject(Router);
  private readonly familyRepository = inject(FamilyRepository);
  private readonly categoryRepository = inject(CategoryRepository);

  protected readonly currentUser = this.authState.currentUser;

  // The admin is told, once they open the app, about family categories other members
  // added; they can rename or delete them on the categories page.
  protected readonly addedResource = rxResource({
    params: () => this.currentUser()?.familyId ?? undefined,
    stream: () =>
      this.familyRepository.getCurrentFamily().pipe(
        switchMap((family) => {
          const userId = this.currentUser()?.id;
          const admin = family.members.some((m) => m.user.id === userId && m.role === 'admin');
          return admin ? this.categoryRepository.getAddedByMembers() : of([]);
        }),
      ),
  });
  protected readonly addedSummary = computed(() =>
    (this.addedResource.value() ?? []).map((added) => `${added.category.name} (${added.addedBy})`).join(', '),
  );

  dismissAdded() {
    this.categoryRepository.markAddedSeen().subscribe(() => this.addedResource.set([]));
  }
  private readonly settingsDialog = viewChild(SettingsDialog);

  openSettings() {
    this.settingsDialog()?.open();
  }

  logout() {
    this.authState.logout();
    this.router.navigate(['/login']);
  }
}
