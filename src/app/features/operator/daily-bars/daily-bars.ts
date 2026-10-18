import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TranslocoDatePipe, TranslocoDecimalPipe } from '@jsverse/transloco-locale';
import { IDailyCount } from '../../../model/types';

// SVG geometry; the chart scales to its container. Narrow enough that its labels stay
// readable on a phone without growing much on a laptop.
const WIDTH = 400;
const HEIGHT = 170;
const LEFT = 30;
const TOP = 12;
const BOTTOM = 24;
const BASE = HEIGHT - BOTTOM;
const MAX_BAR = 24;
const GAP = 2;
const RADIUS = 4;

// The axis top: 1, 2 or 5 times a power of ten, at least the largest count.
export function niceMax(value: number): number {
  const power = 10 ** Math.floor(Math.log10(Math.max(value, 1)));
  return [1, 2, 5, 10].map((step) => step * power).find((nice) => nice >= value)!;
}

// A column rising from the baseline, its data end rounded (dataviz mark spec).
function columnPath(x: number, width: number, height: number): string {
  const r = Math.min(RADIUS, height, width / 2);
  const top = BASE - height;
  return `M${x},${BASE} V${top + r} Q${x},${top} ${x + r},${top} H${x + width - r} Q${x + width},${top} ${x + width},${top + r} V${BASE} Z`;
}

// One series of daily counts as columns: hover or focus a day for its value; a hidden
// table carries every value for screen readers. One series, so no legend: [label] names it.
@Component({
  selector: 'app-daily-bars',
  imports: [TranslocoDirective, TranslocoDatePipe, TranslocoDecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './daily-bars.html',
  styleUrl: './daily-bars.css',
})
export class DailyBars {
  readonly days = input.required<IDailyCount[]>();
  readonly label = input.required<string>();

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly left = LEFT;
  protected readonly top = TOP;
  protected readonly base = BASE;
  protected readonly hovered = signal<number | null>(null);

  protected readonly max = computed(() => niceMax(Math.max(...this.days().map((d) => d.count), 1)));

  protected readonly bars = computed(() => {
    const days = this.days();
    const slot = (WIDTH - LEFT) / Math.max(days.length, 1);
    const width = Math.min(MAX_BAR, slot - GAP);
    return days.map((d, i) => {
      const x = LEFT + i * slot + (slot - width) / 2;
      const height = (d.count / this.max()) * (BASE - TOP);
      return {
        day: d.day,
        date: new Date(`${d.day}T00:00:00Z`),
        count: d.count,
        slotX: LEFT + i * slot,
        slot,
        // As a share of the chart's width, for the tooltip.
        center: ((x + width / 2) / WIDTH) * 100,
        path: height > 0 ? columnPath(x, width, height) : null,
      };
    });
  });

  protected readonly active = computed(() => {
    const index = this.hovered();
    return index === null ? null : this.bars()[index];
  });
}
