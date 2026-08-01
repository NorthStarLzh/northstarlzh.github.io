import { redirect } from 'next/navigation';

import { DEFAULT_LOCALE } from '@/i18n/routing';

export default function RootPage() {
  if (process.env.GITHUB_PAGES === 'true') {
    return <meta content={`0; url=/${DEFAULT_LOCALE}/`} httpEquiv="refresh" />;
  }

  redirect(`/${DEFAULT_LOCALE}`);
}
