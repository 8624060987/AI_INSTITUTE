import { NextRequest, NextResponse } from 'next/server';
import { extractClientIp, checkPublicRateLimit, createRateLimitResponse, attachRateLimitHeaders } from '@/utils/rateLimiter';
import { SubmitLeadSchema } from '@/utils/schemas';
import { parseAndValidateRequest } from '@/utils/validateSchema';
import { handleApiError } from '@/utils/errorHandler';

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req);

  // 1. Moderate Public Rate Limiting
  const rateLimit = checkPublicRateLimit(ip, 'submit_lead');
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit);
  }

  // 2. Strict Schema Validation (Type, Length, Regex Format, Unknown Keys)
  const validation = await parseAndValidateRequest(req, SubmitLeadSchema);
  if (!validation.success || !validation.data) {
    return validation.response!;
  }

  try {
    const { name, phone, course } = validation.data;

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanCourse = (course || 'Generative AI Master Class').trim();
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    const sheetId = process.env.GOOGLE_SHEETS_ID;

    let webhookStatus = 'attempted';

    if (webhookUrl) {
      try {
        const payload = JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          number: cleanPhone,
          course: cleanCourse,
          timestamp,
          sheetId: sheetId || '',
        });

        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: payload,
          redirect: 'follow',
        });

        if (res.ok || res.status === 302 || res.status === 200) {
          webhookStatus = 'pushed_to_google_sheet';
        }
      } catch (webhookErr: any) {
        console.error('[WEBHOOK_SYNC_ERROR]', {
          message: webhookErr?.message,
          stack: webhookErr?.stack,
        });
        webhookStatus = 'webhook_error';
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Your admission request has been submitted successfully.',
      sheetId: sheetId ? 'connected' : 'default',
      webhookStatus,
      data: {
        Name: cleanName,
        Number: cleanPhone,
        Course: cleanCourse,
        Timestamp: timestamp,
      },
    });

    return attachRateLimitHeaders(response, rateLimit);
  } catch (error: unknown) {
    return handleApiError(
      error,
      'Unable to submit admission application at this time. Please try again.',
      { route: '/api/submit-lead', ip, action: 'submit_lead' }
    );
  }
}
