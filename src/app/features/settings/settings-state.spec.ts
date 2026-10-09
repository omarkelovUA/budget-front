import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { ThemeService } from '../../core/theme/theme';
import { TEST_SETTINGS } from '../../../test-providers';
import { SettingsRepository } from './data/settings-repository';
import { SettingsState } from './settings-state';

describe('SettingsState', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('style');
  });

  it("applies the account's primary colour once loaded", async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SettingsRepository,
          useValue: { getSettings: () => of({ ...TEST_SETTINGS, primaryHue: 305 }) },
        },
      ],
    });

    await firstValueFrom(TestBed.inject(SettingsState).load());

    expect(TestBed.inject(ThemeService).hue()).toBe(305);
    expect(document.documentElement.style.getPropertyValue('--primary-h')).toBe('305');
  });
});
