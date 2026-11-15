import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone, course, timestamp } = body;

    if (!fullName || !email) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const webhookUrl = process.env.GOOGLE_SHEETS_REGISTRATION_WEBHOOK_URL;

    if (!webhookUrl) {
      // Webhook not configured — still return success so registration doesn't fail
      return NextResponse.json({ success: true, webhookStatus: 'not_configured' });
    }

    const payload = JSON.stringify({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      course: (course || 'Generative AI & LLMs').trim(),
      timestamp: timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      sheetId: '1MWfYrxf5QC2aK6b7Ek8s1apZ18n4O9cdnvLG8yB1bg8',
    });

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload,
      redirect: 'follow',
    });

    const webhookStatus = (res.ok || res.status === 302) ? 'saved_to_sheet' : `error_${res.status}`;

    return NextResponse.json({ success: true, webhookStatus });
  } catch (err: any) {
    console.error('[REGISTER_USER_WEBHOOK_ERROR]', err?.message);
    // Always return success — registration should not fail just because sheet sync failed
    return NextResponse.json({ success: true, webhookStatus: 'sync_error' });
  }
}

