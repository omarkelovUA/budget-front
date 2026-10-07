import { HttpErrorResponse } from '@angular/common/http';
import { catchError, MonoTypeOperatorFunction, throwError } from 'rxjs';

// Backend errors are RFC 9457 ProblemDetails whose `type` ends in a stable slug
// (docs/ARCHITECTURE.md §4.5); the UI shows its own text for each one.
const PROBLEM_TYPE_BASE = 'https://familybudget.app/problems/';

const MESSAGES: Record<string, string> = {
  'invalid-credentials': 'Невірний email або пароль',
  'email-taken': 'Користувач з таким email вже існує',
  'not-found': 'Не знайдено',
  'already-in-family': "Ви вже належите до сім'ї",
  'invalid-invite': 'Запрошення недійсне, прострочене або вже використане',
  'already-invited': 'Цю адресу вже запрошено',
  'already-member': "Ця людина вже у вашій сім'ї",
  'family-full': "У сім'ї може бути не більше 10 людей, враховуючи запрошених",
  'email-not-verified': 'Щоб користуватися запрошеннями, увійдіть через Google',
  'admin-required': "Це може зробити лише адміністратор сім'ї",
  'last-admin': "У сім'ї має залишитися хоча б один адміністратор",
  'no-family': "Щоб ділитися даними, створіть сім'ю або приєднайтеся до неї",
  'visibility-immutable': 'Доступ (особистий/сімейний) не можна змінити після створення',
  'category-type-immutable': 'Тип категорії не можна змінити після створення',
  'account-in-use': 'У рахунку є транзакції — закрийте його замість видалення',
  'not-account-owner': 'Це може зробити лише власник рахунку',
  'account-read-only': 'Цей рахунок доступний вам лише для перегляду',
  'account-closed': 'Рахунок закрито',
  'grantee-not-in-family': "Доступ можна надати лише іншим учасникам вашої сім'ї",
  'close-target-required': 'Оберіть рахунок, на який перенести залишок',
  'transient-account': "Гроші в дорозі між членами сім'ї рухаються лише через перекази в сім'ї",
  'recipient-not-in-family': "Надсилати гроші можна лише іншому учаснику вашої сім'ї",
  'insufficient-in-transit': 'Стільки грошей у цьому переказі немає',
  'invalid-currency': 'Невідомий код валюти',
  'category-in-use': 'Спершу видаліть транзакції та бюджети цієї категорії',
  'currency-mismatch': 'Переказ між рахунками в різних валютах не підтримується',
  'transaction-not-editable': 'Ця транзакція стосується рахунку, до якого у вас немає доступу',
  'category-not-shared': 'Для сімейного бюджету потрібна сімейна категорія',
  'budget-exists': 'Бюджет для цієї категорії на цей місяць уже існує',
};

const FALLBACK = 'Щось пішло не так. Спробуйте пізніше.';

export function problemType(err: unknown): string | null {
  if (!(err instanceof HttpErrorResponse)) return null;
  const type = (err.error as { type?: unknown } | null)?.type;
  return typeof type === 'string' && type.startsWith(PROBLEM_TYPE_BASE)
    ? type.slice(PROBLEM_TYPE_BASE.length)
    : null;
}

export function toUserError(err: unknown): Error {
  const type = problemType(err);
  if (type && MESSAGES[type]) return new Error(MESSAGES[type]);
  if (err instanceof HttpErrorResponse && err.status === 400) {
    return new Error('Перевірте правильність введених даних');
  }
  return new Error(FALLBACK);
}

/** Replaces an HTTP error with an `Error` whose message can be shown to the user. */
export function withUserErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError((err) => throwError(() => toUserError(err)));
}
