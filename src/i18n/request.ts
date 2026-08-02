import type {AbstractIntlMessages} from 'next-intl';
import {getRequestConfig} from 'next-intl/server';

import {getMessagesForLocale} from './messages';
import {DEFAULT_LOCALE, isSupportedLocale} from './routing';

function resolveMessagePath(messages: AbstractIntlMessages, path: string): unknown {
  let value: unknown = messages;
  for (const segment of path.split('.')) {
    if (typeof value !== 'object' || value === null) return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return value;
}

export default getRequestConfig(async ({requestLocale}) => {
  const candidate = await requestLocale;
  const locale = isSupportedLocale(candidate) ? candidate : DEFAULT_LOCALE;
  const englishMessages = getMessagesForLocale('en');

  return {
    locale,
    messages: getMessagesForLocale(locale),
    // Fall back to the English copy for a missing translation instead of
    // rendering the raw `namespace.key` path, which is confusing on a public
    // page. If English is also missing, render the plain key for debugging.
    getMessageFallback: ({key, namespace}) => {
      const path = namespace ? `${namespace}.${key}` : key;
      const englishValue = resolveMessagePath(englishMessages, path);
      return typeof englishValue === 'string' ? englishValue : key;
    },
  };
});
