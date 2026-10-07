import { Observable } from 'rxjs';
import { IFamilyTransfers } from '../../../model/types';

// Money between family members through transient accounts. Source and target are
// always accounts the current user owns, in the transfer's currency.
export abstract class FamilyTransferRepository {
  abstract getInTransit(): Observable<IFamilyTransfers>;

  abstract send(fromAccountId: string, recipientId: string, amount: number): Observable<void>;

  // amount null = everything waiting.
  abstract collect(transferId: string, toAccountId: string, amount: number | null): Observable<void>;

  abstract takeBack(transferId: string, toAccountId: string, amount: number | null): Observable<void>;
}
