import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api';
import { withUserErrors } from '../../../core/http/problem';
import { IUserSettings } from '../../../model/types';
import { SettingsRepository } from './settings-repository';

const SETTINGS = `${API_BASE}/users/me/settings`;

@Injectable()
export class HttpSettingsRepository extends SettingsRepository {
  private readonly http = inject(HttpClient);

  getSettings(): Observable<IUserSettings> {
    return this.http.get<IUserSettings>(SETTINGS).pipe(withUserErrors());
  }

  updateSettings(settings: IUserSettings): Observable<IUserSettings> {
    return this.http.put<IUserSettings>(SETTINGS, settings).pipe(withUserErrors());
  }
}
