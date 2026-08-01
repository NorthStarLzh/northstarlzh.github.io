import {revalidateTag} from 'next/cache';
import {NextResponse} from 'next/server';

import {
  createPostRevalidateHandler,
  type RevalidationError,
} from '@/content/revalidation';

function unavailableResponse(): NextResponse<RevalidationError> {
  return NextResponse.json(
    {error: {code: 'REVALIDATION_UNAVAILABLE'}},
    {status: 500},
  );
}

export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET?.trim();
  if (!secret) return unavailableResponse();
  return createPostRevalidateHandler(secret, revalidateTag)(request);
}
