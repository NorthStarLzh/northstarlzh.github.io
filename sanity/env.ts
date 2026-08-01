const DEFAULT_API_VERSION = '2026-07-27';
const DEVELOPMENT_DATASET = 'development';

export interface SanityEnvironment {
  projectId: string;
  dataset: string;
  apiVersion: string;
  configured: boolean;
}

interface SanityProcessEnvironment {
  NEXT_PUBLIC_SANITY_PROJECT_ID?: string;
  NEXT_PUBLIC_SANITY_DATASET?: string;
  NEXT_PUBLIC_SANITY_API_VERSION?: string;
}

export function getSanityEnvironment(
  environment?: SanityProcessEnvironment,
): SanityEnvironment {
  // Keep the default reads as direct property accesses so Next.js can inline
  // NEXT_PUBLIC_* values into the client-side embedded Studio bundle.
  const projectId = (environment
    ? environment.NEXT_PUBLIC_SANITY_PROJECT_ID
    : process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)?.trim();
  const dataset = (environment
    ? environment.NEXT_PUBLIC_SANITY_DATASET
    : process.env.NEXT_PUBLIC_SANITY_DATASET)?.trim();
  const apiVersion = (environment
    ? environment.NEXT_PUBLIC_SANITY_API_VERSION
    : process.env.NEXT_PUBLIC_SANITY_API_VERSION)?.trim();

  return {
    // Sanity validates these values while Next.js builds. This non-secret local
    // placeholder keeps the Studio route buildable until a real project is linked.
    projectId: projectId || 'studio-placeholder',
    dataset: dataset || DEVELOPMENT_DATASET,
    apiVersion: apiVersion || DEFAULT_API_VERSION,
    configured: Boolean(projectId && dataset),
  };
}

export {DEFAULT_API_VERSION, DEVELOPMENT_DATASET};
