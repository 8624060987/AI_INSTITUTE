import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir, stat } from 'fs/promises';
import path from 'path';
import { extractClientIp, checkAuthenticatedUserRateLimit, createRateLimitResponse, attachRateLimitHeaders } from '@/utils/rateLimiter';
import { handleApiError } from '@/utils/errorHandler';
import { 
  validateFileContentSignature, 
  sanitizeUploadFilename, 
  getIsolatedStoragePath, 
  MAX_ALLOWED_FILE_SIZE,
  ALLOWED_FILE_EXTENSIONS 
} from '@/utils/fileSecurity';

/**
 * POST /api/upload
 * Secure File Upload Endpoint:
 * - Content Inspection & Magic Byte Verification (not just extension)
 * - Anti-Executable, Anti-Polyglot, and Double-Extension Protections
 * - Storage in Isolated Directory OUTSIDE the Web Root (`storage/uploads`)
 */
export async function POST(req: NextRequest) {
  const ip = extractClientIp(req);
  const sessionToken = req.cookies.get('lms_session')?.value || req.headers.get('authorization') || '';

  // 1. Authenticated User Action Rate Limiting
  const rateLimit = checkAuthenticatedUserRateLimit(sessionToken, ip, 'file_upload');
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit);
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    // 2. Strict Payload Presence Check
    if (!file || typeof file !== 'object' || !file.name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error: File parameter is required.',
          details: [{ field: 'file', message: 'Missing file payload', code: 'missing_file' }],
        },
        { status: 400 }
      );
    }

    // 3. Strict Size Validation
    if (typeof file.size !== 'number' || file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation Error: File is empty (0 bytes).',
          details: [{ field: 'file.size', message: 'File size must be greater than 0 bytes', code: 'empty_file' }],
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_ALLOWED_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation Error: File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum 10MB limit.`,
          details: [{ field: 'file.size', message: 'Maximum file size allowed is 10MB', code: 'file_too_large' }],
        },
        { status: 400 }
      );
    }

    // 4. Strict Filename Sanitization & Double-Extension Blocking
    const nameCheck = sanitizeUploadFilename(file.name);
    if (nameCheck.error || !nameCheck.safeName) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation Error: ${nameCheck.error}`,
          details: [{ field: 'file.name', message: nameCheck.error, code: 'invalid_filename' }],
        },
        { status: 400 }
      );
    }

    // 5. Binary Magic Byte & Content Inspection (Content Validation, NOT just extension)
    const buffer = Buffer.from(await file.arrayBuffer());
    const signatureCheck = validateFileContentSignature(buffer, nameCheck.ext);

    if (!signatureCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          error: `Security Validation Failed: ${signatureCheck.error}`,
          details: [
            {
              field: 'file.content',
              message: signatureCheck.error || 'File content signature mismatch',
              code: 'invalid_content_signature',
            },
          ],
        },
        { status: 400 }
      );
    }

    // 6. Save in ISOLATED STORAGE OUTSIDE WEB ROOT (`storage/uploads`)
    const isolatedDir = getIsolatedStoragePath();
    try {
      await mkdir(isolatedDir, { recursive: true, mode: 0o755 });
    } catch (e) {}

    const safeFilename = nameCheck.safeName;
    const destinationPath = path.join(isolatedDir, safeFilename);

    // Verify destination doesn't escape isolated directory
    if (!destinationPath.startsWith(isolatedDir)) {
      return NextResponse.json(
        { success: false, error: 'Security Error: Destination directory traversal detected.' },
        { status: 400 }
      );
    }

    // Write file with non-executable permissions (0o644)
    await writeFile(destinationPath, buffer, { mode: 0o644 });

    // 7. Return Secure URL endpoint referencing isolated storage
    const secureUrl = `/api/upload?file=${encodeURIComponent(safeFilename)}`;

    const response = NextResponse.json({
      success: true,
      message: 'File verified and stored securely in isolated storage.',
      url: secureUrl,
      fileId: safeFilename,
      filename: file.name,
      size: file.size,
      mimeType: signatureCheck.detectedMime,
      extension: signatureCheck.detectedExt,
    });

    return attachRateLimitHeaders(response, rateLimit);
  } catch (error: unknown) {
    return handleApiError(
      error,
      'Unable to process file upload at this time. Please verify file integrity and try again.',
      { route: '/api/upload', ip, action: 'file_upload' }
    );
  }
}

/**
 * GET /api/upload?file=upload_...
 * Secure File Streaming & Download Handler
 * - Serves files from isolated storage outside web root
 * - Enforces X-Content-Type-Options: nosniff
 * - Enforces Content-Security-Policy: sandbox; default-src 'none' (Code cannot be executed)
 * - Content-Disposition: attachment for documents/scripts, inline with sandbox for safe images
 */
export async function GET(req: NextRequest) {
  const ip = extractClientIp(req);
  const { searchParams } = new URL(req.url);
  const rawFile = searchParams.get('file');

  if (!rawFile || typeof rawFile !== 'string') {
    return NextResponse.json({ success: false, error: 'File parameter is required.' }, { status: 400 });
  }

  // 1. Strict Path Traversal Check
  if (rawFile.includes('..') || rawFile.includes('/') || rawFile.includes('\\') || rawFile.includes('\0')) {
    return NextResponse.json({ success: false, error: 'Invalid file parameter.' }, { status: 400 });
  }

  const isolatedDir = getIsolatedStoragePath();
  const filePath = path.join(isolatedDir, rawFile);

  if (!filePath.startsWith(isolatedDir)) {
    return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return NextResponse.json({ success: false, error: 'File not found.' }, { status: 404 });
    }

    const ext = rawFile.split('.').pop()?.toLowerCase() || '';
    const config = ALLOWED_FILE_EXTENSIONS[ext];
    const mimeType = config?.mimes[0] || 'application/octet-stream';

    const fileBuffer = await readFile(filePath);

    // Is it a safe image format?
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
    const disposition = isImage ? 'inline' : `attachment; filename="${rawFile}"`;

    const headers = new Headers();
    headers.set('Content-Type', mimeType);
    headers.set('Content-Length', String(fileStat.size));
    headers.set('Content-Disposition', disposition);
    
    // Anti-Execution & Anti-Sniffing Security Headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Content-Security-Policy', "sandbox; default-src 'none'; style-src 'unsafe-inline'");
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Cache-Control', 'private, max-age=3600, no-transform');

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Requested file is not available.' }, { status: 404 });
  }
}
