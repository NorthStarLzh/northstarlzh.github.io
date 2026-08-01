import {NextResponse} from 'next/server';

import {handleContentRevalidation} from './webhook';
import type {CacheTagRevalidator} from './webhook';

export function createPostRevalidateHandler(
  secret: string,
  revalidate: CacheTagRevalidator,
) {
  return async function postRevalidate(request: Request) {
    const result = await handleContentRevalidation(request, secret, revalidate);
    return NextResponse.json(result.body, {status: result.status});
  };
}
