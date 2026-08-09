import { NextResponse } from 'next/server';
import { z } from 'zod';

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
  expected?: string;
  received?: string;
}

export interface StrictValidationResult<T> {
  success: boolean;
  data?: T;
  response?: NextResponse;
  errors?: ValidationErrorDetail[];
}

/**
 * Validates any input against a strict Zod schema.
 * If the input violates type, length, format, or contains extra keys,
 * it is STRICTLY REJECTED with a detailed HTTP 400 response.
 */
export function validateStrictSchema<T>(
  schema: z.ZodType<T>,
  input: unknown
): StrictValidationResult<T> {
  // Reject non-object inputs when schema expects an object
  if (input === null || input === undefined) {
    const errorDetail: ValidationErrorDetail = {
      field: 'body',
      message: 'Request payload is required and cannot be null or empty.',
      code: 'missing_payload',
    };
    return {
      success: false,
      errors: [errorDetail],
      response: NextResponse.json(
        {
          success: false,
          error: 'Strict Validation Error: Request payload is required.',
          details: [errorDetail],
        },
        { status: 400 }
      ),
    };
  }

  const parseResult = schema.safeParse(input);

  if (parseResult.success) {
    return {
      success: true,
      data: parseResult.data,
    };
  }

  // Format rich, strict validation errors from issues array
  const rawIssues = (parseResult.error as any).issues || (parseResult.error as any).errors || [];
  const errors: ValidationErrorDetail[] = rawIssues.map((err: any) => {
    const path = Array.isArray(err.path) ? err.path.join('.') || 'root' : String(err.path || 'root');
    return {
      field: path,
      message: err.message || 'Field failed validation',
      code: err.code,
      expected: err.expected !== undefined ? String(err.expected) : undefined,
      received: err.received !== undefined ? String(err.received) : undefined,
    };
  });

  const firstErrorMsg = errors[0]?.message || 'Input payload failed strict schema validation';

  const response = NextResponse.json(
    {
      success: false,
      error: `Validation Error: ${firstErrorMsg}`,
      details: errors,
      validationCount: errors.length,
    },
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'X-Validation-Status': 'Rejected',
      },
    }
  );

  return {
    success: false,
    errors,
    response,
  };
}

/**
 * Helper to safely extract and validate JSON body from a Request
 */
export async function parseAndValidateRequest<T>(
  req: Request,
  schema: z.ZodType<T>
): Promise<StrictValidationResult<T>> {
  let body: unknown;

  try {
    const text = await req.text();
    if (!text || text.trim().length === 0) {
      return validateStrictSchema(schema, null);
    }
    body = JSON.parse(text);
  } catch (err: any) {
    const errorDetail: ValidationErrorDetail = {
      field: 'json',
      message: 'Malformed JSON payload. Request must contain valid JSON syntax.',
      code: 'invalid_json',
    };
    return {
      success: false,
      errors: [errorDetail],
      response: NextResponse.json(
        {
          success: false,
          error: 'Validation Error: Malformed JSON syntax.',
          details: [errorDetail],
        },
        { status: 400 }
      ),
    };
  }

  return validateStrictSchema(schema, body);
}
