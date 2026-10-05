import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ICategory } from '../../../model/types';
import { CategoryRepository } from '../data/category-repository';

@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-form.html',
  styleUrl: './category-form.css',
})
export class CategoryForm {
  private readonly fb = inject(FormBuilder);
  private readonly categoryRepository = inject(CategoryRepository);

  protected readonly types: ICategory['type'][] = ['income', 'expense'];
  protected readonly icons = ['wallet', 'food', 'card'];
  protected readonly colors = ['green', 'yellow', 'blue', 'red'];
  protected readonly visibilities: ICategory['visibility'][] = ['private', 'shared'];

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    type: ['expense' as ICategory['type'], Validators.required],
    icon: ['assets/wallet.svg', Validators.required],
    color: ['green', Validators.required],
    visibility: ['private' as ICategory['visibility'], Validators.required],
  });

  readonly category = input<ICategory>();
  readonly edited = output();

  constructor() {
    effect(() => {
      const data = this.category();
      if (data) {
        this.form.patchValue(data);
      }
    });
  }

  submit() {
    if (this.form.invalid) return;

    const categoryId = this.category()?.id;
    const request$ =
      categoryId && categoryId > 0
        ? this.categoryRepository.updateCategory({ ...this.form.value, id: categoryId } as ICategory)
        : this.categoryRepository.createCategory({ ...this.form.value, id: 0 } as ICategory);

    request$.subscribe({
      next: () => this.edited.emit(),
      error: (err) => console.error('Save failed:', err),
    });
  }
}
