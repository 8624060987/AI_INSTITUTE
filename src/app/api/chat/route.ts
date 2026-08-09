import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { extractClientIp, checkPublicRateLimit, createRateLimitResponse, attachRateLimitHeaders } from '@/utils/rateLimiter';
import { ChatRequestSchema } from '@/utils/schemas';
import { parseAndValidateRequest } from '@/utils/validateSchema';
import { handleApiError } from '@/utils/errorHandler';

export async function POST(req: NextRequest) {
  const clientIp = extractClientIp(req);

  // 1. Moderate Public Rate Limiting
  const rateLimit = checkPublicRateLimit(clientIp, 'ai_chat');
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit);
  }

  // 2. Strict Schema Validation (Type, Length, History Count, Message Bounds)
  const validation = await parseAndValidateRequest(req, ChatRequestSchema);
  if (!validation.success || !validation.data) {
    return validation.response!;
  }

  try {
    const { message, history } = validation.data;

    if (!process.env.GEMINI_API_KEY) {
      console.error('[CHAT_ERROR] GEMINI_API_KEY is not configured in server environment');
      return NextResponse.json(
        { success: false, error: 'AI Academic Counselor is currently undergoing routine maintenance. Please try again shortly.' },
        { status: 503 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Format validated history (max 10 past turns)
    const sanitizedHistory = Array.isArray(history) ? history.slice(-10) : [];
    const contents = sanitizedHistory.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: String(msg.text || '').substring(0, 1000) }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: `You are the Official AI Academic Counselor & Learning Assistant for AI Institute Satana.
Your role:
1. Provide accurate, encouraging advice about our flagship career-ready programs:
   - Generative AI & Prompt Engineering Masterclass
   - Data Analytics & Power BI / SQL Bootcamp
   - Full Stack AI-Powered Web Development
   - Data Science & Machine Learning
   - Digital Marketing & Growth Strategy
2. Highlight key institute features: 1-on-1 industry mentorship, real-world live capstone projects, 100% placement assistance, handwritten notes, and live interactive batches.
3. Keep responses clear, professional, concise, structured, and helpful.`,
      },
    });

    const replyText = response.text || 'I am here to assist with course details, batch schedules, and enrollment options. How can I help?';

    const res = NextResponse.json({ reply: replyText });
    return attachRateLimitHeaders(res, rateLimit);
  } catch (error: unknown) {
    return handleApiError(
      error,
      'The AI Counselor is currently experiencing high load. Please try sending your query again in a moment.',
      { route: '/api/chat', ip: clientIp, action: 'chat_completion' }
    );
  }
}
