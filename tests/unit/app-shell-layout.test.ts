import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const localeLayout = readFileSync(
  fileURLToPath(new URL('../../src/app/[locale]/layout.tsx', import.meta.url)),
  'utf8',
);
const rootLayout = readFileSync(
  fileURLToPath(new URL('../../src/app/layout.tsx', import.meta.url)),
  'utf8',
);
const appShell = readFileSync(
  fileURLToPath(
    new URL('../../src/features/app-shell/app-shell.tsx', import.meta.url),
  ),
  'utf8',
);
const homePage = readFileSync(
  fileURLToPath(new URL('../../src/app/[locale]/page.tsx', import.meta.url)),
  'utf8',
);

describe('localized application layout', () => {
  it('composes the message and theme providers for every public page', () => {
    expect(localeLayout).toContain('<NextIntlClientProvider');
    expect(localeLayout).toContain('<ThemeProvider>');
    expect(localeLayout.indexOf('<NextIntlClientProvider')).toBeLessThan(
      localeLayout.indexOf('<ThemeProvider>'),
    );
  });

  it('keeps the global design system and pre-hydration theme bootstrap at the root', () => {
    expect(rootLayout).toContain("import '@/styles/globals.css'");
    expect(rootLayout).toContain('THEME_STORAGE_BOOTSTRAP_SCRIPT');
  });

  it('owns the only main landmark and the matching skip-link target', () => {
    expect(appShell.match(/<main\b/g)).toHaveLength(1);
    expect(appShell).toContain('href="#main-content"');
    expect(appShell).toContain('<main id="main-content" tabIndex={-1}>');
    expect(homePage).not.toMatch(/<main\b/);
  });
});
