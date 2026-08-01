import type {
  AwardEntry,
  EducationEntry,
  Photo,
  PhotoRepository,
  Profile,
  ProfileRepository,
  ResearchProject,
  ResearchRepository,
} from '@/content/contracts';

export interface HomeRepositories {
  profile: ProfileRepository;
  photos: PhotoRepository;
  research: ResearchRepository;
}

export type HomeContentResult<T> =
  | { status: 'ready'; value: T }
  | { status: 'error' };

export interface HomeContent {
  profile: HomeContentResult<Profile>;
  hero: HomeContentResult<Photo>;
  photos: HomeContentResult<Photo[]>;
  projects: HomeContentResult<ResearchProject[]>;
  education: HomeContentResult<EducationEntry[]>;
  awards: HomeContentResult<AwardEntry[]>;
}

export type HomeContentRequests = {
  [Key in keyof HomeContent]: Promise<HomeContent[Key]>;
};

function settle<T>(load: () => Promise<T>): Promise<HomeContentResult<T>> {
  try {
    return Promise.resolve(load()).then(
      (value) => ({ status: 'ready', value }),
      () => ({ status: 'error' }),
    );
  } catch {
    return Promise.resolve({ status: 'error' });
  }
}

export async function loadHomeContent(
  repositories: HomeRepositories,
): Promise<HomeContent> {
  const requests = startHomeContentRequests(repositories);

  const [profile, hero, photos, projects, education, awards] = await Promise.all([
    requests.profile,
    requests.hero,
    requests.photos,
    requests.projects,
    requests.education,
    requests.awards,
  ]);

  return { profile, hero, photos, projects, education, awards };
}

export function startHomeContentRequests(
  repositories: HomeRepositories,
): HomeContentRequests {
  return {
    profile: settle(() => repositories.profile.getProfile()),
    hero: settle(() => repositories.photos.getHeroPhoto()),
    photos: settle(() => repositories.photos.listFeatured(5)),
    projects: settle(() => repositories.research.listFeatured(3)),
    education: settle(() => repositories.profile.listEducation()),
    awards: settle(() => repositories.profile.listAwards()),
  };
}
