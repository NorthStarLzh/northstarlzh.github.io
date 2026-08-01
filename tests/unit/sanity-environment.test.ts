import {readFileSync} from 'node:fs';

import {describe, expect, it} from 'vitest';

import {getSanityEnvironment} from '../../sanity/env';

describe('embedded Sanity environment', () => {
  it('uses an injected real development configuration', () => {
    expect(getSanityEnvironment({
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'project123',
      NEXT_PUBLIC_SANITY_DATASET: 'development',
      NEXT_PUBLIC_SANITY_API_VERSION: '2026-07-27',
    })).toEqual({
      projectId: 'project123',
      dataset: 'development',
      apiVersion: '2026-07-27',
      configured: true,
    });
  });

  it('keeps a buildable placeholder only when public identifiers are absent', () => {
    expect(getSanityEnvironment({})).toEqual({
      projectId: 'studio-placeholder',
      dataset: 'development',
      apiVersion: '2026-07-27',
      configured: false,
    });
  });

  it('uses direct NEXT_PUBLIC property reads for client-side inlining', () => {
    const source = readFileSync(new URL('../../sanity/env.ts', import.meta.url), 'utf8');
    expect(source).toContain('process.env.NEXT_PUBLIC_SANITY_PROJECT_ID');
    expect(source).toContain('process.env.NEXT_PUBLIC_SANITY_DATASET');
    expect(source).toContain('process.env.NEXT_PUBLIC_SANITY_API_VERSION');
  });
});
