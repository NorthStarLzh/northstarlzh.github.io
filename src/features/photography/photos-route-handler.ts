import {NextResponse} from 'next/server';

import {
  LOCALES,
  PHOTO_CATEGORIES,
  type Locale,
  type PhotoCategory,
  type PhotoRepository,
} from '@/content/contracts';
import {MAX_PHOTO_PAGE_SIZE} from '@/content/repositories';

import type {PhotosApiError, PhotosApiSuccess} from './api-contract';

type PhotosRouteResponse = PhotosApiSuccess | PhotosApiError;
type RequestGuard = (request: Request) => boolean;

function isCategory(value: string | null): value is PhotoCategory {
  return value !== null && PHOTO_CATEGORIES.includes(value as PhotoCategory);
}

function isLocale(value: string | null): value is Locale {
  return value !== null && LOCALES.includes(value as Locale);
}

export function photosApiErrorResponse(
  status: 400 | 429 | 500,
  code: PhotosApiError['error']['code'],
  message: string,
) {
  return NextResponse.json<PhotosApiError>({error: {code, message}}, {status});
}

export function createGetPhotosHandler(
  repository: PhotoRepository,
  guard: RequestGuard = () => true,
) {
  return async function getPhotos(request: Request): Promise<NextResponse<PhotosRouteResponse>> {
    const {searchParams} = new URL(request.url);
    const category = searchParams.get('category');
    const locale = searchParams.get('locale');
    const hasCursorParameter = searchParams.has('cursor');
    const cursor = searchParams.get('cursor');

    if (!isCategory(category) || !isLocale(locale) || (hasCursorParameter && !cursor)) {
      return photosApiErrorResponse(400, 'INVALID_REQUEST', 'Invalid photography pagination request.');
    }
    if (!guard(request)) {
      return photosApiErrorResponse(429, 'RATE_LIMITED', 'Too many photography pagination requests.');
    }

    try {
      const page = await repository.listPage({
        category,
        ...(cursor ? {cursor} : {}),
        limit: MAX_PHOTO_PAGE_SIZE,
      });
      return NextResponse.json<PhotosApiSuccess>(page);
    } catch (error) {
      if (error instanceof RangeError) {
        return photosApiErrorResponse(400, 'INVALID_CURSOR', 'Invalid photography cursor.');
      }
      return photosApiErrorResponse(
        500,
        'CONTENT_UNAVAILABLE',
        'Photography content is temporarily unavailable.',
      );
    }
  };
}
