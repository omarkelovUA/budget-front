import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { AuthState } from './core/auth/auth-state';
import { SettingsDialog } from './features/settings/settings-dialog/settings-dialog';

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

  protected readonly currentUser = this.authState.currentUser;
  private readonly settingsDialog = viewChild(SettingsDialog);

  openSettings() {
    this.settingsDialog()?.open();
  }

  logout() {
    this.authState.logout();
    this.router.navigate(['/login']);
  }
}
