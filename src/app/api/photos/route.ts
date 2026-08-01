import {createSanityRepositories} from '@/content/repositories';
import {createGetPhotosHandler, photosApiErrorResponse} from '@/features/photography';

const rateWindows = new Map<string, {count: number; startedAt: number}>();
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;

function allowPhotographyRequest(request: Request): boolean {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const key = forwarded || 'anonymous';
  const now = Date.now();
  const current = rateWindows.get(key);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    rateWindows.set(key, {count: 1, startedAt: now});
    return true;
  }
  current.count += 1;
  return current.count <= RATE_LIMIT;
}

export async function GET(request: Request) {
  try {
    return await createGetPhotosHandler(
      createSanityRepositories().photos,
      allowPhotographyRequest,
    )(request);
  } catch {
    return photosApiErrorResponse(
      500,
      'CONTENT_UNAVAILABLE',
      'Photography content is temporarily unavailable.',
    );
  }
}
