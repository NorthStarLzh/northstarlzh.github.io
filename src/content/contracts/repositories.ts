import type {
  AwardEntry,
  EducationEntry,
  HeroPhoto,
  PageResult,
  Photo,
  PhotoCollection,
  PhotoPageInput,
  Profile,
  ResearchProject,
} from './types';

export interface ProfileRepository {
  getProfile(): Promise<Profile>;
  listEducation(): Promise<EducationEntry[]>;
  listAwards(): Promise<AwardEntry[]>;
}

export interface PhotoRepository {
  getHeroPhoto(): Promise<HeroPhoto>;
  listFeatured(limit: number): Promise<Photo[]>;
  listPage(input: PhotoPageInput): Promise<PageResult<Photo>>;
}

export interface ResearchRepository {
  listFeatured(limit: 3): Promise<ResearchProject[]>;
  listAll(): Promise<ResearchProject[]>;
  getById(id: string): Promise<ResearchProject | null>;
}

export interface PhotoCollectionRepository {
  listCollections(): Promise<PhotoCollection[]>;
  getCollectionBySlug(slug: string): Promise<PhotoCollection | null>;
}
