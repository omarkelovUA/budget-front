import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Every stylesheet outside src/styles/theme.css uses the --color-* tokens, never raw
// colours (.docs/theme.md), so a redesign or a user-chosen primary colour reaches all of it.
const RAW_COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(|:\s*(?:white|black|red|green|blue|gr[ae]y|yellow)\b/i;

function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? stylesheets(path) : path.endsWith('.css') ? [path] : [];
  });
}

describe('colours', () => {
  it('come only from the theme tokens', () => {
    const offenders = stylesheets('src')
      .filter((path) => path !== join('src', 'styles', 'theme.css'))
      .flatMap((path) =>
        readFileSync(path, 'utf8')
          .split('\n')
          .filter((line) => RAW_COLOR.test(line))
          .map((line) => `${path}: ${line.trim()}`),
      );

    expect(offenders).toEqual([]);
  });
});
