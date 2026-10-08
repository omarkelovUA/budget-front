import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { TranslocoDirective } from '@jsverse/transloco';
import { AuthState } from '../../../core/auth/auth-state';

@Component({
  selector: 'app-register-page',
  imports: [FormField, RouterLink, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register-page.html',
  styleUrl: '../shared/auth-page.css',
})
export class RegisterPage {
  private readonly authState = inject(AuthState);
  private readonly router = inject(Router);

  private readonly model = signal({ displayName: '', email: '', password: '' });
  protected readonly form = form(this.model, (f) => {
    required(f.displayName);
    required(f.email);
    email(f.email);
    required(f.password);
    minLength(f.password, 8);
  });

  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  submit() {
    if (!this.form().valid()) return;
    const { displayName, email, password } = this.form().value();

    this.pending.set(true);
    this.errorMessage.set(null);
    this.authState.register(email, password, displayName).subscribe({
      next: () => {
        this.pending.set(false);
        // A freshly registered user has no family yet - send them straight to create one.
        this.router.navigate(['/family']);
      },
      error: (err: Error) => {
        this.pending.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }
}
