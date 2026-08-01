import { setRequestLocale } from 'next-intl/server';

import type { Locale } from '@/content/contracts';
import { createSanityRepositories } from '@/content/repositories';
import {
  renderResumePage,
  ResumeErrorState,
} from '@/features/resume';

interface ResumePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function ResumePage({ params }: ResumePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  try {
    return await renderResumePage(
      locale,
      createSanityRepositories().profile,
    );
  } catch {
    return <ResumeErrorState locale={locale} />;
  }
}
