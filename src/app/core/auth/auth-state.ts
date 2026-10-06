import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { IUser } from '../../model/types';
import { AuthRepository } from './data/auth-repository';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly authRepository = inject(AuthRepository);

  private readonly user = signal<IUser | null>(null);
  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);

  login(email: string, password: string): Observable<IUser> {
    return this.authRepository.login(email, password).pipe(tap((user) => this.user.set(user)));
  }

  register(email: string, password: string, displayName: string): Observable<IUser> {
    return this.authRepository
      .register(email, password, displayName)
      .pipe(tap((user) => this.user.set(user)));
  }

  loginWithGoogle(): Observable<IUser> {
    return this.authRepository.loginWithGoogle().pipe(tap((user) => this.user.set(user)));
  }

  logout(): void {
    this.user.set(null);
  }

  // Called after creating/joining a family - a real backend would return the
  // updated user (with its new activeFamilyId) from that call instead.
  setFamilyId(familyId: number): void {
    this.user.update((u) => (u ? { ...u, familyId } : u));
  }
}
