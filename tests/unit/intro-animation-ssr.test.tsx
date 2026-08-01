import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const { getTranslations, setRequestLocale } = vi.hoisted(() => ({
  getTranslations: vi.fn(
    async () => (key: string) =>
      key === 'title' ? '风花诗酒茶' : '服务端首页正文',
  ),
  setRequestLocale: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations,
  setRequestLocale,
}));

import LocaleHomePage from '@/app/[locale]/page';

describe('home page SSR without JavaScript', () => {
  it('keeps the complete home body in server HTML and emits no blocking overlay', async () => {
    const page = await LocaleHomePage({
      params: Promise.resolve({ locale: 'zh' }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('<h1>风花诗酒茶</h1>');
    expect(html).toContain('服务端首页正文');
    expect(html).toContain('id="contact"');
    expect(html).not.toContain('data-testid="intro-animation"');
    expect(getTranslations).toHaveBeenCalledTimes(1);
    expect(setRequestLocale).toHaveBeenCalledWith('zh');
  });
});
