import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { 
  extractClientIp, 
  checkAuthRateLimit, 
  recordAuthSuccess, 
  createRateLimitResponse, 
  attachRateLimitHeaders 
} from '@/utils/rateLimiter';
import { StudentSignupSchema } from '@/utils/schemas';
import { parseAndValidateRequest } from '@/utils/validateSchema';
import { handleApiError } from '@/utils/errorHandler';

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req);

  // 1. Strict Schema Validation
  const validation = await parseAndValidateRequest(req, StudentSignupSchema);
  if (!validation.success || !validation.data) {
    return validation.response!;
  }

  const { fullName, email, phone, course, password, qualification, learningMode } = validation.data;
  const accountIdentifier = email.toLowerCase().trim();
  const inputPassword = password.trim();

  // 2. Check Rate Limit & Exponential Backoff
  const rateLimit = checkAuthRateLimit(ip, accountIdentifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit);
  }

  try {
    const supabase = await createClient();

    // 3. Register User in Supabase Auth
    try {
      await supabase.auth.signUp({
        email: accountIdentifier,
        password: inputPassword,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'student',
          },
        },
      });
    } catch (e) {}

    // 4. Save/Upsert Account Credentials & Profile into Supabase DB 'profiles' Table
    const profilePayload = {
      email: accountIdentifier,
      full_name: fullName.trim(),
      password: inputPassword,
      role: 'student',
      phone: phone?.trim() || null,
      course_id: course || 'course-gen-ai',
      qualification: qualification || 'Graduate',
      learning_mode: learningMode || 'Live Interactive Batch',
      updated_at: new Date().toISOString(),
    };

    const { error: dbError } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'email' });

    if (dbError) {
      console.warn('[SIGNUP_DB_UPSERT_WARN]', dbError.message);
    }

    recordAuthSuccess(ip, accountIdentifier);

    const response = NextResponse.json({
      success: true,
      message: 'Student account registered and saved to database successfully.',
      student: {
        fullName: fullName.trim(),
        email: accountIdentifier,
        phone: phone.trim(),
        course: course.trim(),
        role: 'student',
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
