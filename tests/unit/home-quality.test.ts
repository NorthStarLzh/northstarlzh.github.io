import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();

describe('home responsive motion', () => {
  it('uses light scroll reveal transforms and removes displacement for reduced motion', () => {
    const styles = readFileSync(
      resolve(projectRoot, 'src/features/home/home.module.css'),
      'utf8',
    );

    expect(styles).toMatch(/@keyframes\s+home-reveal/u);
    expect(styles).toMatch(/animation-timeline:\s*view\(\)/u);
    expect(styles).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.reveal[\s\S]*?transform:\s*none/u,
    );
  });

  it('defines mobile-first layouts with tablet and desktop refinements', () => {
    const styles = readFileSync(
      resolve(projectRoot, 'src/features/home/home.module.css'),
      'utf8',
    );

    expect(styles).toMatch(/@media\s*\(min-width:\s*48rem\)/u);
    expect(styles).toMatch(/@media\s*\(min-width:\s*75rem\)/u);
    expect(styles).not.toMatch(/filter:\s*(?:grayscale|sepia|saturate)/u);
  });
});
