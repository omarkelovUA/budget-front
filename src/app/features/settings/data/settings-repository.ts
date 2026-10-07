import { Observable } from 'rxjs';
import { IUserSettings } from '../../../model/types';

// The current user's own settings.
export abstract class SettingsRepository {
  abstract getSettings(): Observable<IUserSettings>;

  abstract updateSettings(settings: IUserSettings): Observable<IUserSettings>;
}
