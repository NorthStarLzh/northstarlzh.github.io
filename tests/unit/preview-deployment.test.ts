import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';

const scriptPath = fileURLToPath(new URL('../../scripts/check-preview-env.mjs', import.meta.url));

function runPreviewCheck(environment: NodeJS.ProcessEnv) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    env: environment,
    encoding: 'utf8',
  });
}

describe('Preview environment preflight', () => {
  it('fails with every missing variable name and never prints unrelated environment values', () => {
    const result = runPreviewCheck({
      NODE_ENV: 'test',
      PATH: process.env.PATH,
      PRIVATE_VALUE: 'do-not-print-this',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Preview environment is not ready');
    expect(result.stderr).toContain('NEXT_PUBLIC_SANITY_PROJECT_ID: missing');
    expect(result.stderr).toContain('NEXT_PUBLIC_SANITY_DATASET: missing');
    expect(result.stderr).toContain('NEXT_PUBLIC_SANITY_API_VERSION: missing');
    expect(result.stderr).toContain('SANITY_REVALIDATE_SECRET: missing');
    expect(result.stderr).toContain('NEXT_PUBLIC_SITE_ORIGIN: missing');
    expect(result.stderr).not.toContain('do-not-print-this');
  });

  it('rejects a non-development dataset, weak secret, and non-HTTPS origin without printing values', () => {
    const result = runPreviewCheck({
      NODE_ENV: 'test',
      PATH: process.env.PATH,
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'portfolio-project',
      NEXT_PUBLIC_SANITY_DATASET: 'production',
      NEXT_PUBLIC_SANITY_API_VERSION: 'latest',
      SANITY_REVALIDATE_SECRET: 'short-secret',
      NEXT_PUBLIC_SITE_ORIGIN: 'http://preview.example.test/path',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Preview must use development');
    expect(result.stderr).toContain('expected YYYY-MM-DD');
    expect(result.stderr).toContain('expected at least 32 characters');
    expect(result.stderr).toContain('expected an exact HTTPS origin without a path');
    expect(result.stderr).not.toContain('short-secret');
  });

  it('accepts a complete Preview configuration without echoing any value', () => {
    const result = runPreviewCheck({
      NODE_ENV: 'test',
      PATH: process.env.PATH,
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'portfolio-project',
      NEXT_PUBLIC_SANITY_DATASET: 'development',
      NEXT_PUBLIC_SANITY_API_VERSION: '2026-07-30',
      SANITY_REVALIDATE_SECRET: 'a'.repeat(32),
      NEXT_PUBLIC_SITE_ORIGIN: 'https://portfolio-preview.vercel.app',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('Preview environment is valid. No values were printed.\n');
    expect(result.stdout).not.toContain('portfolio-project');
    expect(result.stdout).not.toContain('portfolio-preview');
  });
});
