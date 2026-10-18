import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { IGrant, IOperatorStats } from '../../../model/types';
import { OperatorRepository } from '../data/operator-repository';
import { OperatorPage } from './operator-page';

const days = (counts: number[]) =>
  counts.map((count, i) => ({ day: `2026-10-${String(i + 10).padStart(2, '0')}`, count }));

const STATS: IOperatorStats = {
  users: {
    total: 1284,
    newLast7Days: 12,
    newLast30Days: 40,
    activeLast30Days: 310,
    signups: days([1, 2]),
    activeUsers: days([5, 9]),
  },
  families: { withMembers: 52, frozen: 3 },
  subscriptions: {
    activeGooglePlay: 20,
    activeManual: 4,
    googlePlayByState: { active: 18, canceled: 2, expired: 5 },
  },
};

const GRANT: IGrant = {
  userId: 'u2',
  email: 'ann@example.com',
  displayName: 'Ann',
  expiresAt: null,
  createdAt: new Date('2026-10-01'),
  active: true,
};

describe('OperatorPage', () => {
  let calls: unknown[][];
  let grants: IGrant[];
  let failGrant: boolean;

  async function render() {
    TestBed.configureTestingModule({
      imports: [OperatorPage],
      providers: [
        {
          provide: OperatorRepository,
          useValue: {
            getStats: () => (calls.push(['stats']), of(STATS)),
            getGrants: () => of(grants),
            grant: (email: string, expiresAt: Date | null) => {
              calls.push(['grant', email, expiresAt]);
              return failGrant
                ? throwError(() => new Error('Nobody has signed up with this email'))
                : of(GRANT);
            },
            revoke: (userId: string) => (calls.push(['revoke', userId]), of(undefined)),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(OperatorPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  async function type(
    fixture: { whenStable(): Promise<unknown> },
    input: HTMLInputElement,
    value: string,
  ) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  beforeEach(() => {
    calls = [];
    grants = [GRANT];
    failGrant = false;
  });

  it('shows the numbers as tiles, the daily ones as charts', async () => {
    const { el } = await render();

    const tiles = Array.from(el.querySelectorAll('.tile')).map((t) =>
      t.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(tiles[0]).toContain('1 284');
    expect(tiles[0]).toContain('12 нових за 7 днів · 40 за 30 днів');
    expect(tiles[2]).toContain('Призупинено: 3');
    expect(tiles[3]).toContain('24');
    expect(el.querySelectorAll('app-daily-bars')).toHaveLength(2);
    expect(el.querySelector('.play-states')?.textContent).toContain('Скасовані, ще діють');
  });

  it('gives free access through the end of the chosen day, then reloads', async () => {
    const { fixture, el } = await render();
    calls = [];

    await type(fixture, el.querySelector('#grant-email')!, 'bob@example.com');
    await type(fixture, el.querySelector('#grant-until')!, '2026-12-31');
    (el.querySelector('form') as HTMLFormElement).requestSubmit();
    await fixture.whenStable();

    expect(calls).toEqual([
      ['grant', 'bob@example.com', new Date('2026-12-31T23:59:59')],
      ['stats'],
    ]);
    expect((el.querySelector('#grant-email') as HTMLInputElement).value).toBe('');
  });

  it('gives access without an end, and says why it failed', async () => {
    failGrant = true;
    const { fixture, el } = await render();
    calls = [];

    await type(fixture, el.querySelector('#grant-email')!, 'nobody@example.com');
    (el.querySelector('form') as HTMLFormElement).requestSubmit();
    await fixture.whenStable();

    expect(calls).toEqual([['grant', 'nobody@example.com', null]]);
    expect(el.querySelector('.form-error')?.textContent).toBe(
      'Nobody has signed up with this email',
    );
  });

  it('lists the grants and takes one back', async () => {
    const { fixture, el } = await render();

    expect(el.querySelector('.grant-row')?.textContent).toContain('Без кінцевої дати');
    (el.querySelector('.grant-row .btn-text') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(calls).toContainEqual(['revoke', 'u2']);
  });

  it('says when nobody has free access', async () => {
    grants = [];
    const { el } = await render();

    expect(el.querySelector('.empty-state')?.textContent).toContain(
      'Ні в кого немає безкоштовного доступу.',
    );
  });
});
