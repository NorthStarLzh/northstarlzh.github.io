import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const repositoryBoundary = {
  files: ['src/app/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'sanity',
            message: 'Pages must access content through repository interfaces.',
          },
          {
            name: 'next-sanity',
            message: 'Pages must access content through repository interfaces.',
          },
        ],
        patterns: [
          {
            group: [
              '@/content/sanity',
              '@/content/sanity/*',
              '**/content/sanity/*',
              '@sanity/*',
            ],
            message:
              'Pages must not import Sanity clients, GROQ, or raw documents directly.',
          },
        ],
      },
    ],
  },
};

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  repositoryBoundary,
  globalIgnores([
    '.next/**',
    '.playwright-browsers/**',
    'out/**',
    'build/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
  ]),
]);
