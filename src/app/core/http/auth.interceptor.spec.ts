import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { AuthRepository, AuthSession } from '../auth/data/auth-repository';
import { AuthState } from '../auth/auth-state';
import { FamilyRepository } from '../../features/family/data/family-repository';
import { authInterceptor } from './auth.interceptor';

const session = (accessToken: string): AuthSession => ({
  accessToken,
  user: { id: 'user-1', email: 'demo@family.app', displayName: 'Demo' },
});

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let refreshes: number;
  // When set, refresh() stays pending until the test emits on it.
  let pendingRefresh: Subject<AuthSession> | null;

  beforeEach(() => {
    refreshes = 0;
    pendingRefresh = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthRepository,
          useValue: {
            login: () => of(session('old-token')),
            refresh: (): Observable<AuthSession> => {
              refreshes++;
              return pendingRefresh ?? of(session('new-token'));
            },
          },
        },
        { provide: FamilyRepository, useValue: { getCurrentFamily: () => of(null) } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthState).login('demo@family.app', 'x').subscribe();
  });

  afterEach(() => backend.verify());

  it('attaches the access token to API calls only', () => {
    http.get('/api/v1/accounts').subscribe();
    http.get('/assets/icon.svg').subscribe();

    expect(backend.expectOne('/api/v1/accounts').request.headers.get('Authorization')).toBe('Bearer old-token');
    expect(backend.expectOne('/assets/icon.svg').request.headers.has('Authorization')).toBe(false);
  });

  it('shares one in-flight refresh between concurrent 401s', () => {
    pendingRefresh = new Subject<AuthSession>();
    http.get('/api/v1/accounts').subscribe();
    http.get('/api/v1/budgets').subscribe();
    backend.expectOne('/api/v1/accounts').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/v1/budgets').flush(null, { status: 401, statusText: 'Unauthorized' });

    pendingRefresh.next(session('new-token'));
    pendingRefresh.complete();

    for (const url of ['/api/v1/accounts', '/api/v1/budgets']) {
      const retried = backend.expectOne(url);
      expect(retried.request.headers.get('Authorization')).toBe('Bearer new-token');
      retried.flush([]);
    }
    expect(refreshes).toBe(1);
  });

  it('refreshes once on 401 and retries with the new token', () => {
    let result: unknown;
    http.get('/api/v1/accounts').subscribe((body) => (result = body));
    http.get('/api/v1/budgets').subscribe();

    backend.expectOne('/api/v1/accounts').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/v1/budgets').flush(null, { status: 401, statusText: 'Unauthorized' });

    const retried = backend.expectOne('/api/v1/accounts');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer new-token');
    retried.flush(['ok']);
    backend.expectOne('/api/v1/budgets').flush([]);

    expect(result).toEqual(['ok']);
    expect(refreshes).toBe(1);
  });
});
