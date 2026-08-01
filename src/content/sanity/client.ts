import {createClient} from 'next-sanity';

import type {SanityFetchOptions} from './cache';

const DEFAULT_API_VERSION = '2026-07-27';

export interface SanityQueryClient {
  fetch<T>(
    query: string,
    params: Record<string, unknown>,
    options: SanityFetchOptions,
  ): Promise<T>;
}

export interface SanityReadConfiguration {
  projectId: string;
  dataset: string;
  apiVersion: string;
  useCdn: true;
  perspective: 'published';
  stega: false;
}

export type SanityPublicEnvironment = Readonly<Record<string, string | undefined>>;

export class SanityConfigurationError extends Error {
  constructor(message = 'Public Sanity project and dataset identifiers are not configured.') {
    super(message);
    this.name = 'SanityConfigurationError';
  }
}

export function resolveSanityReadConfiguration(
  environment: SanityPublicEnvironment = process.env,
): SanityReadConfiguration {
  const projectId = environment.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = environment.NEXT_PUBLIC_SANITY_DATASET?.trim();
  const apiVersion = environment.NEXT_PUBLIC_SANITY_API_VERSION?.trim();

  if (!projectId || !dataset) {
    throw new SanityConfigurationError();
  }

  return {
    projectId,
    dataset,
    apiVersion: apiVersion || DEFAULT_API_VERSION,
    useCdn: true,
    perspective: 'published',
    stega: false,
  };
}

/**
 * Creates the public, read-only Content Lake boundary.
 *
 * The returned facade deliberately exposes only `fetch`. It never reads
 * `SANITY_READ_TOKEN` (or any token), so importing it into a server-rendered
 * page cannot bundle a write credential or offer mutation methods.
 */
export function createSanityReadClient(
  environment: SanityPublicEnvironment = process.env,
): SanityQueryClient {
  const client = createClient(resolveSanityReadConfiguration(environment));

  return {
    fetch<T>(query: string, params: Record<string, unknown>, options: SanityFetchOptions) {
      return client.fetch<T>(query, params, options);
    },
  };
}

export {DEFAULT_API_VERSION as DEFAULT_SANITY_API_VERSION};
