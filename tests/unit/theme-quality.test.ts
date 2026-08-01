import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const stylesPath = fileURLToPath(
  new URL('../../src/styles/globals.css', import.meta.url),
);
const imagePath = fileURLToPath(
  new URL('../../src/components/ui/app-image.tsx', import.meta.url),
);
const rootLayoutPath = fileURLToPath(
  new URL('../../src/app/layout.tsx', import.meta.url),
);
const styles = readFileSync(stylesPath, 'utf8');
const imageComponent = readFileSync(imagePath, 'utf8');
const rootLayout = readFileSync(rootLayoutPath, 'utf8');

function cssBlock(selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = styles.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`));
  if (!match) throw new Error(`Missing CSS block: ${selector}`);
  return match[1];
}

function token(block: string, name: string): string {
  const match = block.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Missing hex color token: ${name}`);
  return match[1];
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4,
    );

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('theme visual quality', () => {
  it.each([
    [':root', 'light'],
    ["[data-theme='dark']", 'dark'],
  ])('%s base page colors meet WCAG AA contrast', (selector) => {
    const block = cssBlock(selector);
    const background = token(block, '--color-bg');

    for (const foregroundToken of [
      '--color-text',
      '--color-text-muted',
      '--ds-color-accent',
    ]) {
      expect(
        contrastRatio(token(block, foregroundToken), background),
        `${foregroundToken} on ${background}`,
      ).toBeGreaterThanOrEqual(4.5);
    }

    expect(
      contrastRatio(
        token(block, '--ds-color-accent-contrast'),
        token(block, '--ds-color-accent'),
      ),
      'accent text on accent surface',
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps photography assets free of color-altering presentation', () => {
    const imageRule = cssBlock('.ds-app-image');
    expect(imageRule).not.toMatch(/\bfilter\s*:/);
    expect(imageRule).not.toMatch(/\bmix-blend-mode\s*:/);
    expect(imageRule).not.toMatch(/\bopacity\s*:/);
    expect(imageComponent).toContain("'ds-app-image'");
  });

  it('boots the persisted theme before the body and suppresses only the root hydration warning', () => {
    const headIndex = rootLayout.indexOf('<head>');
    const bootstrapIndex = rootLayout.indexOf(
      'dangerouslySetInnerHTML={{ __html: THEME_STORAGE_BOOTSTRAP_SCRIPT }}',
      headIndex,
    );
    const bodyIndex = rootLayout.indexOf('<body>');

    expect(rootLayout).toContain('suppressHydrationWarning');
    expect(headIndex).toBeGreaterThan(-1);
    expect(bootstrapIndex).toBeGreaterThan(headIndex);
    expect(bodyIndex).toBeGreaterThan(bootstrapIndex);
  });
});
