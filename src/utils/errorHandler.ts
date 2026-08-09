import { NextResponse } from 'next/server';

/**
 * Standardized Server-Side Error Handler
 * 
 * Guarantees that:
 * 1. Full error stacks, internal file paths, and database errors are logged SERVER-SIDE only.
 * 2. Clients NEVER receive stack traces, system paths, or raw DB errors.
 * 3. All error responses follow a clean, consistent format.
 */

export interface ErrorLogContext {
  route?: string;
  method?: string;
  ip?: string;
  userId?: string;
  action?: string;
  extra?: Record<string, any>;
}

/**
 * Sanitizes any string to ensure no server file paths or system internals leak.
 */
export function sanitizeClientMessage(message: string, fallback: string = 'An unexpected error occurred. Please try again.'): string {
  if (!message || typeof message !== 'string') return fallback;

  // Patterns that indicate internal server or database leaks
  const internalLeakPatterns = [
    /(\/|\\)[a-zA-Z0-9_\-.]+(\/|\\)[a-zA-Z0-9_\-.]+/g, // File system paths (/app/..., C:\...)
    /at\s+[a-zA-Z0-9_.]+\s+\(/g,                        // Stack trace lines
    /PGRST[0-9]+/gi,                                    // PostgREST codes
    /SQLSTATE/gi,                                       // SQL errors
    /relation\s+["'].*["']\s+does not exist/gi,         // Postgres table leaks
    /duplicate key value violates unique constraint/gi, // DB constraint leaks
    /syntax error at or near/gi,                        // SQL syntax leaks
    /node_modules/gi,                                   // Node internals
    /ECONNREFUSED/gi,                                   // Network socket errors
    /ETIMEDOUT/gi,                                      // Socket timeout errors
    /ENOTFOUND/gi,                                      // DNS lookup errors
    /process\.env/gi,                                   // Env reference leaks
  ];

  for (const pattern of internalLeakPatterns) {
    if (pattern.test(message)) {
      return fallback;
    }
  }

  // Length cap to prevent large payload or stack dumping
  if (message.length > 150) {
    return fallback;
  }

  return message;
}

/**
 * Central API route error handler.
 * Logs full diagnostic detail on the server and returns a safe, clean response to the client.
 */
export function handleApiError(
  error: unknown,
  userMessage: string = 'Unable to process your request at this time. Please try again later.',
  context?: ErrorLogContext,
  statusCode: number = 500
): NextResponse {
  const timestamp = new Date().toISOString();
  const errorObj = error instanceof Error ? error : new Error(String(error));

  // 1. Full Server-Side Diagnostic Logging (Preserved for developers & monitoring)
  console.error('[SERVER_API_ERROR]', {
    timestamp,
    route: context?.route || 'unknown',
    method: context?.method || 'POST',
    action: context?.action || 'api_handler',
    name: errorObj.name,
    message: errorObj.message,
    stack: errorObj.stack,
    context: context?.extra,
  });

  // 2. Safe, Sanitized Client Response (No paths, no stacks, no DB errors)
  const safeMessage = sanitizeClientMessage(userMessage, 'Unable to process your request at this time. Please try again later.');

  return NextResponse.json(
    {
      success: false,
      error: safeMessage,
      timestamp,
    },
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
