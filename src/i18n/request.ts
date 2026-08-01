import { getRequestConfig } from 'next-intl/server';

import { getMessagesForLocale } from './messages';
import { DEFAULT_LOCALE, isSupportedLocale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const candidate = await requestLocale;
  const locale = isSupportedLocale(candidate) ? candidate : DEFAULT_LOCALE;

  return {
    locale,
    messages: getMessagesForLocale(locale),
  };
});
