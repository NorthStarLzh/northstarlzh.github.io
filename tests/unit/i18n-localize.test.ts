import { describe, expect, it, vi } from 'vitest';

import {
  MISSING_LOCALIZED_CONTENT,
  localize,
  resolveLocalizedText,
} from '@/i18n/localize';

describe('localize', () => {
  const value = { zh: '中文内容', en: 'English content' };

  it('selects only the requested language', () => {
    expect(localize(value, 'zh')).toBe('中文内容');
    expect(localize(value, 'en')).toBe('English content');
  });

  it('returns a controlled missing result without falling back or translating', () => {
    const onMissing = vi.fn();
    const result = resolveLocalizedText(
      { zh: '已有中文', en: '   ' },
      'en',
      { path: 'photo.description', onMissing },
    );

    expect(result).toEqual({
      status: 'missing',
      locale: 'en',
      text: MISSING_LOCALIZED_CONTENT.en,
      path: 'photo.description',
    });
    expect(result.text).not.toBe('已有中文');
    expect(onMissing).toHaveBeenCalledWith({
      locale: 'en',
      path: 'photo.description',
    });
  });

  it('uses a Chinese controlled state when Chinese content is missing', () => {
    const result = resolveLocalizedText({ zh: '', en: 'English only' }, 'zh', {
      onMissing: vi.fn(),
    });

    expect(result).toEqual({
      status: 'missing',
      locale: 'zh',
      text: MISSING_LOCALIZED_CONTENT.zh,
      path: undefined,
    });
    expect(result.text).not.toBe('English only');
  });

  it('logs the missing field path outside production when no callback is supplied', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    localize({ zh: '中文', en: '' }, 'en', { path: 'profile.bio' });

    expect(warn).toHaveBeenCalledWith(
      'Missing en localized content at profile.bio.',
    );
  });

  it('reports an available result without a missing callback', () => {
    const onMissing = vi.fn();

    expect(resolveLocalizedText(value, 'zh', { onMissing })).toEqual({
      status: 'available',
      locale: 'zh',
      text: '中文内容',
    });
    expect(onMissing).not.toHaveBeenCalled();
  });
});
