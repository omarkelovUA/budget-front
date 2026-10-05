import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountForm } from './account-form';
import { AccountRepository } from '../data/account-repository';
import { MockAccountRepository } from '../data/mock-account-repository';

describe('AccountForm', () => {
  let component: AccountForm;
  let fixture: ComponentFixture<AccountForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountForm],
      providers: [{ provide: AccountRepository, useClass: MockAccountRepository }],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with expected defaults', () => {
    const form = (component as any).form;

    expect(form.getRawValue()).toEqual({
      name: '',
      currency: 'UAH',
      icon: 'card',
      color: 'green',
      visibility: 'private',
    });
    expect(form.invalid).toBe(true);
  });
});
