import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { isSupportedLocale, routing } from '@/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split('/')[1];

  if (pathname === '/' || isSupportedLocale(firstSegment)) {
    return handleI18nRouting(request);
  }

  // Unsupported first segments must reach `[locale]`, whose layout calls
  // `notFound()`. Passing through here avoids silently prefixing `/zh`.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|studio|_next|_vercel|.*\\..*).*)'],
};
