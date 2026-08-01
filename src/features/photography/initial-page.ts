import type {PageResult, Photo, PhotoRepository} from '@/content/contracts';
import {MAX_PHOTO_PAGE_SIZE} from '@/content/repositories';

import {parsePhotoCategory} from './category';

type QueryValue = string | string[] | undefined;

export interface PhotographyPageSearchParams {
  category?: QueryValue;
}

export async function loadInitialPhotographyPage(
  repository: PhotoRepository,
  searchParams: PhotographyPageSearchParams,
): Promise<{category: 'landscape' | 'portrait'; page: PageResult<Photo>}> {
  const category = parsePhotoCategory(searchParams.category);
  const page = await repository.listPage({
    category,
    limit: MAX_PHOTO_PAGE_SIZE,
  });
  return {category, page};
}
