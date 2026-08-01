import type {
  AwardEntry,
  EducationEntry,
  PageResult,
  Photo,
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
  getHeroPhoto(): Promise<Photo>;
  listFeatured(limit: 5): Promise<Photo[]>;
  listPage(input: PhotoPageInput): Promise<PageResult<Photo>>;
}

export interface ResearchRepository {
  listFeatured(limit: 3): Promise<ResearchProject[]>;
  listAll(): Promise<ResearchProject[]>;
  getById(id: string): Promise<ResearchProject | null>;
}
