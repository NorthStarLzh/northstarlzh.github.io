import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { InvalidContentError, mapResearchProject } from '@/content/mappers';

const projectRoot = process.cwd();

function rawImage(id: string) {
  return {
    id,
    width: 1600,
    height: 1000,
    alt: { zh: `图片 ${id}`, en: `Image ${id}` },
  };
}

function rawResearch(imageCount: number) {
  return {
    _id: `invalid-research-${imageCount}`,
    title: { zh: '非法项目', en: 'Invalid project' },
    period: '2025–2026',
    summary: { zh: '摘要', en: 'Summary' },
    images: Array.from({ length: imageCount }, (_, index) =>
      rawImage(`image-${index + 1}`),
    ),
    papers: [
      {
        _key: 'paper-1',
        title: { zh: '论文', en: 'Paper' },
      },
    ],
    featured: false,
  };
}

describe('research module boundaries', () => {
  it.each([0, 4])('rejects a project with %i images before it reaches the UI', (count) => {
    expect(() => mapResearchProject(rawResearch(count))).toThrow(
      InvalidContentError,
    );
  });

  it('keeps desktop and mobile dialog layouts bounded and internally scrollable', () => {
    const styles = readFileSync(
      resolve(projectRoot, 'src/styles/globals.css'),
      'utf8',
    );

    expect(styles).toMatch(/\.research-dialog\s*\{[\s\S]*?width:\s*min\(/u);
    expect(styles).toMatch(/\.ds-dialog-body\s*\{[\s\S]*?overflow-y:\s*auto/u);
    expect(styles).toMatch(
      /@media \(max-width: 47\.999rem\)[\s\S]*?\.research-dialog__images\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/u,
    );
    expect(styles).toMatch(
      /@media \(max-width: 47\.999rem\)[\s\S]*?\.research-dialog\s*\{[\s\S]*?max-height:\s*calc\(100dvh/u,
    );
  });
});
