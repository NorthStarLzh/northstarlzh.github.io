import type {
  HeroPhoto,
  Photo,
  PhotoRepository,
  Profile,
  ProfileRepository,
} from '@/content/contracts';

export interface HomeRepositories {
  profile: ProfileRepository;
  photos: PhotoRepository;
}

export type HomeContentResult<T> =
  | { status: 'ready'; value: T }
  | { status: 'error' };

export interface HomeContent {
  profile: HomeContentResult<Profile>;
  hero: HomeContentResult<HeroPhoto>;
  photos: HomeContentResult<Photo[]>;
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

  const [profile, hero, photos] = await Promise.all([
    requests.profile,
    requests.hero,
    requests.photos,
  ]);

  return { profile, hero, photos };
}

export function startHomeContentRequests(
  repositories: HomeRepositories,
): HomeContentRequests {
  return {
    profile: settle(() => repositories.profile.getProfile()),
    hero: settle(() => repositories.photos.getHeroPhoto()),
    photos: settle(() => repositories.photos.listFeatured(1)),
  };
}
