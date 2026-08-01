import type { AbstractIntlMessages } from 'next-intl';

import type { Locale } from '@/content/contracts';

import en from './messages/en.json';
import zh from './messages/zh.json';

export const messagesByLocale = { zh, en } satisfies Record<
  Locale,
  AbstractIntlMessages
>;

export function getMessagesForLocale(locale: Locale): AbstractIntlMessages {
  return messagesByLocale[locale];
}
