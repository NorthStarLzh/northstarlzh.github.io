// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { axe } from 'vitest-axe';
import { afterEach, describe, expect, it } from 'vitest';

import type { Locale } from '@/content/contracts';
import {
  AwardList,
  EducationTimeline,
  ProfileSummary,
  RESUME_DOWNLOAD_FILENAME,
  ResumeDownload,
  ResumeModule,
  ResumeSummary,
} from '@/features/resume';
import { messagesByLocale } from '@/i18n/messages';
import {
  awardFixtures,
  educationFixtures,
  profileFixture,
} from '@fixtures/domain';

afterEach(cleanup);

function renderLocalized(locale: Locale) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      <ProfileSummary
        avatarSrc="/fixtures/m13-avatar.svg"
        locale={locale}
        profile={profileFixture}
      />
    </NextIntlClientProvider>,
  );
}

describe('ProfileSummary', () => {
  it.each([
    ['zh', '仅用于自动化测试的简介。', 'Biography used only by automated tests.'],
    ['en', 'Biography used only by automated tests.', '仅用于自动化测试的简介。'],
  ] as const)(
    'shows only the %s profile content',
    (locale, expectedBio, otherBio) => {
      renderLocalized(locale);

      expect(screen.getByRole('heading', { name: profileFixture.nickname })).toBeInTheDocument();
      expect(screen.getByText(expectedBio)).toBeInTheDocument();
      expect(screen.queryByText(otherBio)).not.toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveAttribute(
        'alt',
        profileFixture.avatar.alt[locale],
      );
    },
  );
});

describe('EducationTimeline', () => {
  it('orders entries by CMS order and selects the current language', () => {
    render(
      <NextIntlClientProvider locale="zh" messages={messagesByLocale.zh}>
        <EducationTimeline entries={educationFixtures} locale="zh" />
      </NextIntlClientProvider>,
    );

    const entries = screen.getAllByRole('listitem');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toHaveTextContent('示例大学');
    expect(entries[0]).toHaveTextContent('测试教育经历一');
    expect(entries[1]).toHaveTextContent('示例研究院');
    expect(entries[1]).not.toHaveTextContent('Fixture Institute');
  });

  it('shows the localized empty state without an empty list', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messagesByLocale.en}>
        <EducationTimeline entries={[]} locale="en" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('No education entries yet')).toBeInTheDocument();
    expect(container.querySelector('ol')).not.toBeInTheDocument();
  });
});

describe('AwardList', () => {
  it('orders awards and omits an absent optional description', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messagesByLocale.en}>
        <AwardList entries={awardFixtures} locale="en" />
      </NextIntlClientProvider>,
    );

    const entries = screen.getAllByRole('listitem');
    expect(entries[0]).toHaveTextContent('Fixture award one');
    expect(within(entries[0]).queryByText('Fixture description')).not.toBeInTheDocument();
    expect(entries[1]).toHaveTextContent('Fixture award two');
    expect(entries[1]).toHaveTextContent('Fixture description');
    expect(entries[1]).not.toHaveTextContent('测试补充说明');
  });

  it('shows the localized empty state without an empty list', () => {
    const { container } = render(
      <NextIntlClientProvider locale="zh" messages={messagesByLocale.zh}>
        <AwardList entries={[]} locale="zh" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('暂无获奖经历')).toBeInTheDocument();
    expect(container.querySelector('ul')).not.toBeInTheDocument();
  });
});

describe('ResumeDownload', () => {
  it('offers the CMS PDF through one stable download filename without embedding it', () => {
    const { container } = render(
      <NextIntlClientProvider locale="zh" messages={messagesByLocale.zh}>
        <ResumeDownload locale="zh" resumeUrl={profileFixture.resumeUrl} />
      </NextIntlClientProvider>,
    );

    const link = screen.getByRole('link', { name: '下载 PDF 简历' });
    expect(link).toHaveAttribute('download', RESUME_DOWNLOAD_FILENAME);
    expect(link).toHaveAttribute(
      'href',
      `${profileFixture.resumeUrl}?dl=${RESUME_DOWNLOAD_FILENAME}`,
    );
    expect(container.querySelectorAll('iframe, embed, object')).toHaveLength(0);
  });

  it('hides a broken link and explains a missing PDF in the current language', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messagesByLocale.en}>
        <ResumeDownload locale="en" resumeUrl="" />
      </NextIntlClientProvider>,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('The résumé is not available for download')).toBeInTheDocument();
  });
});

describe('ResumeSummary', () => {
  it('reuses the profile, education, award, and download behaviors at compact density', () => {
    const { container } = render(
      <NextIntlClientProvider locale="zh" messages={messagesByLocale.zh}>
        <ResumeSummary
          content={{
            profile: profileFixture,
            education: educationFixtures,
            awards: awardFixtures,
          }}
          locale="zh"
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: '简历摘要' })).toBeInTheDocument();
    expect(screen.getByText('仅用于自动化测试的简介。')).toBeInTheDocument();
    expect(screen.getByText('示例大学')).toBeInTheDocument();
    expect(screen.getByText('测试奖项一')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '下载 PDF 简历' })).toBeInTheDocument();
    expect(container.querySelector('[data-resume-variant="summary"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-density="compact"]')).toHaveLength(3);
  });
});

describe('complete résumé module accessibility', () => {
  it('has no detectable accessibility violations', async () => {
    const { container } = render(
      <ResumeModule
        content={{
          profile: profileFixture,
          education: educationFixtures,
          awards: awardFixtures,
        }}
        locale="en"
      />,
    );

    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toHaveLength(0);
  });
});
