import {
  isValidSignature,
  SIGNATURE_HEADER_NAME,
} from '@sanity/webhook';

import {
  CONTENT_CACHE_TAGS,
  type ContentCacheTag,
} from '../sanity';

export type CacheTagRevalidator = (
  tag: ContentCacheTag,
  profile: 'max',
) => void;

export interface RevalidationSuccess {
  revalidated: ContentCacheTag[];
}

export interface RevalidationError {
  error: {
    code:
      | 'INVALID_SIGNATURE'
      | 'INVALID_BODY'
      | 'BODY_TOO_LARGE'
      | 'UNSUPPORTED_MEDIA_TYPE'
      | 'REVALIDATION_UNAVAILABLE';
  };
}

export interface RevalidationResult {
  status: 200 | 400 | 401 | 500;
  body: RevalidationSuccess | RevalidationError;
}

const DOCUMENT_TAGS = {
  profile: [CONTENT_CACHE_TAGS.profile],
  education: [CONTENT_CACHE_TAGS.education, CONTENT_CACHE_TAGS.resume],
  award: [CONTENT_CACHE_TAGS.awards, CONTENT_CACHE_TAGS.resume],
  photo: [CONTENT_CACHE_TAGS.photos, CONTENT_CACHE_TAGS.home],
  photoCollection: [CONTENT_CACHE_TAGS.photoCollections],
  researchProject: [CONTENT_CACHE_TAGS.research, CONTENT_CACHE_TAGS.home],
} as const;

type RevalidationDocumentType = keyof typeof DOCUMENT_TAGS;

const DESIGN_SIGNATURE_HEADER_NAME = 'x-webhook-signature';
const MAX_REVALIDATION_BODY_BYTES = 8 * 1024;

function errorResult(
  status: 400 | 401 | 500,
  code: RevalidationError['error']['code'],
): RevalidationResult {
  return {status, body: {error: {code}}};
}

function isJsonRequest(request: Request): boolean {
  return request.headers.get('content-type')
    ?.split(';', 1)[0]
    ?.trim()
    .toLowerCase() === 'application/json';
}

async function readLimitedRawBody(request: Request): Promise<string | null> {
  const declaredLength = request.headers.get('content-length');
  if (declaredLength && /^\d+$/.test(declaredLength)) {
    if (Number(declaredLength) > MAX_REVALIDATION_BODY_BYTES) return null;
  }
  if (!request.body) return '';

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', {fatal: true});
  let byteLength = 0;
  let result = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      byteLength += chunk.value.byteLength;
      if (byteLength > MAX_REVALIDATION_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      result += decoder.decode(chunk.value, {stream: true});
    }
    result += decoder.decode();
    return result;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function isRevalidationDocumentType(
  value: unknown,
): value is RevalidationDocumentType {
  return typeof value === 'string' && Object.hasOwn(DOCUMENT_TAGS, value);
}

function isRevalidationPayload(
  value: unknown,
): value is {documentId: string; documentType: RevalidationDocumentType} {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const payload = value as Record<string, unknown>;
  const keys = Object.keys(payload).sort();
  return keys.length === 2
    && keys[0] === 'documentId'
    && keys[1] === 'documentType'
    && typeof payload.documentId === 'string'
    && payload.documentId.trim().length > 0
    && payload.documentId.length <= 256
    && isRevalidationDocumentType(payload.documentType);
}

export async function handleContentRevalidation(
  request: Request,
  secret: string,
  revalidate: CacheTagRevalidator,
): Promise<RevalidationResult> {
  if (!isJsonRequest(request)) {
    return errorResult(400, 'UNSUPPORTED_MEDIA_TYPE');
  }
  const rawBody = await readLimitedRawBody(request);
  if (rawBody === null) return errorResult(400, 'BODY_TOO_LARGE');
  const signature = request.headers.get(SIGNATURE_HEADER_NAME)
    ?? request.headers.get(DESIGN_SIGNATURE_HEADER_NAME)
    ?? '';

  if (!(await isValidSignature(rawBody, signature, secret))) {
    return errorResult(401, 'INVALID_SIGNATURE');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return errorResult(400, 'INVALID_BODY');
  }
  if (!isRevalidationPayload(payload)) {
    return errorResult(400, 'INVALID_BODY');
  }

  const tags: ContentCacheTag[] = [...DOCUMENT_TAGS[payload.documentType]];
  try {
    for (const tag of tags) revalidate(tag, 'max');
  } catch {
    return errorResult(500, 'REVALIDATION_UNAVAILABLE');
  }
  return {status: 200, body: {revalidated: tags}};
}
