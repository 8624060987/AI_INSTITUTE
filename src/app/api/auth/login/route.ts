import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
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

  // 1. Strict Schema Validation
  const validation = await parseAndValidateRequest(req, LoginSchema);
  if (!validation.success || !validation.data) {
    return validation.response!;
  }

  const { email, password, role } = validation.data;
  const accountIdentifier = email.toLowerCase().trim();
  const inputPassword = password.trim();

  // 2. Check Rate Limit & Exponential Backoff
  const rateLimit = checkAuthRateLimit(ip, accountIdentifier);
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit);
  }

  try {
    const supabase = await createClient();

    // Default Faculty/Mentor Emails Whitelist
    const defaultMentorEmails = [
      'vaibhav.ahire@aiinstitute.in',
      'siddhi.pawar@aiinstitute.in',
      'vishwadeep.chavan@aiinstitute.in',
      'jay.koche@aiinstitute.in',
      'mentor@aiinstitute.in'
    ];
    const isDefaultMentor = defaultMentorEmails.includes(accountIdentifier);

    let isAuthenticated = false;
    let authUser: any = null;
    let authErrorMsg = '';

    // Step A: Attempt Supabase Auth Password Sign In
    try {
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: accountIdentifier,
        password: inputPassword,
      });

      if (authData?.user) {
        isAuthenticated = true;
        authUser = {
          id: authData.user.id,
          email: authData.user.email,
          fullName: authData.user.user_metadata?.full_name || accountIdentifier.split('@')[0],
          role: authData.user.user_metadata?.role || role || 'student',
        };
      }
    } catch (e) {}

    // Step B: If Supabase Auth didn't match, query Supabase DB 'profiles' table
    if (!isAuthenticated) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', accountIdentifier)
          .single();

        if (profile) {
          // Account exists in DB! Validate password
          const expectedPassword = profile.password;
          if (expectedPassword && expectedPassword === inputPassword) {
            isAuthenticated = true;
            authUser = {
              id: profile.id,
              email: profile.email,
              fullName: profile.full_name || profile.name,
              role: profile.role || role || 'student',
            };
          } else {
            authErrorMsg = 'Incorrect password. Please enter the exact password set during registration.';
          }
        }
      } catch (e) {}
    }

    // Step C: Fallback check for Default Faculty Accounts
    if (!isAuthenticated && isDefaultMentor) {
      if (inputPassword === 'mentor123' || inputPassword === 'aiinstitute123') {
        isAuthenticated = true;
        authUser = {
          id: `mentor_${accountIdentifier.split('@')[0]}`,
          email: accountIdentifier,
          fullName: accountIdentifier.split('@')[0].toUpperCase(),
          role: 'mentor',
        };
      } else {
        authErrorMsg = 'Incorrect mentor password. Please enter your authorized faculty password.';
      }
    }

    // Step D: STRICT REJECTION IF NOT AUTHENTICATED
    if (!isAuthenticated) {
      const failure = recordAuthFailure(ip, accountIdentifier);
      const errorMessage = authErrorMsg || (
        role === 'mentor'
          ? 'No mentor profile found for this email address. Please click "Mentor Profile Setup" to configure your account first.'
          : 'No registered student account found for this email address. Please click "Student Admission & Registration" below to enroll first.'
      );

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          rateLimit: {
            failedAttempts: failure.failedAttempts,
            backoffDelayMs: failure.backoffDelayMs,
            retryAfterSeconds: Math.ceil(failure.backoffDelayMs / 1000),
          },
        },
        { status: 401 }
      );
    }

    // On Successful Authentication: Reset failure count
    recordAuthSuccess(ip, accountIdentifier);

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.fullName,
        role: authUser.role,
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
