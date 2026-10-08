import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme';

describe('ThemeService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    document.documentElement.style.colorScheme = '';
  });

  it('follows the device when nothing was chosen on it', () => {
    TestBed.inject(ThemeService).init();

    expect(TestBed.inject(ThemeService).current()).toBe('system');
    expect(document.documentElement.style.colorScheme).toBe('light dark');
  });

  it('starts with the theme last used on this device', () => {
    localStorage.setItem('theme', 'dark');

    TestBed.inject(ThemeService).init();

    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('applies and remembers a switch', () => {
    TestBed.inject(ThemeService).use('light');

    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
