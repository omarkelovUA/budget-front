import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { IUser } from '../../../model/types';
import { AuthRepository } from './auth-repository';

interface MockAccount {
  user: IUser;
  password: string;
}

@Injectable()
export class MockAuthRepository extends AuthRepository {
  //TODO - this is temp solution
  // Two seed accounts so the family flow (M5) can be demoed both ways:
  // "demo" already belongs to a family, "newbie" has to create/join one.
  private accounts: MockAccount[] = [
    {
      user: { id: 1, email: 'demo@family.app', displayName: 'Demo User', familyId: 1 },
      password: 'password123',
    },
    {
      user: { id: 2, email: 'newbie@family.app', displayName: 'Newbie User', familyId: null },
      password: 'password123',
    },
  ];

  login(email: string, password: string): Observable<IUser> {
    const account = this.accounts.find((a) => a.user.email === email && a.password === password);
    if (!account) {
      return throwError(() => new Error('Невірний email або пароль')).pipe(delay(1000));
    }
    return of(account.user).pipe(delay(1000));
  }

  register(email: string, password: string, displayName: string): Observable<IUser> {
    if (this.accounts.some((a) => a.user.email === email)) {
      return throwError(() => new Error('Користувач з таким email вже існує')).pipe(delay(1000));
    }
    const user: IUser = { id: Date.now(), email, displayName, familyId: null };
    this.accounts.push({ user, password });
    return of(user).pipe(delay(1000));
  }

  loginWithGoogle(): Observable<IUser> {
    return of(this.accounts[0].user).pipe(delay(1000));
  }
}
