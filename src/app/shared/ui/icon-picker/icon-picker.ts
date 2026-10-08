import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { TranslocoDirective } from '@jsverse/transloco';
import { Icon } from '../icon/icon';
import { iconPath } from './icons';

let nextId = 0;

// A Signal Forms control (`[formField]`) for picking one icon; the value is the stored
// path ('assets/<name>.svg'). Native radios keep it keyboard-accessible.
@Component({
  selector: 'app-icon-picker',
  imports: [TranslocoDirective, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-picker.html',
  styleUrl: './icon-picker.css',
})
export class IconPicker implements FormValueControl<string> {
  readonly value = model('');
  readonly disabled = input(false);
  readonly icons = input.required<readonly string[]>();
  readonly label = input.required<string>();

  protected readonly groupName = `icon-picker-${nextId++}`;
  protected readonly path = iconPath;
}
