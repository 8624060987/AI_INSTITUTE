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

    // ─────────────────────────────────────────────────────────────
    // Step 0: Check Google Sheets Registration Database First
    // ─────────────────────────────────────────────────────────────
    const sheetWebhookUrl = process.env.GOOGLE_SHEETS_REGISTRATION_WEBHOOK_URL;
    if (sheetWebhookUrl && role !== 'mentor') {
      try {
        const sheetRes = await fetch(sheetWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'login',
            email: accountIdentifier,
            password: inputPassword,
            pass: inputPassword,
          }),
          redirect: 'follow',
        });

        const sheetData = await sheetRes.json().catch(() => null);

        if (sheetData?.success && sheetData?.user) {
          recordAuthSuccess(ip, accountIdentifier);
          return NextResponse.json({
            success: true,
            user: {
              id: `sheet_${accountIdentifier}`,
              email: accountIdentifier,
              fullName: sheetData.user.fullName || accountIdentifier.split('@')[0].toUpperCase(),
              phone: sheetData.user.phone || '',
              course: sheetData.user.course || 'Generative AI & LLMs',
              role: 'student',
            },
            authMethod: 'google_sheet',
          });
        }

        if (sheetData?.error && sheetData.error.toLowerCase().includes('incorrect password')) {
          const failure = recordAuthFailure(ip, accountIdentifier);
          return NextResponse.json(
            {
              success: false,
              error: 'Incorrect password. Please enter the password you registered with.',
              rateLimit: {
                failedAttempts: failure.failedAttempts,
                backoffDelayMs: failure.backoffDelayMs,
                retryAfterSeconds: Math.ceil(failure.backoffDelayMs / 1000),
              },
            },
            { status: 401 }
          );
        }
      } catch (sheetErr) {
        console.error('[GOOGLE_SHEET_AUTH_ERROR]', sheetErr);
      }
    }

    // Step 1: Query Supabase DB 'profiles' table first to guarantee database registration!
    let dbProfile: any = null;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', accountIdentifier)
        .single();
      if (profile) dbProfile = profile;
    } catch (e) {}

    // STRICT SECURITY GUARD 1: IF NOT REGISTERED IN DATABASE & NOT DEFAULT FACULTY -> REJECT IMMEDIATELY!
    if (!dbProfile && !isDefaultMentor) {
      const failure = recordAuthFailure(ip, accountIdentifier);
      const errorMessage = role === 'mentor'
        ? `Access Denied: ${accountIdentifier} is not registered in AI Institute database. Please click "Set Up Mentor Profile" below to configure your account first.`
        : `Access Denied: ${accountIdentifier} is not registered in AI Institute database. Please click "Upload Photo & Setup Profile" below to enroll first.`;

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

    // STRICT SECURITY GUARD 2: ROLE AUTHORIZATION MATCHING
    const accountRole = dbProfile?.role || (isDefaultMentor ? 'mentor' : 'student');
    if (role && role !== accountRole) {
      const failure = recordAuthFailure(ip, accountIdentifier);
      const errorMessage = role === 'mentor'
        ? `Role Mismatch: ${accountIdentifier} is registered as a Student, not a Mentor. Please log in through the Student Login portal.`
        : `Role Mismatch: ${accountIdentifier} is registered as a Mentor. Please log in through the Mentor Login portal.`;

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
        { status: 403 }
      );
    }

    // Step 2: Password Verification against DB profile or Supabase Auth
    let isAuthenticated = false;
    let authUser: any = null;

    if (dbProfile) {
      const expectedPassword = dbProfile.password;
      if (expectedPassword && expectedPassword === inputPassword) {
        isAuthenticated = true;
        authUser = {
          id: dbProfile.id,
          email: dbProfile.email,
          fullName: dbProfile.full_name || dbProfile.name || accountIdentifier.split('@')[0],
          role: accountRole,
        };
      }
    }

    if (!isAuthenticated) {
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
            fullName: authData.user.user_metadata?.full_name || dbProfile?.full_name || accountIdentifier.split('@')[0],
            role: accountRole,
          };
        }
      } catch (e) {}
    }

    if (!isAuthenticated && isDefaultMentor) {
      if (inputPassword === 'mentor123' || inputPassword === 'aiinstitute123') {
        isAuthenticated = true;
        authUser = {
          id: `mentor_${accountIdentifier.split('@')[0]}`,
          email: accountIdentifier,
          fullName: accountIdentifier.split('@')[0].toUpperCase(),
          role: 'mentor',
        };
      }
    }

    // Step 3: Reject if password fails
    if (!isAuthenticated) {
      const failure = recordAuthFailure(ip, accountIdentifier);
      return NextResponse.json(
        {
          success: false,
          error: 'Incorrect password. Please enter the exact password set during registration.',
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
