import {
  PHOTO_CATEGORIES,
  type AwardEntry,
  type EducationEntry,
  type PageResult,
  type Photo,
  type PhotoPageInput,
  type PhotoRepository,
  type Profile,
  type ProfileRepository,
  type ResearchProject,
  type ResearchRepository,
} from '../contracts';
import {
  ContentServiceError,
  HeroPhotoUnavailableError,
  ProfileContentError,
  consoleContentLogger,
  logInvalidDocument,
  mapAward,
  mapEducation,
  mapPhoto,
  mapProfile,
  mapResearchProject,
  mapValidDocuments,
  type ContentLogger,
} from '../mappers';
import {
  ALL_RESEARCH_QUERY,
  AWARDS_QUERY,
  CONTENT_CACHE_TAGS,
  EDUCATION_QUERY,
  FEATURED_PHOTOS_QUERY,
  FEATURED_RESEARCH_QUERY,
  HERO_PHOTO_QUERY,
  MAX_FEATURED_ORDER,
  PROFILE_QUERY,
  RESEARCH_BY_ID_QUERY,
  contentFetchOptions,
  createPhotoPageQuery,
  createSanityReadClient,
  decodePhotoCursor,
  encodePhotoCursor,
  type SanityFetchOptions,
  type SanityQueryClient,
} from '../sanity';
import {
  createE2EFixtureRepositories,
  isE2EFixtureMode,
} from './e2e-fixtures';

export const MAX_PHOTO_PAGE_SIZE = 20;

type ContentModule = 'profile' | 'education' | 'awards' | 'photos' | 'research';

async function fetchContent<T>(
  client: SanityQueryClient,
  module: ContentModule,
  query: string,
  params: Record<string, unknown>,
  options: SanityFetchOptions,
): Promise<T> {
  try {
    return await client.fetch<T>(query, params, options);
  } catch (error) {
    throw new ContentServiceError(module, {cause: error});
  }
}

function requireArray(value: unknown, module: ContentModule): unknown[] {
  if (!Array.isArray(value)) {
    throw new ContentServiceError(module, {
      cause: new TypeError('The content query returned a non-array result.'),
    });
  }
  return value;
}

function mapMany<T>(
  raw: unknown,
  mapper: (value: unknown) => T,
  logger: ContentLogger,
  module: ContentModule,
  documentType: string,
): T[] {
  return mapValidDocuments(
    requireArray(raw, module),
    mapper,
    (error) => logInvalidDocument(logger, module, documentType, error),
  );
}

export class SanityProfileRepository implements ProfileRepository {
  constructor(
    private readonly client: SanityQueryClient,
    private readonly logger: ContentLogger = consoleContentLogger,
  ) {}

  async getProfile(): Promise<Profile> {
    const raw = await fetchContent<unknown>(
      this.client,
      'profile',
      PROFILE_QUERY,
      {},
      contentFetchOptions(CONTENT_CACHE_TAGS.profile),
    );

    if (raw === null || raw === undefined) {
      throw new ProfileContentError();
    }

    try {
      return mapProfile(raw);
    } catch (error) {
      logInvalidDocument(this.logger, 'profile', 'profile', error);
      throw new ProfileContentError('The required profile content is invalid.', {cause: error});
    }
  }

  async listEducation(): Promise<EducationEntry[]> {
    const raw = await fetchContent<unknown>(
      this.client,
      'education',
      EDUCATION_QUERY,
      {},
      contentFetchOptions(CONTENT_CACHE_TAGS.education, CONTENT_CACHE_TAGS.resume),
    );
    return mapMany(raw, mapEducation, this.logger, 'education', 'education');
  }

  async listAwards(): Promise<AwardEntry[]> {
    const raw = await fetchContent<unknown>(
      this.client,
      'awards',
      AWARDS_QUERY,
      {},
      contentFetchOptions(CONTENT_CACHE_TAGS.awards, CONTENT_CACHE_TAGS.resume),
    );
    return mapMany(raw, mapAward, this.logger, 'awards', 'award');
  }
}

export class SanityPhotoRepository implements PhotoRepository {
  constructor(
    private readonly client: SanityQueryClient,
    private readonly logger: ContentLogger = consoleContentLogger,
  ) {}

  async getHeroPhoto(): Promise<Photo> {
    const options = contentFetchOptions(
      CONTENT_CACHE_TAGS.photos,
      CONTENT_CACHE_TAGS.home,
    );
    const raw = await fetchContent<unknown>(
      this.client,
      'photos',
      HERO_PHOTO_QUERY,
      {},
      options,
    );

    if (raw !== null && raw !== undefined) {
      try {
        return mapPhoto(raw);
      } catch (error) {
        logInvalidDocument(this.logger, 'photos', 'photo', error);
      }
    }

    const fallbackRaw = await fetchContent<unknown>(
      this.client,
      'photos',
      FEATURED_PHOTOS_QUERY,
      {limit: 5},
      options,
    );
    const fallback = mapMany(
      fallbackRaw,
      mapPhoto,
      this.logger,
      'photos',
      'photo',
    )[0];

    if (!fallback) {
      throw new HeroPhotoUnavailableError();
    }
    return fallback;
  }

