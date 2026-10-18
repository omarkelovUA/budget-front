import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AuthState } from '../../../core/auth/auth-state';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let googleLogins: number;

  async function render(queryParams: Record<string, string> = {}) {
    googleLogins = 0;
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } },
        { provide: AuthState, useValue: { loginWithGoogle: () => googleLogins++ } },
      ],
    });
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
    return fixture;
  }

  it('offers only Google, with no password form', async () => {
    const page = (await render()).nativeElement as HTMLElement;

    expect(page.querySelector('input')).toBeNull();
    expect(page.querySelector('a[href="/register"]')).toBeNull();
    expect(page.querySelector('button')?.textContent?.trim()).toBe('Увійти через Google');
    expect(page.querySelector('[role="alert"]')).toBeNull();
  });

  it('sends the browser to Google and holds the button while it goes', async () => {
    const fixture = await render();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;

    button.click();
    await fixture.whenStable();

    expect(googleLogins).toBe(1);
    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toBe('Відкриваємо Google...');
  });

  it('explains a failed Google login', async () => {
    const failed = (await render({ error: 'oauth' })).nativeElement as HTMLElement;
    expect(failed.querySelector('[role="alert"]')?.textContent).toBe('Не вдалося увійти через Google');
  });

  it('explains an unverified Google email', async () => {
    const unverified = (await render({ error: 'oauth', reason: 'email-not-verified' })).nativeElement as HTMLElement;
    expect(unverified.querySelector('[role="alert"]')?.textContent).toBe(
      'Email вашого Google-акаунта не підтверджено',
    );
  });
});
