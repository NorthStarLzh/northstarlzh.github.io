import type {
  AwardEntry,
  EducationEntry,
  PageResult,
  Photo,
  PhotoCollection,
  PhotoCollectionRepository,
  PhotoPageInput,
  PhotoRepository,
  Profile,
  ProfileRepository,
  ResearchProject,
  ResearchRepository,
} from '../contracts';

const MEMORY_CURSOR_PREFIX = 'memory:';

function clone<T>(value: T): T {
  return structuredClone(value);
}

function byOrder<T extends { order: number }>(left: T, right: T): number {
  return left.order - right.order;
}

function byFeaturedOrder<T extends { featuredOrder?: number }>(left: T, right: T): number {
  return (left.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
    (right.featuredOrder ?? Number.MAX_SAFE_INTEGER);
}

function bySortOrder<T extends { sortOrder?: number }>(left: T, right: T): number {
  return (left.sortOrder ?? Number.MAX_SAFE_INTEGER) -
    (right.sortOrder ?? Number.MAX_SAFE_INTEGER);
}

function comparePhotos(left: Photo, right: Photo): number {
  if (left.featured !== right.featured) {
    return left.featured ? -1 : 1;
  }

  if (left.featured && right.featured) {
    const featuredDifference = byFeaturedOrder(left, right);
    if (featuredDifference !== 0) {
      return featuredDifference;
    }
  }

  const dateDifference = (right.shotAt ?? '').localeCompare(left.shotAt ?? '');
  return dateDifference === 0 ? left.id.localeCompare(right.id) : dateDifference;
}

function decodeCursor(cursor: string | undefined): number {
  if (cursor === undefined) {
    return 0;
  }

  if (!cursor.startsWith(MEMORY_CURSOR_PREFIX)) {
    throw new RangeError('Invalid in-memory photo cursor.');
  }

  const rawOffset = cursor.slice(MEMORY_CURSOR_PREFIX.length);
  const offset = Number(rawOffset);
  if (!/^\d+$/.test(rawOffset) || !Number.isSafeInteger(offset)) {
    throw new RangeError('Invalid in-memory photo cursor.');
  }

  return offset;
}

export class InMemoryProfileRepository implements ProfileRepository {
  private readonly profile: Profile;
  private readonly education: EducationEntry[];
  private readonly awards: AwardEntry[];

  constructor(
    profile: Profile,
    education: EducationEntry[] = [],
    awards: AwardEntry[] = [],
  ) {
    this.profile = clone(profile);
    this.education = clone(education);
    this.awards = clone(awards);
  }

  async getProfile(): Promise<Profile> {
    return clone(this.profile);
  }

  async listEducation(): Promise<EducationEntry[]> {
    return clone(this.education).sort(byOrder);
  }

  async listAwards(): Promise<AwardEntry[]> {
    return clone(this.awards).sort(byOrder);
  }
}

export class InMemoryPhotoRepository implements PhotoRepository {
  private readonly photos: Photo[];
  private readonly heroPhotoId: string;

  constructor(photos: Photo[], heroPhotoId = photos[0]?.id ?? '') {
    this.photos = clone(photos);
    this.heroPhotoId = heroPhotoId;
  }

  async getHeroPhoto(): Promise<Photo> {
    const hero = this.photos.find(({ id }) => id === this.heroPhotoId);
    if (!hero) {
      throw new Error(`Hero photo "${this.heroPhotoId}" was not found.`);
    }

    return clone(hero);
  }

  async listFeatured(limit: 5): Promise<Photo[]> {
    return clone(this.photos)
      .filter(({ featured }) => featured)
      .sort(byFeaturedOrder)
      .slice(0, limit);
  }

  async listPage(input: PhotoPageInput): Promise<PageResult<Photo>> {
    if (!Number.isInteger(input.limit) || input.limit <= 0) {
      throw new RangeError('Photo page limit must be a positive integer.');
    }

    const offset = decodeCursor(input.cursor);
    const matching = clone(this.photos)
      .filter(({ categories }) => categories.includes(input.category))
      .sort(comparePhotos);

    if (offset > matching.length) {
      throw new RangeError('Photo page cursor is outside the result set.');
    }

    const items = matching.slice(offset, offset + input.limit);
    const nextOffset = offset + items.length;
    const hasMore = nextOffset < matching.length;

    return {
      items,
      nextCursor: hasMore ? `${MEMORY_CURSOR_PREFIX}${nextOffset}` : null,
      hasMore,
    };
  }
}

export class InMemoryPhotoCollectionRepository implements PhotoCollectionRepository {
  private readonly collections: PhotoCollection[];

  constructor(collections: PhotoCollection[]) {
    this.collections = clone(collections);
  }

  async listCollections(): Promise<PhotoCollection[]> {
    return clone(this.collections).sort(bySortOrder);
  }

  async getCollectionBySlug(slug: string): Promise<PhotoCollection | null> {
    const collection = this.collections.find((candidate) => candidate.slug === slug);
    return collection ? clone(collection) : null;
  }
}

export class InMemoryResearchRepository implements ResearchRepository {
  private readonly projects: ResearchProject[];

  constructor(projects: ResearchProject[]) {
    this.projects = clone(projects);
  }

  async listFeatured(limit: 3): Promise<ResearchProject[]> {
    return clone(this.projects)
      .filter(({ featured }) => featured)
      .sort(byFeaturedOrder)
      .slice(0, limit);
  }

  async listAll(): Promise<ResearchProject[]> {
    return clone(this.projects);
  }

  async getById(id: string): Promise<ResearchProject | null> {
    const project = this.projects.find((candidate) => candidate.id === id);
    return project ? clone(project) : null;
  }
}
