import { TestBed } from '@angular/core/testing';
import { faviconSvg } from './favicon';
import { paletteFor } from './palette';
import { ThemeService } from './theme';

describe('ThemeService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('style');
  });

  const primaryHue = () => document.documentElement.style.getPropertyValue('--primary-h');

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

  it('starts with the default green when no colour was chosen on this device', () => {
    TestBed.inject(ThemeService).init();

    expect(primaryHue()).toBe('150');
    expect(document.documentElement.style.getPropertyValue('--primary-c')).not.toBe('');
    expect(document.documentElement.style.getPropertyValue('--tertiary-c')).not.toBe('');
    expect(document.documentElement.style.getPropertyValue('--primary-l')).toBe('54%');
  });

  it('starts with the colour last used on this device', () => {
    localStorage.setItem('primaryHue', '305');

    TestBed.inject(ThemeService).init();

    expect(primaryHue()).toBe('305');
    expect(TestBed.inject(ThemeService).hue()).toBe(305);
  });

  it('ignores a stored colour that is not a hue', () => {
    for (const stored of ['abc', '400', '-5', '1.5', '', ' ', '0x96', '1e2']) {
      localStorage.setItem('primaryHue', stored);

      TestBed.inject(ThemeService).init();

      expect(primaryHue()).toBe('150');
    }
  });

  it('applies and remembers a colour', () => {
    TestBed.inject(ThemeService).useHue(25);

    expect(primaryHue()).toBe('25');
    expect(TestBed.inject(ThemeService).hue()).toBe(25);
    expect(localStorage.getItem('primaryHue')).toBe('25');
  });

  it('previews a colour without keeping it, and restores the kept one', () => {
    const themeService = TestBed.inject(ThemeService);
    themeService.useHue(150);

    themeService.previewHue(280);

    expect(primaryHue()).toBe('280');
    expect(themeService.hue()).toBe(150);
    expect(localStorage.getItem('primaryHue')).toBe('150');

    themeService.restoreHue();

    expect(primaryHue()).toBe('150');
  });

  it("gives the browser tab's icon the colour too", () => {
    const icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.append(icon);

    TestBed.inject(ThemeService).useHue(350);

    expect(decodeURIComponent(icon.href)).toBe(`data:image/svg+xml,${faviconSvg(paletteFor(350))}`);
    icon.remove();
  });
});
