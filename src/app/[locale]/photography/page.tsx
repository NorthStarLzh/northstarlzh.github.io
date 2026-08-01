import { redirect } from 'next/navigation';

import type { Locale } from '@/content/contracts';
import { routing } from '@/i18n/routing';

interface PhotographyIndexProps {
  params: Promise<{ locale: Locale }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function PhotographyIndex({ params }: PhotographyIndexProps) {
  const { locale } = await params;

  if (process.env.GITHUB_PAGES === 'true') {
    return <meta content={`0; url=/${locale}/photography/landscape/#gallery`} httpEquiv="refresh" />;
  }

  redirect(`/${locale}/photography/landscape/`);
}
