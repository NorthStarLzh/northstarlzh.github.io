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

type Rgba = { r: number; g: number; b: number; a: number };

function parseColor(value: string): Rgba {
  const trimmed = value.trim();
  const hex = trimmed.match(/^#([0-9a-fA-F]{6})$/);
  if (hex) {
    const channels = hex[1].match(/.{2}/g)!.map((part) =>
      Number.parseInt(part, 16),
    );
    return { r: channels[0], g: channels[1], b: channels[2], a: 1 };
  }

  const rgb = trimmed.match(
    /^rgb\(\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*\/\s*([\d.]+)%\s*\)$/,
  );
  if (!rgb) throw new Error(`Unsupported color token: ${value}`);
  return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: +rgb[4] / 100 };
}

function composite(foreground: Rgba, background: Rgba): Rgba {
  const alpha = foreground.a;
  return {
    r: Math.round(foreground.r * alpha + background.r * (1 - alpha)),
    g: Math.round(foreground.g * alpha + background.g * (1 - alpha)),
    b: Math.round(foreground.b * alpha + background.b * (1 - alpha)),
    a: 1,
  };
}

function token(block: string, name: string): string {
  const match = block.match(new RegExp(`${name}:\\s*([^;]+)`));
  if (!match) throw new Error(`Missing color token: ${name}`);
  return match[1].trim();
}

function luminance(color: Rgba): number {
  const [r, g, b] = [color.r, color.g, color.b].map((channel) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function contrastRatio(first: Rgba, second: Rgba): number {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
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
    const background = parseColor(token(block, '--color-bg'));

    for (const foregroundToken of [
      '--color-text',
      '--color-text-muted',
      '--ds-color-accent',
    ]) {
      const effective = composite(
        parseColor(token(block, foregroundToken)),
        background,
      );
      expect(
        contrastRatio(effective, background),
        `${foregroundToken} meets AA on the page background`,
      ).toBeGreaterThanOrEqual(4.5);
    }

    expect(
      contrastRatio(
        parseColor(token(block, '--ds-color-accent-contrast')),
        parseColor(token(block, '--ds-color-accent')),
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
