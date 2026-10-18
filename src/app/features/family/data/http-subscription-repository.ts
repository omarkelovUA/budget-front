import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api';
import { withUserErrors } from '../../../core/http/problem';
import { ISubscription } from '../../../model/types';
import { SubscriptionRepository } from './subscription-repository';

type SubscriptionDto = Omit<ISubscription, 'expiresAt'> & { expiresAt: string | null };

@Injectable()
export class HttpSubscriptionRepository extends SubscriptionRepository {
  private readonly http = inject(HttpClient);

  // 204 (never subscribed) arrives as a null body.
  getSubscription(): Observable<ISubscription | null> {
    return this.http.get<SubscriptionDto | null>(`${API_BASE}/subscriptions/me`).pipe(
      map((dto) =>
        dto ? { ...dto, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null } : null,
      ),
      withUserErrors(),
    );
  }
}
