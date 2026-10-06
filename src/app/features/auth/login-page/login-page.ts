import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { email, form, FormField, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';
import { AuthState } from '../../../core/auth/auth-state';
import { IUser } from '../../../model/types';

@Component({
  selector: 'app-login-page',
  imports: [FormField, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.html',
  styleUrl: '../shared/auth-page.css',
})
export class LoginPage {
  private readonly authState = inject(AuthState);
  private readonly router = inject(Router);

  private readonly model = signal({ email: '', password: '' });
  protected readonly form = form(this.model, (f) => {
    required(f.email);
    email(f.email);
    required(f.password);
  });

  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  submit() {
    if (!this.form().valid()) return;
    const { email, password } = this.form().value();
    this.run(this.authState.login(email, password));
  }

  loginWithGoogle() {
    this.run(this.authState.loginWithGoogle());
  }

  private run(request$: Observable<IUser>) {
    this.pending.set(true);
    this.errorMessage.set(null);
    request$.subscribe({
      next: () => {
        this.pending.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        this.pending.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }
}
