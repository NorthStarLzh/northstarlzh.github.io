import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { BREAKPOINTS, LAYER_TOKENS, SPACE_TOKENS } from '@/styles/tokens';

const stylesPath = fileURLToPath(new URL('../../src/styles/globals.css', import.meta.url));
const styles = readFileSync(stylesPath, 'utf8');

describe('design tokens', () => {
  it('defines one mobile/tablet/desktop breakpoint contract', () => {
    expect(BREAKPOINTS).toEqual({ mobile: 0, tablet: 768, desktop: 1200 });
    expect(styles).toContain('--breakpoint-tablet: 48rem');
    expect(styles).toContain('--breakpoint-desktop: 75rem');
  });

  it('defines the required semantic token families and dark overrides', () => {
    for (const token of [
      '--color-bg',
      '--color-surface',
      '--color-dialog-surface',
      '--color-text',
      '--color-text-muted',
      '--color-border',
      '--color-accent',
      '--color-overlay',
      '--shadow-dialog',
      '--duration-intro',
      '--font-size-display',
    ]) {
      expect(styles).toContain(token);
    }
    expect(styles).toContain("[data-theme='dark']");
    expect(SPACE_TOKENS).toContain('section');
    expect(LAYER_TOKENS.dialog).toBeLessThan(LAYER_TOKENS.intro);
  });

  it('uses a bottom-sheet-safe entrance transform on mobile', () => {
    expect(styles).toContain('animation-name: ds-dialog-sheet-in');
    expect(styles).toContain('@keyframes ds-dialog-sheet-in');
    expect(styles).toContain('transform: translate(-50%, 0.75rem)');
  });

  it('uses an opaque, theme-aware reading surface for dialogs', () => {
    expect(styles).toMatch(/:root\s*\{[\s\S]*?--color-dialog-surface:\s*#ffffff/u);
    expect(styles).toMatch(
      /\[data-theme='dark'\]\s*\{[\s\S]*?--color-dialog-surface:\s*#181818/u,
    );
    expect(styles).toMatch(
      /\.ds-dialog-content\s*\{[\s\S]*?background:\s*var\(--color-dialog-surface\)/u,
    );
  });
});
