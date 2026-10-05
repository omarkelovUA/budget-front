import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountForm } from './account-form';

describe('AccountForm', () => {
  let component: AccountForm;
  let fixture: ComponentFixture<AccountForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountForm],
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
    });
    expect(form.invalid).toBe(true);
  });
});
