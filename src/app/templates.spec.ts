import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function templates(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? templates(path) : path.endsWith('.html') ? [path] : [];
  });
}

const ALL = templates('src/app');
const OPENING_TAG = /<([a-z][\w-]*)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*\/?>/g;

describe('templates', () => {
  it('never repeat an attribute on one element (the second one would be dropped)', () => {
    const repeats = ALL.flatMap((path) =>
      [...readFileSync(path, 'utf8').matchAll(OPENING_TAG)].flatMap(([tag, , attributes]) => {
        const names = [...attributes.matchAll(/\s+([^\s=>/]+)(?:="[^"]*")?/g)].map((m) => m[1]);
        return names.some((name, i) => names.indexOf(name) !== i) ? [`${path}: ${tag.replace(/\s+/g, ' ')}`] : [];
      }),
    );

    expect(repeats).toEqual([]);
  });

  // One h1 per screen (the page header, or the sign-in/up title); panels and sections are
  // h2, their parts h3.
  it('keep a heading order without skipped levels', () => {
    expect(readFileSync('src/app/app.html', 'utf8')).not.toMatch(/<h1/);
    const panelsBelowH2 = ALL.filter((path) => /class="panel-header">\s*<app-[\w-]+ \/>\s*<h3/.test(readFileSync(path, 'utf8')));
    expect(panelsBelowH2).toEqual([]);
    expect(readFileSync('src/app/features/auth/login-page/login-page.html', 'utf8')).toMatch(/<h1/);
    expect(readFileSync('src/app/features/dashboard/dashboard.html', 'utf8')).not.toMatch(/<h3/);
  });
});
