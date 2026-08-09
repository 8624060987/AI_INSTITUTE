import { NextResponse, type NextRequest } from 'next/server';
import { 
  extractClientIp, 
  checkAuthRateLimit, 
  checkPublicRateLimit, 
  checkAuthenticatedUserRateLimit, 
  createRateLimitResponse, 
  attachRateLimitHeaders 
} from '@/utils/rateLimiter';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = extractClientIp(request);

  // 1. Tier 1: Strictest Limits on Authentication Routes
  if (pathname.startsWith('/api/auth')) {
    // API auth endpoints perform internal dual IP + Account + Exponential backoff
    // Fast-pass to endpoint handler which enforces fine-grained credentials validation
    return NextResponse.next();
  }

  if (pathname.startsWith('/login') && request.method === 'POST') {
    const rateLimit = checkAuthRateLimit(ip);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit);
    }
    const response = NextResponse.next();
    return attachRateLimitHeaders(response, rateLimit);
  }

  // 2. Tier 2: Moderate Limits on Public Endpoints (Leads, Chat, Payments, Verification)
  if (
    pathname.startsWith('/api/submit-lead') ||
    pathname.startsWith('/api/chat') ||
    pathname.startsWith('/api/payment')
  ) {
    const rateLimit = checkPublicRateLimit(ip, pathname);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit);
    }
    const response = NextResponse.next();
    return attachRateLimitHeaders(response, rateLimit);
  }

  // 3. Tier 3: Looser Limits on Authenticated User Actions (Uploads, Classroom API)
  if (pathname.startsWith('/api/upload') || pathname.startsWith('/api/user')) {
    const sessionToken = request.cookies.get('lms_session')?.value || request.headers.get('authorization') || '';
    const rateLimit = checkAuthenticatedUserRateLimit(sessionToken, ip, pathname);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit);
    }
    const response = NextResponse.next();
    return attachRateLimitHeaders(response, rateLimit);
  }

  // Default fast-pass for static assets and public landing pages
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
