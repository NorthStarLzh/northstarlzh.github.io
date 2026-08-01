import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell, createNavigation } from '@/features/app-shell';
import { ThemeProvider } from '@/features/theme';
import { isSupportedLocale, routing } from '@/i18n/routing';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  setRequestLocale(locale);
  const [messages, navigationTranslations] = await Promise.all([
    getMessages({ locale }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);
  const navigation = createNavigation(locale, (key) =>
    navigationTranslations(key),
  );

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider>
        <AppShell locale={locale} navigation={navigation}>
          {children}
        </AppShell>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
