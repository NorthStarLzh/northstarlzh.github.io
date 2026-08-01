import type {PageResult, Photo} from '@/content/contracts';

export type PhotosApiSuccess = PageResult<Photo>;

export interface PhotosApiError {
  error: {
    code:
      | 'INVALID_REQUEST'
      | 'INVALID_CURSOR'
      | 'RATE_LIMITED'
      | 'CONTENT_UNAVAILABLE';
    message: string;
  };
}

export type PhotosApiResponse = PhotosApiSuccess | PhotosApiError;

export function isPhotosApiError(value: PhotosApiResponse): value is PhotosApiError {
  return 'error' in value;
}
