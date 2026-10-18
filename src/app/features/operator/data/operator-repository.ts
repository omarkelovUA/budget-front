import { Observable } from 'rxjs';
import { IGrant, IOperatorStats } from '../../../model/types';

// Operators only; anyone else gets operator-required.
export abstract class OperatorRepository {
  // Whether the signed-in user is an operator (GET /users/me).
  abstract isOperator(): Observable<boolean>;

  abstract getStats(): Observable<IOperatorStats>;

  abstract getGrants(): Observable<IGrant[]>;

  // Free access for the user with this email, or a new end for theirs; null: no end.
  abstract grant(email: string, expiresAt: Date | null): Observable<IGrant>;

  abstract revoke(userId: string): Observable<void>;
}
