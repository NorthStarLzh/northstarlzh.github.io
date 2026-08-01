import {ModuleState} from '@/components/feedback';
import {Container, Section} from '@/components/layout';
import type {Locale, ProfileRepository} from '@/content/contracts';
import {messagesByLocale} from '@/i18n/messages';

import {loadResumeContent} from './load-resume-content';
import {ResumeModule} from './resume-module';

export function ResumeErrorState({locale}: {locale: Locale}) {
  const messages = messagesByLocale[locale].resume;
  return (
    <Section>
      <Container size="narrow">
        <ModuleState
          description={messages.errorDescription}
          kind="error"
          locale={locale}
          title={messages.errorTitle}
        />
      </Container>
    </Section>
  );
}

export async function renderResumePage(
  locale: Locale,
  repository: ProfileRepository,
) {
  try {
    const content = await loadResumeContent(repository);
    return <ResumeModule content={content} locale={locale} />;
  } catch {
    return <ResumeErrorState locale={locale} />;
  }
}
