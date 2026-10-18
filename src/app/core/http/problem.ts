import { HttpErrorResponse } from '@angular/common/http';
import { translate } from '@jsverse/transloco';
import { catchError, MonoTypeOperatorFunction, throwError } from 'rxjs';

// Backend errors are RFC 9457 ProblemDetails whose `type` ends in a stable slug
// (docs/ARCHITECTURE.md §4.5); the UI shows its own text for each one.
const PROBLEM_TYPE_BASE = 'https://familybudget.app/problems/';

// Each has its text under errors.<slug> in the translation files.
export const KNOWN_PROBLEMS: ReadonlySet<string> = new Set([
  'not-found',
  'invalid-invite',
  'already-invited',
  'already-member',
  'family-full',
  'email-not-verified',
  'invalid-google-token',
  'google-unavailable',
  'google-link-confirmation-required',
  'id-conflict',
  'already-deleted',
  'invalid-sync-cursor',
  'admin-required',
  'last-admin',
  'no-family',
  'alone-in-family',
  'not-alone',
  'user-not-found',
  'already-requested',
  'invalid-join-request',
  'visibility-immutable',
  'category-type-immutable',
  'account-in-use',
  'not-account-owner',
  'account-read-only',
  'account-closed',
  'split-total-mismatch',
  'grantee-not-in-family',
  'close-target-required',
  'transient-account',
  'recipient-not-in-family',
  'insufficient-in-transit',
  'invalid-currency',
  'category-in-use',
  'category-exists',
  'category-used-by-family',
  'currency-mismatch',
  'transaction-not-editable',
  'category-not-shared',
  'budget-exists',
  'unsupported-language',
  'invalid-used-currencies',
  'default-currency-not-used',
  'unsupported-theme',
  'validation-failed',
]);

export function problemType(err: unknown): string | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const type = (err.error as { type?: unknown } | null)?.type;
  return typeof type === 'string' && type.startsWith(PROBLEM_TYPE_BASE)
    ? type.slice(PROBLEM_TYPE_BASE.length)
    : null;
}

// Translated into the language active when the error happens.
export function toUserError(err: unknown): Error {
  const type = problemType(err);
  if (type && KNOWN_PROBLEMS.has(type)) return new Error(translate(`errors.${type}`));
  if (err instanceof HttpErrorResponse && err.status === 400) {
    return new Error(translate('errors.badRequest'));
  }
  return new Error(translate('errors.fallback'));
}

/** Replaces an HTTP error with an `Error` whose message can be shown to the user. */
export function withUserErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError((err) => throwError(() => toUserError(err)));
}
