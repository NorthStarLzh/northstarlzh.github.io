import type {SanityDocument, ValidationContext} from 'sanity';

export const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
export const YEAR_OR_MONTH_PATTERN = /^\d{4}(?:-(0[1-9]|1[0-2]))?$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ALLOWED_PHOTO_CATEGORIES = ['landscape', 'portrait'] as const;

export interface LocalizedValue {
  zh?: unknown;
  en?: unknown;
}

export interface FeaturedDocument extends SanityDocument {
  featured?: boolean;
  featuredOrder?: number;
}

interface FeaturedSibling {
  _id: string;
  featuredOrder?: number;
}

function nonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateRequiredLocalized(value: unknown): true | string {
  if (!value || typeof value !== 'object') {
    return '中文和英文内容均为必填项';
  }

  const localized = value as LocalizedValue;
  if (!nonEmptyString(localized.zh) || !nonEmptyString(localized.en)) {
    return '中文和英文内容均为必填项';
  }

  return true;
}

export function validateOptionalLocalized(value: unknown): true | string {
  if (value === undefined || value === null) return true;
  return validateRequiredLocalized(value);
}

export function validateEmail(value: unknown): true | string {
  return nonEmptyString(value) && EMAIL_PATTERN.test(String(value))
    ? true
    : '请输入有效邮箱地址';
}

export function validateYearMonth(value: unknown): true | string {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return nonEmptyString(value) && YEAR_MONTH_PATTERN.test(String(value))
    ? true
    : '请使用 YYYY-MM 格式';
}

export function validateYearOrMonth(value: unknown): true | string {
  return nonEmptyString(value) && YEAR_OR_MONTH_PATTERN.test(String(value))
    ? true
    : '请使用 YYYY 或 YYYY-MM 格式';
}

export function validateNonNegativeInteger(value: unknown): true | string {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? true
    : '排序必须是非负整数';
}

export function validateCategories(value: unknown): true | string {
  if (value === undefined || value === null) return true;
  if (!Array.isArray(value)) return '分类必须是风光或人像';
  if (value.length === 0) return true;
  const allowed = new Set<string>(ALLOWED_PHOTO_CATEGORIES);
  return value.every((category) => typeof category === 'string' && allowed.has(category))
    ? true
    : '分类只能是风光或人像';
}

export function validateImageCount(value: unknown): true | string {
  return Array.isArray(value) && value.length >= 1 && value.length <= 3
    ? true
    : '项目图片必须为 1 至 3 张';
}

export function validateBilingualList(value: unknown): true | string {
  if (!value || typeof value !== 'object') return '中文和英文列表均为必填项';
  const list = value as {zh?: unknown; en?: unknown};
  if (!Array.isArray(list.zh) || !Array.isArray(list.en)) {
    return '中文和英文列表均为必填项';
  }
  if (list.zh.length === 0 || list.en.length === 0) return '列表至少需要一项';
  if (list.zh.length !== list.en.length) return '中文和英文列表项数必须一致';
  if (![...list.zh, ...list.en].every(nonEmptyString)) return '列表项不能为空';
  return true;
}

export function validateResearchPapers(
  papers: unknown,
  noPublishedPapers: unknown,
): true | string {
  if (noPublishedPapers === true) return true;
  if (!Array.isArray(papers) || papers.length === 0) {
    return '请至少填写一篇论文，或勾选“暂无论文成果”';
  }
  return papers.every((paper) => {
    if (!paper || typeof paper !== 'object') return false;
    return validateRequiredLocalized((paper as {title?: unknown}).title) === true;
  })
    ? true
    : '每篇论文均需提供中文和英文名称';
}

export async function validatePdfAsset(
  value: unknown,
  context: ValidationContext,
): Promise<true | string> {
  if (value === undefined || value === null) return true;
  const reference = (value as {asset?: {_ref?: string}}).asset?._ref;
  if (!reference) return '请选择有效的 PDF 文件';
  const client = context.getClient({apiVersion: '2026-07-27'});
  const mimeType = await client.fetch<string | null>(
    '*[_id == $assetId][0].mimeType',
    {assetId: reference},
  );
  return mimeType === 'application/pdf' ? true : '简历文件必须为 PDF';
}

function publishedId(id: string): string {
  return id.replace(/^drafts\./, '');
}

export function validateFeaturedSiblings(
  document: Pick<FeaturedDocument, '_id' | 'featured' | 'featuredOrder'>,
  siblings: FeaturedSibling[],
  limit: number,
  label: string,
): true | string {
  if (!document.featured) return true;
  if (!Number.isInteger(document.featuredOrder) || (document.featuredOrder ?? -1) < 0) {
    return '精选内容必须设置非负整数顺序';
  }

  const ownId = publishedId(document._id);
  const uniqueOthers = new Map<string, FeaturedSibling>();
  for (const sibling of siblings) {
    const siblingId = publishedId(sibling._id);
    if (siblingId === ownId) continue;
    const existing = uniqueOthers.get(siblingId);
    // The draft is the effective value an editor is about to publish.
    if (!existing || sibling._id.startsWith('drafts.')) {
      uniqueOthers.set(siblingId, sibling);
    }
  }

  if (uniqueOthers.size + 1 > limit) return `${label}最多 ${limit} 个`;
  if (
    [...uniqueOthers.values()].some(
      (sibling) => sibling.featuredOrder === document.featuredOrder,
    )
  ) {
    return `${label}顺序不能重复`;
  }
  return true;
}

export function createFeaturedDocumentValidator(limit: number, label: string) {
  return async (value: unknown, context: ValidationContext): Promise<true | string> => {
    const document = context.document as FeaturedDocument | undefined;
    if (!document?.featured) return true;
    const client = context
      .getClient({apiVersion: '2026-07-27'})
      .withConfig({perspective: 'raw'});
    const siblings = await client.fetch<FeaturedSibling[]>(
      `*[_type == $type && featured == true]{_id, featuredOrder}[0...${limit + 1}]`,
      {type: document._type},
    );
    return validateFeaturedSiblings(document, siblings, limit, label);
  };
}
