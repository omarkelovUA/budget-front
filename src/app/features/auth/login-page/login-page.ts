import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { LoginArt } from '../../../shared/ui/illustrations/login-art';
import { AuthState } from '../../../core/auth/auth-state';

// Google is the only way in; the first sign-in creates the account.
@Component({
  selector: 'app-login-page',
  imports: [TranslocoDirective, LoginArt],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.html',
  styleUrl: '../shared/auth-page.css',
})
export class LoginPage {
  private readonly authState = inject(AuthState);
  private readonly route = inject(ActivatedRoute);

  protected readonly pending = signal(false);
  // Set when the backend's Google login redirects back with ?error=oauth; a key, so
  // it follows the language.
  protected readonly oauthErrorKey =
    this.route.snapshot.queryParamMap.get('error') === 'oauth'
      ? this.route.snapshot.queryParamMap.get('reason') === 'email-not-verified'
        ? 'auth.login.googleEmailNotVerified'
        : 'auth.login.googleFailed'
      : null;

  loginWithGoogle() {
    this.pending.set(true);
    this.authState.loginWithGoogle();
  }
}
