import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const componentSource = readFileSync(
  fileURLToPath(
    new URL(
      '../../src/features/intro-animation/intro-animation.tsx',
      import.meta.url,
    ),
  ),
  'utf8',
);
const stylesSource = readFileSync(
  fileURLToPath(
    new URL(
      '../../src/features/intro-animation/intro-animation.module.css',
      import.meta.url,
    ),
  ),
  'utf8',
);

describe('intro animation quality boundaries', () => {
  it('uses lightweight DOM and no video, Canvas, 3D, or network asset', () => {
    expect(componentSource).not.toMatch(/<(?:video|canvas|img|iframe)\b/i);
    expect(componentSource).not.toMatch(/(?:fetch|XMLHttpRequest|WebGL|three)/);
    expect(stylesSource).not.toMatch(/url\s*\(/i);
  });

  it('animates only opacity and transform', () => {
    const keyframes = stylesSource.match(/@keyframes[\s\S]*$/)?.[0] ?? '';
    expect(keyframes).not.toMatch(/\b(?:top|right|bottom|left|width|height|margin|padding):/);
    expect(keyframes).toMatch(/opacity:/);
    expect(keyframes).toMatch(/transform:/);
  });

  it('keeps the reduced-motion keyframes free of displacement', () => {
    const reducedKeyframes = stylesSource.match(
      /@keyframes reduced-exit\s*{([\s\S]*?)\n}/,
    )?.[1];
    expect(reducedKeyframes).toBeDefined();
    expect(reducedKeyframes).toMatch(/opacity:/);
    expect(reducedKeyframes).not.toMatch(/transform:/);
  });

  it('never locks document scrolling', () => {
    expect(componentSource).not.toMatch(/document\.(?:body|documentElement)/);
    expect(stylesSource).not.toMatch(/overflow:\s*hidden[^}]*\b(?:html|body)\b/i);
  });
});
