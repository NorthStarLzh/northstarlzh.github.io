import {encodeSignatureHeader, SIGNATURE_HEADER_NAME} from '@sanity/webhook';
import {describe, expect, it, vi} from 'vitest';

import * as revalidationRoute from '@/app/api/revalidate/route';
import {POST} from '@/app/api/revalidate/route';
import {createPostRevalidateHandler} from '@/content/revalidation';
import {
  CONTENT_CACHE_TAGS,
  contentFetchOptions,
} from '@/content/sanity';

const WEBHOOK_SECRET = 'test-only-webhook-secret';

async function signedRequest(body: string): Promise<Request> {
  const signature = await encodeSignatureHeader(body, Date.now(), WEBHOOK_SECRET);
  return new Request('https://portfolio.test/api/revalidate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      [SIGNATURE_HEADER_NAME]: signature,
    },
    body,
  });
}

async function signedDesignContractRequest(body: string): Promise<Request> {
  const signature = await encodeSignatureHeader(body, Date.now(), WEBHOOK_SECRET);
  return new Request('https://portfolio.test/api/revalidate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-signature': signature,
    },
    body,
  });
}

describe('POST /api/revalidate', () => {
  it('exposes no handler for mutating methods other than POST', () => {
    expect('GET' in revalidationRoute).toBe(false);
    expect('PUT' in revalidationRoute).toBe(false);
    expect('PATCH' in revalidationRoute).toBe(false);
    expect('DELETE' in revalidationRoute).toBe(false);
  });

  it('accepts an authentic profile webhook and returns only its refreshed tag', async () => {
    const revalidate = vi.fn();
    const POST = createPostRevalidateHandler(WEBHOOK_SECRET, revalidate);
    const body = JSON.stringify({documentId: 'profile', documentType: 'profile'});

    const response = await POST(await signedRequest(body));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({revalidated: ['profile']});
    expect(revalidate).toHaveBeenCalledWith('profile', 'max');
  });

  it('verifies the unmodified body through the design-contract signature header', async () => {
    const revalidate = vi.fn();
    const POST = createPostRevalidateHandler(WEBHOOK_SECRET, revalidate);
    const rawBody = '{\n  "documentId": "profile", "documentType": "profile"\n}';

    const response = await POST(await signedDesignContractRequest(rawBody));

    expect(response.status).toBe(200);
    expect(revalidate).toHaveBeenCalledWith('profile', 'max');
  });

  it.each([
    ['profile', ['profile']],
    ['education', ['education', 'resume']],
    ['award', ['awards', 'resume']],
    ['photo', ['photos', 'home']],
    ['researchProject', ['research', 'home']],
  ] as const)('maps %s to its exact public cache tags', async (documentType, tags) => {
    const revalidate = vi.fn();
    const POST = createPostRevalidateHandler(WEBHOOK_SECRET, revalidate);
    const body = JSON.stringify({documentId: `${documentType}-1`, documentType});

    const response = await POST(await signedRequest(body));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({revalidated: [...tags]});
    expect(revalidate.mock.calls).toEqual(tags.map((tag) => [tag, 'max']));
  });

  it.each([null, 'not-a-sanity-signature'])
    ('rejects a %s signature without touching cache state', async (signature) => {
      const revalidate = vi.fn();
      const POST = createPostRevalidateHandler(WEBHOOK_SECRET, revalidate);
      const body = JSON.stringify({documentId: 'photo-1', documentType: 'photo'});
      const headers: Record<string, string> = {'content-type': 'application/json'};
      if (signature !== null) headers[SIGNATURE_HEADER_NAME] = signature;

      const response = await POST(new Request('https://portfolio.test/api/revalidate', {
        method: 'POST',
        headers,
        body,
      }));

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({
        error: {code: 'INVALID_SIGNATURE'},
      });
      expect(revalidate).not.toHaveBeenCalled();
    });

  it.each([
    ['malformed JSON', '{'],
    ['missing documentId', JSON.stringify({documentType: 'photo'})],
    ['empty documentId', JSON.stringify({documentId: '   ', documentType: 'photo'})],
    ['unknown type', JSON.stringify({documentId: 'item-1', documentType: 'post'})],
    ['an extra field', JSON.stringify({documentId: 'photo-1', documentType: 'photo', secret: 'no'})],
  ])('rejects a signed body with %s', async (_case, body) => {
    const revalidate = vi.fn();
    const response = await createPostRevalidateHandler(WEBHOOK_SECRET, revalidate)(
      await signedRequest(body),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({error: {code: 'INVALID_BODY'}});
    expect(revalidate).not.toHaveBeenCalled();
  });

  it('rejects non-JSON content even when its raw bytes have an authentic signature', async () => {
    const revalidate = vi.fn();
    const body = JSON.stringify({documentId: 'profile', documentType: 'profile'});
    const signature = await encodeSignatureHeader(body, Date.now(), WEBHOOK_SECRET);
    const response = await createPostRevalidateHandler(WEBHOOK_SECRET, revalidate)(
      new Request('https://portfolio.test/api/revalidate', {
        method: 'POST',
        headers: {
          'content-type': 'text/plain',
          [SIGNATURE_HEADER_NAME]: signature,
        },
        body,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {code: 'UNSUPPORTED_MEDIA_TYPE'},
    });
    expect(revalidate).not.toHaveBeenCalled();
  });

  it('rejects a body larger than 8 KiB before parsing or revalidation', async () => {
    const revalidate = vi.fn();
    const body = JSON.stringify({
      documentId: 'x'.repeat(8_193),
      documentType: 'photo',
    });
    const response = await createPostRevalidateHandler(WEBHOOK_SECRET, revalidate)(
      await signedRequest(body),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({error: {code: 'BODY_TOO_LARGE'}});
    expect(revalidate).not.toHaveBeenCalled();
  });

  it('is idempotent when Sanity retries the same webhook', async () => {
    const revalidate = vi.fn();
    const handler = createPostRevalidateHandler(WEBHOOK_SECRET, revalidate);
    const body = JSON.stringify({documentId: 'photo-1', documentType: 'photo'});

    const first = await handler(await signedRequest(body));
    const second = await handler(await signedRequest(body));

    expect(await first.json()).toEqual({revalidated: ['photos', 'home']});
    expect(await second.json()).toEqual({revalidated: ['photos', 'home']});
    expect(revalidate.mock.calls).toEqual([
      ['photos', 'max'],
      ['home', 'max'],
      ['photos', 'max'],
      ['home', 'max'],
    ]);
  });

  it('keeps the 60 second read fallback when webhook revalidation fails', async () => {
    const body = JSON.stringify({documentId: 'award-1', documentType: 'award'});
    const handler = createPostRevalidateHandler(WEBHOOK_SECRET, () => {
      throw new Error('private cache implementation detail');
    });

    const response = await handler(await signedRequest(body));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {code: 'REVALIDATION_UNAVAILABLE'},
    });
    expect(contentFetchOptions(
      CONTENT_CACHE_TAGS.awards,
      CONTENT_CACHE_TAGS.resume,
    ).next.revalidate).toBe(60);
  });

  it('fails closed without a configured server secret and never reveals its name or value', async () => {
    vi.stubEnv('SANITY_REVALIDATE_SECRET', '');
    const body = JSON.stringify({documentId: 'profile', documentType: 'profile'});

    const response = await POST(await signedRequest(body));
    const responseText = await response.text();

    expect(response.status).toBe(500);
    expect(JSON.parse(responseText)).toEqual({
      error: {code: 'REVALIDATION_UNAVAILABLE'},
    });
    expect(responseText).not.toContain('SANITY_REVALIDATE_SECRET');
    expect(responseText).not.toContain(WEBHOOK_SECRET);
    vi.unstubAllEnvs();
  });
});
