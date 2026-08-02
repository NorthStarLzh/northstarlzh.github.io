import {describe, expect, it, vi} from 'vitest';

import {
  validateBilingualList,
  validateCategories,
  createFeaturedDocumentValidator,
  validateEmail,
  validateFeaturedSiblings,
  validateImageCount,
  validateNonNegativeInteger,
  validateOptionalLocalized,
  validatePdfAsset,
  validateRequiredLocalized,
  validateResearchPapers,
  validateYearMonth,
  validateYearOrMonth,
} from '../../sanity/schemaTypes/validation';

describe('Sanity field validation', () => {
  it('accepts complete bilingual values and rejects missing languages', () => {
    expect(validateRequiredLocalized({zh: '中文', en: 'English'})).toBe(true);
    expect(validateRequiredLocalized({zh: '中文', en: '  '})).toBeTypeOf('string');
    expect(validateOptionalLocalized(undefined)).toBe(true);
    expect(validateOptionalLocalized({zh: '', en: 'English'})).toBeTypeOf('string');
  });

  it('validates lists, categories, dates, email, and ordering boundaries', () => {
    expect(validateBilingualList({zh: ['一'], en: ['One']})).toBe(true);
    expect(validateBilingualList({zh: ['一'], en: ['One', 'Two']})).toBeTypeOf('string');
    expect(validateCategories(['landscape', 'portrait'])).toBe(true);
    expect(validateCategories([])).toBe(true);
    expect(validateCategories(undefined)).toBe(true);
    expect(validateCategories(['street'])).toBeTypeOf('string');
    expect(validateYearMonth('2026-07')).toBe(true);
    expect(validateYearMonth('2026-13')).toBeTypeOf('string');
    expect(validateYearOrMonth('2026')).toBe(true);
    expect(validateYearOrMonth('2026-02')).toBe(true);
    expect(validateEmail('Northstar_lzh@zju.edu.cn')).toBe(true);
    expect(validateEmail('invalid')).toBeTypeOf('string');
    expect(validateNonNegativeInteger(0)).toBe(true);
    expect(validateNonNegativeInteger(-1)).toBeTypeOf('string');
    expect(validateNonNegativeInteger(1.5)).toBeTypeOf('string');
  });

  it('requires one to three research images and papers or an explicit empty state', () => {
    expect(validateImageCount([{}, {}, {}])).toBe(true);
    expect(validateImageCount([])).toBeTypeOf('string');
    expect(validateImageCount([{}, {}, {}, {}])).toBeTypeOf('string');
    expect(validateResearchPapers([], true)).toBe(true);
    expect(validateResearchPapers([], false)).toBeTypeOf('string');
    expect(validateResearchPapers([{title: {zh: '论文', en: 'Paper'}}], false)).toBe(true);
  });

  it('checks PDF MIME through the referenced Sanity asset', async () => {
    const fetch = vi.fn().mockResolvedValueOnce('application/pdf').mockResolvedValueOnce('image/jpeg');
    const context = {getClient: () => ({fetch})};
    const file = {asset: {_ref: 'file-resume-pdf'}};

    await expect(validatePdfAsset(file, context as never)).resolves.toBe(true);
    await expect(validatePdfAsset(file, context as never)).resolves.toBeTypeOf('string');
    expect(fetch).toHaveBeenCalledWith('*[_id == $assetId][0].mimeType', {assetId: 'file-resume-pdf'});
  });
});

describe('cross-document featured validation', () => {
  it('deduplicates draft/published siblings and accepts the configured limit', () => {
    const siblings = [
      {_id: 'photo-1', featuredOrder: 0},
      {_id: 'drafts.photo-1', featuredOrder: 0},
      {_id: 'photo-2', featuredOrder: 1},
      {_id: 'photo-3', featuredOrder: 2},
      {_id: 'photo-4', featuredOrder: 3},
    ];
    expect(validateFeaturedSiblings({_id: 'drafts.photo-5', featured: true, featuredOrder: 4}, siblings, 5, '精选摄影作品')).toBe(true);
  });

  it('prefers a sibling draft order over its published order', () => {
    const siblings = [
      {_id: 'drafts.photo-1', featuredOrder: 3},
      {_id: 'photo-1', featuredOrder: 0},
    ];
    expect(validateFeaturedSiblings({_id: 'photo-2', featured: true, featuredOrder: 3}, siblings, 5, '精选摄影作品')).toContain('不能重复');
  });

  it('rejects overflow, duplicate order, and missing featured order', () => {
    const siblings = Array.from({length: 5}, (_, index) => ({_id: `photo-${index}`, featuredOrder: index}));
    expect(validateFeaturedSiblings({_id: 'photo-new', featured: true, featuredOrder: 5}, siblings, 5, '精选摄影作品')).toContain('最多');
    expect(validateFeaturedSiblings({_id: 'photo-0', featured: true, featuredOrder: 1}, siblings, 5, '精选摄影作品')).toContain('不能重复');
    expect(validateFeaturedSiblings({_id: 'photo-0', featured: true}, siblings, 5, '精选摄影作品')).toContain('非负整数');
    expect(validateFeaturedSiblings({_id: 'photo-new', featured: false}, siblings, 5, '精选摄影作品')).toBe(true);
  });

  it('loads raw draft and published siblings through the async validator', async () => {
    const fetch = vi.fn().mockResolvedValue([{_id: 'photo-1', featuredOrder: 0}]);
    const withConfig = vi.fn().mockReturnValue({fetch});
    const validator = createFeaturedDocumentValidator(5, '精选摄影作品');
    const context = {
      document: {_id: 'drafts.photo-2', _type: 'photo', featured: true, featuredOrder: 1},
      getClient: () => ({withConfig}),
    };

    await expect(validator(undefined, context as never)).resolves.toBe(true);
    expect(withConfig).toHaveBeenCalledWith({perspective: 'raw'});
    expect(fetch).toHaveBeenCalledWith(
      '*[_type == $type && featured == true]{_id, featuredOrder}[0...6]',
      {type: 'photo'},
    );
  });
});
