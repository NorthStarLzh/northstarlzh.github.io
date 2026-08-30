import { setRequestLocale } from 'next-intl/server';

import type { Locale } from '@/content/contracts';
import { renderResumePage } from '@/features/resume';

interface ResumePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function ResumePage({ params }: ResumePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return renderResumePage(locale);
}
