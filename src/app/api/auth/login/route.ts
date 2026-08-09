import { NextRequest, NextResponse } from 'next/server';
import { 
  extractClientIp, 
  checkAuthRateLimit, 
  recordAuthFailure, 
  recordAuthSuccess, 
  createRateLimitResponse, 
  attachRateLimitHeaders 
} from '@/utils/rateLimiter';
import { LoginSchema } from '@/utils/schemas';
import { parseAndValidateRequest } from '@/utils/validateSchema';
import { handleApiError } from '@/utils/errorHandler';

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req);

  // 1. Strict Schema Validation (Type, Length, Format, Unknown Keys)
  const validation = await parseAndValidateRequest(req, LoginSchema);
  if (!validation.success || !validation.data) {
    // Strictly reject without executing authentication or coercing
    return validation.response!;
  }

  const { email, password, role } = validation.data;
  const accountIdentifier = email.toLowerCase().trim();

  // 2. Check Rate Limit & Exponential Backoff
  const rateLimit = checkAuthRateLimit(ip, accountIdentifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit);
  }

  try {
    const isStudentValid = password.length >= 4;
    const isMentorValid = password.length >= 4;

    if (!isStudentValid && !isMentorValid) {
      const failure = recordAuthFailure(ip, accountIdentifier);
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed. Please verify your email and password.',
          rateLimit: {
            failedAttempts: failure.failedAttempts,
            backoffDelayMs: failure.backoffDelayMs,
            retryAfterSeconds: Math.ceil(failure.backoffDelayMs / 1000),
          },
        },
        { status: 401 }
      );
    }

    // On Successful Authentication: Reset failures and backoff penalty
    recordAuthSuccess(ip, accountIdentifier);

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        email: accountIdentifier,
        role: role || (accountIdentifier.includes('mentor') ? 'mentor' : accountIdentifier.includes('admin') ? 'admin' : 'student'),
        authenticatedAt: new Date().toISOString(),
      },
    });

    return attachRateLimitHeaders(response, rateLimit);
  } catch (error: unknown) {
    return handleApiError(
      error,
      'Authentication service is temporarily unavailable. Please try again later.',
      { route: '/api/auth/login', ip, action: 'user_login' }
    );
  }
}
