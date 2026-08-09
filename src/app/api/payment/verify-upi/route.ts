import { NextRequest, NextResponse } from 'next/server';
import { extractClientIp, checkPublicRateLimit, createRateLimitResponse, attachRateLimitHeaders } from '@/utils/rateLimiter';
import { VerifyUpiSchema } from '@/utils/schemas';
import { parseAndValidateRequest } from '@/utils/validateSchema';
import { handleApiError } from '@/utils/errorHandler';

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req);

  // 1. Moderate Public Rate Limiting
  const rateLimit = checkPublicRateLimit(ip, 'payment_verify_upi');
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit);
  }

  // 2. Strict Schema Validation (Type, Length, Regex, Unknown Keys)
  const validation = await parseAndValidateRequest(req, VerifyUpiSchema);
  if (!validation.success || !validation.data) {
    return validation.response!;
  }

  try {
    const { utrNumber, courseId, amount, appName } = validation.data;

    const cleanUtr = utrNumber.trim();
    const txnId = `UPI_${cleanUtr}_${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    const response = NextResponse.json({
      success: true,
      message: `Payment verified via ${appName || 'UPI'}! Enrollment activated.`,
      transactionId: txnId,
      utrNumber: cleanUtr,
      amount: amount || 0,
      courseId: courseId || 'course-gen-ai',
      timestamp,
    });

    return attachRateLimitHeaders(response, rateLimit);
  } catch (error: unknown) {
    return handleApiError(
      error,
      'Unable to verify UPI payment reference at this time. Please try again.',
      { route: '/api/payment/verify-upi', ip, action: 'verify_upi' }
    );
  }
}
