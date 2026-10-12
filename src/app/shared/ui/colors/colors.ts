// Accounts and categories store one of these slugs as their colour, so a slug must never be
// renamed or removed once used. Each is painted through --color-tag-<slug> (theme.css) and
// labelled under tagColors.<slug> in the translation files.
export const TAG_COLORS = [
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
  'red',
  'orange',
  'yellow',
  'brown',
  'gray',
];

// The CSS colour for a stored slug; anything unknown gets the primary.
export function tagColor(slug: string): string {
  return `var(--color-tag-${slug}, var(--color-primary))`;
}
