import { HttpErrorResponse } from '@angular/common/http';
import { problemType, toUserError } from './problem';

const problem = (type: string, status = 409) =>
  new HttpErrorResponse({ status, error: { type: `https://familybudget.app/problems/${type}` } });

describe('problem mapping', () => {
  it('extracts the stable type slug', () => {
    expect(problemType(problem('budget-exists'))).toBe('budget-exists');
    expect(problemType(new Error('x'))).toBeNull();
  });

  it('maps known types to their UI message', () => {
    expect(toUserError(problem('invalid-credentials', 401)).message).toBe('Невірний email або пароль');
  });

  it('falls back for validation errors and unknown failures', () => {
    expect(toUserError(new HttpErrorResponse({ status: 400, error: {} })).message).toBe(
      'Перевірте правильність введених даних',
    );
    expect(toUserError(new HttpErrorResponse({ status: 500 })).message).toBe(
      'Щось пішло не так. Спробуйте пізніше.',
    );
  });
});
