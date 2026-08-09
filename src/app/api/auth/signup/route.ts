import { NextRequest, NextResponse } from 'next/server';
import { 
  extractClientIp, 
  checkAuthRateLimit, 
  recordAuthFailure, 
  recordAuthSuccess, 
  createRateLimitResponse, 
  attachRateLimitHeaders 
} from '@/utils/rateLimiter';
import { StudentSignupSchema } from '@/utils/schemas';
import { parseAndValidateRequest } from '@/utils/validateSchema';
import { handleApiError } from '@/utils/errorHandler';

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req);

  // 1. Strict Schema Validation (Type, Length, Format, Unknown Keys)
  const validation = await parseAndValidateRequest(req, StudentSignupSchema);
  if (!validation.success || !validation.data) {
    return validation.response!;
  }

  const { fullName, email, phone, course, password, qualification, learningMode } = validation.data;
  const accountIdentifier = email.toLowerCase().trim();

  // 2. Check Rate Limit & Exponential Backoff
  const rateLimit = checkAuthRateLimit(ip, accountIdentifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit);
  }

  try {
    // Reset backoff on valid registration
    recordAuthSuccess(ip, accountIdentifier);

    const response = NextResponse.json({
      success: true,
      message: 'Student admission & profile setup registered successfully.',
      student: {
        fullName: fullName.trim(),
        email: accountIdentifier,
        phone: phone.trim(),
        course: course.trim(),
        qualification: qualification || 'Graduate / BCA / B.Tech',
        learningMode: learningMode || 'Live Interactive Batch',
      },
    });

    return attachRateLimitHeaders(response, rateLimit);
  } catch (error: unknown) {
    return handleApiError(
      error,
      'Unable to complete registration at this time. Please try again later.',
      { route: '/api/auth/signup', ip, action: 'student_signup' }
    );
  }
}
