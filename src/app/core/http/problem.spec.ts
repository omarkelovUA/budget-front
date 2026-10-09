import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { problemType, toUserError } from './problem';

const problem = (type: string, status = 409) =>
  new HttpErrorResponse({ status, error: { type: `https://familybudget.app/problems/${type}` } });

describe('problem mapping', () => {
  // toUserError translates through Transloco's global instance.
  let transloco: TranslocoService;
  beforeEach(() => (transloco = TestBed.inject(TranslocoService)));

  it('extracts the stable type slug', () => {
    expect(problemType(problem('budget-exists'))).toBe('budget-exists');
    expect(problemType(new Error('x'))).toBeNull();
  });

  it('maps known types to their UI message in the active language', () => {
    expect(toUserError(problem('invalid-credentials', 401)).message).toBe('Невірний email або пароль');

    transloco.setActiveLang('en');

    expect(toUserError(problem('invalid-credentials', 401)).message).toBe('Wrong email or password');
  });

  it('explains requests the server rejected as invalid', () => {
    expect(toUserError(problem('validation-failed', 400)).message).toBe(
      'Деякі дані введено неправильно. Перевірте поля й спробуйте ще раз.',
    );
  });

  it('falls back for other bad requests and unknown failures', () => {
    expect(toUserError(new HttpErrorResponse({ status: 400, error: {} })).message).toBe(
      'Перевірте правильність введених даних',
    );
    expect(toUserError(problem('something-new', 400)).message).toBe('Перевірте правильність введених даних');
    expect(toUserError(new HttpErrorResponse({ status: 500 })).message).toBe(
      'Щось пішло не так. Спробуйте пізніше.',
    );
  });
});
