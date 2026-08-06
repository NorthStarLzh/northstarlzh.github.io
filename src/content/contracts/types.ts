export const LOCALES = ['zh', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const THEME_MODES = ['light', 'dark', 'system'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const PHOTO_CATEGORIES = ['landscape', 'portrait'] as const;
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export interface LocalizedText {
  zh: string;
  en: string;
}

export interface ImageAsset {
  id: string;
  width: number;
  height: number;
  aspectRatio: number;
  blurDataUrl?: string;
  alt: LocalizedText;
}

export interface Profile {
  nickname: string;
  avatar: ImageAsset;
  bio: LocalizedText;
  institution: string;
  role: LocalizedText;
  email: string;
  heroPhotoId: string;
  resumeUrl: string;
}

export interface EducationEntry {
  id: string;
  institution: LocalizedText;
  description: LocalizedText;
  period: string;
  order: number;
}

export interface AwardEntry {
  id: string;
  title: LocalizedText;
  date: string;
  description?: LocalizedText;
  order: number;
}

export interface Photo {
  id: string;
  image: ImageAsset;
  categories: PhotoCategory[];
  /** Optional shooting date (YYYY-MM). */
  shotAt?: string;
  /** Optional shooting city. */
  city?: LocalizedText;
  /** Optional description. */
  description?: LocalizedText;
  featured: boolean;
  featuredOrder?: number;
}

export interface PhotoCollection {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  slug: string;
  /** Optional curated cover; falls back to the first photo in components. */
  cover?: ImageAsset;
  photos: Photo[];
  sortOrder?: number;
}

export interface PaperResult {
  id: string;
  title: LocalizedText;
}

export interface ResearchProject {
  id: string;
  title: LocalizedText;
  period: string;
  summary: LocalizedText;
  images: ImageAsset[];
  papers: PaperResult[];
  featured: boolean;
  featuredOrder?: number;
}

export interface PageResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PhotoPageInput {
  category: PhotoCategory;
  cursor?: string;
  limit: number;
}
