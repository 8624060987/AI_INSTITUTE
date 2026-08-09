import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { extractClientIp, checkPublicRateLimit, createRateLimitResponse, attachRateLimitHeaders } from '@/utils/rateLimiter';
import { CreateOrderSchema } from '@/utils/schemas';
import { parseAndValidateRequest } from '@/utils/validateSchema';
import { handleApiError } from '@/utils/errorHandler';

const SEED_PRICES: Record<string, number> = {
  'course-ds':                4599,
  'course-da':                3999,
  'course-dm':                3499,
  'course-ai-ml':             4599,
  'course-gen-ai':            2999,
  'course-cyber-sec':         4299,
  'course-business-analyst':  2499,
  'course-it':                3999,
  'course-comm':              1999,
  'course-soft-skills':       1499,
};

export async function POST(req: NextRequest) {
  const clientIp = extractClientIp(req);

  // 1. Moderate Public Rate Limiting
  const rateLimit = checkPublicRateLimit(clientIp, 'payment_order');
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit);
  }

  // 2. Strict Schema Validation (Type, Length, Format, Unknown Keys)
  const validation = await parseAndValidateRequest(req, CreateOrderSchema);
  if (!validation.success || !validation.data) {
    return validation.response!;
  }

  try {
    const { courseId, studentEmail, studentName, studentPhone, amount: customAmount } = validation.data;

    let finalAmount = customAmount;
    if (!finalAmount) {
      finalAmount = SEED_PRICES[courseId] || 2999;
    }

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      // In development / demo mode, return mock order
      const mockOrder = {
        id: `order_mock_${Date.now()}`,
        amount: finalAmount * 100,
        currency: 'INR',
        receipt: `rcpt_${courseId}_${Date.now()}`,
        status: 'created',
      };
      const res = NextResponse.json(mockOrder);
      return attachRateLimitHeaders(res, rateLimit);
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: finalAmount * 100, // amount in paise
      currency: 'INR',
      receipt: `rcpt_${courseId.slice(0, 10)}_${Date.now().toString().slice(-6)}`,
      notes: {
        courseId,
        studentEmail: studentEmail || '',
        studentName: studentName || '',
        studentPhone: studentPhone || '',
      },
    };

    const order = await razorpay.orders.create(options);
    const res = NextResponse.json(order);
    return attachRateLimitHeaders(res, rateLimit);
  } catch (error: unknown) {
    return handleApiError(
      error,
      'Unable to create checkout order at this time. Please try again or pay via UPI QR.',
      { route: '/api/payment/create-order', ip: clientIp, action: 'razorpay_order_create' }
    );
  }
}
