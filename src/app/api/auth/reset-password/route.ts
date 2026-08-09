import { NextRequest, NextResponse } from 'next/server';
import { 
  extractClientIp, 
  checkAuthRateLimit, 
  recordAuthFailure, 
  recordAuthSuccess, 
  createRateLimitResponse, 
  attachRateLimitHeaders 
} from '@/utils/rateLimiter';
import { ResetPasswordSchema } from '@/utils/schemas';
import { parseAndValidateRequest } from '@/utils/validateSchema';
import { handleApiError } from '@/utils/errorHandler';

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req);

  // 1. Strict Schema Validation (Type, Length, Format, Unknown Keys)
  const validation = await parseAndValidateRequest(req, ResetPasswordSchema);
  if (!validation.success || !validation.data) {
    return validation.response!;
  }

  const { email, newPassword, otp } = validation.data;
  const accountIdentifier = email.toLowerCase().trim();

  // 2. Check Rate Limit & Exponential Backoff
  const rateLimit = checkAuthRateLimit(ip, accountIdentifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit);
  }

  try {
    recordAuthSuccess(ip, accountIdentifier);

    const response = NextResponse.json({
      success: true,
      message: 'Password reset request processed successfully.',
      email: accountIdentifier,
    });

    return attachRateLimitHeaders(response, rateLimit);
  } catch (error: unknown) {
    return handleApiError(
      error,
      'Unable to process password reset request. Please try again later.',
      { route: '/api/auth/reset-password', ip, action: 'password_reset' }
    );
  }
}
