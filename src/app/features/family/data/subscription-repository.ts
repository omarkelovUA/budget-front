import { Observable } from 'rxjs';
import { ISubscription } from '../../../model/types';

// Subscriptions are bought in the Android app (Google Play); the web only shows them.
export abstract class SubscriptionRepository {
  // The user's longest-lasting active subscription, else their latest one, else null.
  abstract getSubscription(): Observable<ISubscription | null>;
}
