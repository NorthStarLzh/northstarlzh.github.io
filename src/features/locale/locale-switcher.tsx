'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui';
import type { Locale } from '@/content/contracts';
import { buildLocaleUrl } from '@/i18n/url';

export interface LocaleSwitcherProps {
  className?: string;
  locale: Locale;
}

export function LocaleSwitcher({ className, locale }: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('localeSwitcher');
  const targetLocale: Locale = locale === 'zh' ? 'en' : 'zh';
  const currentLabel = t(`languages.${locale}`);
  const targetLabel = t(`languages.${targetLocale}`);

  function switchLocale() {
    const search = typeof window === 'undefined' ? '' : window.location.search;
    const hash = typeof window === 'undefined' ? '' : window.location.hash;
    router.replace(buildLocaleUrl(pathname, targetLocale, search, hash));
  }

  return (
    <Button
      type="button"
      onClick={switchLocale}
      aria-label={t('ariaLabel', {
        current: currentLabel,
        target: targetLabel,
      })}
      className={className}
      size="sm"
      variant="ghost"
    >
      {t('switchTo', { target: targetLabel })}
    </Button>
  );
}
