import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import { ICategory } from '../../../model/types';
import { CategoryRepository } from '../data/category-repository';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconPicker } from '../../../shared/ui/icon-picker/icon-picker';
import { CATEGORY_ICON_SLOTS, categoryIcons, iconName, iconPath } from '../../../shared/ui/icon-picker/icons';
import { CategoryFormArt } from '../../../shared/ui/illustrations/category-form-art';
import { Modal } from '../../../shared/ui/modal/modal';
import { CATEGORY_COLORS, tagColor } from '../../../shared/ui/colors/colors';

type CategoryFormModel = Omit<ICategory, 'id'>;

const DEFAULT_MODEL: CategoryFormModel = {
  name: '',
  type: 'expense',
  icon: iconPath(categoryIcons('expense')[0]),
  color: 'green',
  visibility: 'private',
};

@Component({
  selector: 'app-category-form',
  imports: [FormField, TranslocoDirective, IconPicker, CategoryFormArt, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-form.html',
  styleUrl: './category-form.css',
})
export class CategoryForm {
  private readonly categoryRepository = inject(CategoryRepository);

  protected readonly types: ICategory['type'][] = ['income', 'expense'];
  protected readonly iconSlots = CATEGORY_ICON_SLOTS;
  protected readonly colors = CATEGORY_COLORS;
  protected readonly tagColor = tagColor;
  protected readonly visibilities: ICategory['visibility'][] = ['private', 'shared'];

  private readonly model = signal<CategoryFormModel>({ ...DEFAULT_MODEL });
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = form(this.model, (f) => {
    required(f.name);
    // Fixed after creation: the type decides what past payments did to balances.
    disabled(f.type, () => this.category() !== undefined);
    disabled(f.visibility, () => this.category() !== undefined);
  });

  readonly category = input<ICategory>();
  readonly isAdmin = input(false);

  // The admin's new category: instead of a picker, Save asks whether the family sees it.
  // Other members pick in the form, personal by default.
  protected readonly asksVisibility = computed(() => this.isAdmin() && !this.category());
  protected readonly choosingVisibility = signal(false);

  // The chosen type's icons. A category saved with an icon from the other list (before
  // the lists were split) still shows it, so editing doesn't lose the selection.
  protected readonly icons = computed(() => {
    const icons = categoryIcons(this.model().type);
    const stored = this.category() && iconName(this.model().icon);
    return stored && !icons.includes(stored) ? [...icons, stored] : icons;
  });
  readonly edited = output();
  readonly cancelled = output();

  constructor() {
    effect(() => {
      const data = this.category();
      this.model.set(
        data
          ? { name: data.name, type: data.type, icon: data.icon, color: data.color, visibility: data.visibility }
          : { ...DEFAULT_MODEL },
      );
    });
    // A new category's icon follows its type, unless the picked one fits both.
    effect(() => {
      const { type, icon } = this.model();
      if (this.category()) return;
      const icons = categoryIcons(type);
      if (!icons.includes(iconName(icon))) this.model.update((m) => ({ ...m, icon: iconPath(icons[0]) }));
    });
  }

  submit() {
    if (!this.form().valid()) return;
    if (this.asksVisibility()) {
      this.choosingVisibility.set(true);
      return;
    }
    this.save(this.form().value());
  }

  chooseVisibility(visibility: ICategory['visibility']) {
    this.choosingVisibility.set(false);
    this.save({ ...this.form().value(), visibility });
  }

  private save(value: CategoryFormModel) {
    this.errorMessage.set(null);
    const categoryId = this.category()?.id;
    const request$ =
      categoryId
        ? this.categoryRepository.updateCategory({ ...value, id: categoryId })
        : this.categoryRepository.createCategory(value);

    request$.subscribe({
      next: () => this.edited.emit(),
      error: (err: Error) => this.errorMessage.set(err.message),
    });
  }
}
