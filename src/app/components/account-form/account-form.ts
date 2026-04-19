import { Component, effect, inject, input, output } from '@angular/core';
import { IAccount } from '../../model/types';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../services/account-service';

@Component({
  selector: 'app-account-form',
  imports: [ReactiveFormsModule],
  templateUrl: './account-form.html',
  styleUrl: './account-form.css',
})
export class AccountForm {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  protected readonly account = input<IAccount>();
  protected readonly edited = output();
  protected readonly colors = ['green', 'yellow', 'blue', 'red'];
  protected readonly icons = ['card', 'wallet'];
  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    currency: ['UAH', Validators.required],
    icon: ['card', Validators.required],
    color: ['green', Validators.required],
  });

  constructor() {
    effect(() => {
      const data = this.account();
      if (data) {
        this.form.patchValue(data);
      }
    });
  }

  submit() {
    if (this.form.invalid) return;

    const accountId = this.account()?.id;
    const request$ =
      accountId && accountId > 0
        ? this.accountService.updateAccount({ ...this.form.value, id: accountId } as IAccount)
        : this.accountService.createAccount({ ...this.form.value, id: 0 } as IAccount);

    request$.subscribe({
      next: (savedAccount) => {
        this.edited.emit();
        console.log('Saved successfully:', savedAccount);
      },
      error: (err) => {
        console.error('Save failed:', err);
      },
    });
  }
}
