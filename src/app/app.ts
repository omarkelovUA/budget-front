import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthState } from './core/auth/auth-state';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.css',
})
export class App {
  private readonly authState = inject(AuthState);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authState.currentUser;

  logout() {
    this.authState.logout();
    this.router.navigate(['/login']);
  }
}