  async listFeatured(limit: 5): Promise<Photo[]> {
    if (limit !== 5) {
      throw new RangeError('Featured photo limit must be exactly 5.');
    }
    const raw = await fetchContent<unknown>(
      this.client,
      'photos',
      FEATURED_PHOTOS_QUERY,
      {limit},
      contentFetchOptions(CONTENT_CACHE_TAGS.photos, CONTENT_CACHE_TAGS.home),
    );
    return mapMany(raw, mapPhoto, this.logger, 'photos', 'photo').slice(0, limit);
  }

  async listPage(input: PhotoPageInput): Promise<PageResult<Photo>> {
    if (!PHOTO_CATEGORIES.includes(input.category)) {
      throw new RangeError('Unsupported photo category.');
    }
    if (
      !Number.isInteger(input.limit) ||
      input.limit <= 0 ||
      input.limit > MAX_PHOTO_PAGE_SIZE
    ) {
      throw new RangeError(`Photo page limit must be between 1 and ${MAX_PHOTO_PAGE_SIZE}.`);
    }

    const cursor = input.cursor
      ? decodePhotoCursor(input.cursor, input.category)
      : undefined;
    const raw = await fetchContent<unknown>(
      this.client,
      'photos',
      createPhotoPageQuery(input.limit + 1),
      {
        category: input.category,
        hasCursor: Boolean(cursor),
        cursorFeatured: cursor?.featured ?? false,
        cursorFeaturedOrder: cursor?.featuredOrder ?? MAX_FEATURED_ORDER,
        cursorShotAt: cursor?.shotAt ?? '',
        cursorId: cursor?.id ?? '',
      },
      contentFetchOptions(CONTENT_CACHE_TAGS.photos),
    );
    const values = requireArray(raw, 'photos');
    const hasMore = values.length > input.limit;
    const pageValues = values.slice(0, input.limit);
    const items = mapMany(
      pageValues,
      mapPhoto,
      this.logger,
      'photos',
      'photo',
    );
    const boundary = pageValues.at(-1);
    const nextCursor = hasMore && boundary && typeof boundary === 'object'
      ? encodePhotoCursor(input.category, boundary)
      : null;

    return {items, nextCursor, hasMore};
  }
}

export class SanityResearchRepository implements ResearchRepository {
  constructor(
    private readonly client: SanityQueryClient,
    private readonly logger: ContentLogger = consoleContentLogger,
  ) {}

  async listFeatured(limit: 3): Promise<ResearchProject[]> {
    if (limit !== 3) {
      throw new RangeError('Featured research limit must be exactly 3.');
    }
    const raw = await fetchContent<unknown>(
      this.client,
      'research',
      FEATURED_RESEARCH_QUERY,
      {limit},
      contentFetchOptions(CONTENT_CACHE_TAGS.research, CONTENT_CACHE_TAGS.home),
    );
    return mapMany(
      raw,
      mapResearchProject,
      this.logger,
      'research',
      'researchProject',
    ).slice(0, limit);
  }

  async listAll(): Promise<ResearchProject[]> {
    const raw = await fetchContent<unknown>(
      this.client,
      'research',
      ALL_RESEARCH_QUERY,
      {},
      contentFetchOptions(CONTENT_CACHE_TAGS.research),
    );
    return mapMany(
      raw,
      mapResearchProject,
      this.logger,
      'research',
      'researchProject',
    );
  }

  async getById(id: string): Promise<ResearchProject | null> {
    if (typeof id !== 'string' || id.trim().length === 0 || id.length > 256) {
      throw new RangeError('Research project id must be a non-empty string.');
    }
    const raw = await fetchContent<unknown>(
      this.client,
      'research',
      RESEARCH_BY_ID_QUERY,
      {id: id.trim()},
      contentFetchOptions(CONTENT_CACHE_TAGS.research),
    );
    if (raw === null || raw === undefined) return null;

    try {
      return mapResearchProject(raw);
    } catch (error) {
      logInvalidDocument(this.logger, 'research', 'researchProject', error);
      return null;
    }
  }
}

export interface SanityRepositories {
  profile: ProfileRepository;
  photos: PhotoRepository;
  research: ResearchRepository;
}

export function createSanityRepositories(
  client?: SanityQueryClient,
  logger: ContentLogger = consoleContentLogger,
): SanityRepositories {
  if (isE2EFixtureMode()) {
    return createE2EFixtureRepositories();
  }

  const resolvedClient = client ?? createSanityReadClient();
  return {
    profile: new SanityProfileRepository(resolvedClient, logger),
    photos: new SanityPhotoRepository(resolvedClient, logger),
    research: new SanityResearchRepository(resolvedClient, logger),
  };
}
