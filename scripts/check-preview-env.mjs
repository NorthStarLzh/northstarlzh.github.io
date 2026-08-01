const REQUIRED_VARIABLES = [
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'NEXT_PUBLIC_SANITY_API_VERSION',
  'SANITY_REVALIDATE_SECRET',
  'NEXT_PUBLIC_SITE_ORIGIN',
];

function isValidIdentifier(value) {
  return /^[a-z0-9][a-z0-9_-]*$/i.test(value);
}

export function validatePreviewEnvironment(environment) {
  const values = Object.fromEntries(
    REQUIRED_VARIABLES.map((name) => [name, environment[name]?.trim() ?? '']),
  );
  const errors = [];

  for (const name of REQUIRED_VARIABLES) {
    if (!values[name]) errors.push(`${name}: missing`);
  }

  if (values.NEXT_PUBLIC_SANITY_PROJECT_ID &&
      !isValidIdentifier(values.NEXT_PUBLIC_SANITY_PROJECT_ID)) {
    errors.push('NEXT_PUBLIC_SANITY_PROJECT_ID: invalid identifier format');
  }
  if (values.NEXT_PUBLIC_SANITY_DATASET &&
      values.NEXT_PUBLIC_SANITY_DATASET !== 'development') {
    errors.push('NEXT_PUBLIC_SANITY_DATASET: Preview must use development');
  }
  if (values.NEXT_PUBLIC_SANITY_API_VERSION &&
      !/^\d{4}-\d{2}-\d{2}$/.test(values.NEXT_PUBLIC_SANITY_API_VERSION)) {
    errors.push('NEXT_PUBLIC_SANITY_API_VERSION: expected YYYY-MM-DD');
  }
  if (values.SANITY_REVALIDATE_SECRET &&
      values.SANITY_REVALIDATE_SECRET.length < 32) {
    errors.push('SANITY_REVALIDATE_SECRET: expected at least 32 characters');
  }
  if (values.NEXT_PUBLIC_SITE_ORIGIN) {
    try {
      const origin = new URL(values.NEXT_PUBLIC_SITE_ORIGIN);
      if (origin.protocol !== 'https:' || origin.origin !== values.NEXT_PUBLIC_SITE_ORIGIN) {
        errors.push('NEXT_PUBLIC_SITE_ORIGIN: expected an exact HTTPS origin without a path');
      }
    } catch {
      errors.push('NEXT_PUBLIC_SITE_ORIGIN: expected a valid HTTPS origin');
    }
  }

  return errors;
}

function run() {
  const errors = validatePreviewEnvironment(process.env);
  if (errors.length > 0) {
    console.error('Preview environment is not ready:');
    for (const error of errors) console.error(`- ${error}`);
    console.error('Copy .env.example to an ignored local env file or configure Vercel Preview variables.');
    process.exitCode = 1;
    return;
  }

  console.log('Preview environment is valid. No values were printed.');
}

const entryPoint = process.argv[1] &&
  new URL(import.meta.url).pathname === new URL(`file://${process.argv[1]}`).pathname;

if (entryPoint) run();
