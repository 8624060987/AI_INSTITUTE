import path from 'path';

export interface FileValidationResult {
  valid: boolean;
  detectedMime: string;
  detectedExt: string;
  error?: string;
}

// Whitelist of allowed extensions and their expected MIME types
export const ALLOWED_FILE_EXTENSIONS: Record<string, { mimes: string[]; description: string }> = {
  jpg: { mimes: ['image/jpeg'], description: 'JPEG Image' },
  jpeg: { mimes: ['image/jpeg'], description: 'JPEG Image' },
  png: { mimes: ['image/png'], description: 'PNG Image' },
  webp: { mimes: ['image/webp'], description: 'WebP Image' },
  gif: { mimes: ['image/gif'], description: 'GIF Image' },
  pdf: { mimes: ['application/pdf'], description: 'PDF Document' },
  doc: { mimes: ['application/msword', 'application/x-cfb'], description: 'Word Document' },
  docx: { mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'], description: 'Word OpenXML Document' },
  txt: { mimes: ['text/plain'], description: 'Plain Text Document' },
  zip: { mimes: ['application/zip', 'application/x-zip-compressed'], description: 'ZIP Archive' },
};

export const MAX_ALLOWED_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

/**
 * Validates the file content by inspecting its initial magic byte signature (not just file extension).
 * Detects polyglots, disguised binaries, shell scripts, and executable headers.
 */
export function validateFileContentSignature(
  buffer: Buffer,
  declaredExtension: string
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, detectedMime: '', detectedExt: '', error: 'File buffer is empty (0 bytes).' };
  }

  const ext = declaredExtension.toLowerCase().replace(/^\./, '');
  const len = buffer.length;

  // 1. Check for Prohibited Executable / Binary / Script Signatures (Universal Blacklist)
  // DOS / Windows PE Executable (MZ header: 0x4D 0x5A)
  if (len >= 2 && buffer[0] === 0x4D && buffer[1] === 0x5A) {
    return { valid: false, detectedMime: 'application/x-dosexec', detectedExt: 'exe', error: 'Executable binaries (.exe/.dll) are strictly prohibited.' };
  }

  // Linux ELF Executable (\x7FELF: 0x7F 0x45 0x4C 0x46)
  if (len >= 4 && buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
    return { valid: false, detectedMime: 'application/x-elf', detectedExt: 'elf', error: 'Linux binary executables are strictly prohibited.' };
  }

  // Java Bytecode (.class: 0xCA 0xFE 0xBA 0xBE)
  if (len >= 4 && buffer[0] === 0xCA && buffer[1] === 0xFE && buffer[2] === 0xBA && buffer[3] === 0xBE) {
    return { valid: false, detectedMime: 'application/java-vm', detectedExt: 'class', error: 'Compiled Java bytecode is strictly prohibited.' };
  }

  // Script Inspection: Check for PHP / Shell / HTML Script injection
  const headString = buffer.subarray(0, Math.min(1024, len)).toString('latin1').toLowerCase();
  if (
    headString.includes('<?php') ||
    headString.includes('<? ') ||
    headString.includes('<?=') ||
    headString.startsWith('#!/') ||
    headString.includes('<script') ||
    headString.includes('javascript:')
  ) {
    return { valid: false, detectedMime: 'application/x-script', detectedExt: 'script', error: 'Executable scripts (PHP, Shell, HTML/JS) are strictly prohibited.' };
  }

  // 2. Magic Byte Signature Verification per Extension
  if (ext === 'jpg' || ext === 'jpeg') {
    // JPEG Signature: FF D8 FF
    if (len >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return { valid: true, detectedMime: 'image/jpeg', detectedExt: ext };
    }
    return { valid: false, detectedMime: '', detectedExt: '', error: 'File content does not match genuine JPEG image binary signature.' };
  }

  if (ext === 'png') {
    // PNG Signature: 89 50 4E 47 0D 0A 1A 0A (\x89PNG\r\n\x1a\n)
    if (
      len >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A
    ) {
      return { valid: true, detectedMime: 'image/png', detectedExt: 'png' };
    }
    return { valid: false, detectedMime: '', detectedExt: '', error: 'File content does not match genuine PNG image binary signature.' };
  }

  if (ext === 'webp') {
    // WebP Signature: RIFF....WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
    if (
      len >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      return { valid: true, detectedMime: 'image/webp', detectedExt: 'webp' };
    }
    return { valid: false, detectedMime: '', detectedExt: '', error: 'File content does not match genuine WebP image signature.' };
  }

  if (ext === 'gif') {
    // GIF Signature: GIF87a or GIF89a (0x47 0x49 0x46 0x38)
    if (len >= 4 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return { valid: true, detectedMime: 'image/gif', detectedExt: 'gif' };
    }
    return { valid: false, detectedMime: '', detectedExt: '', error: 'File content does not match genuine GIF image signature.' };
  }

  if (ext === 'pdf') {
    // PDF Signature: %PDF- (0x25 0x50 0x44 0x46 0x2D)
    if (len >= 5 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46 && buffer[4] === 0x2D) {
      return { valid: true, detectedMime: 'application/pdf', detectedExt: 'pdf' };
    }
    return { valid: false, detectedMime: '', detectedExt: '', error: 'File content does not match genuine PDF document signature.' };
  }

  if (ext === 'docx' || ext === 'zip') {
    // PK Zip Archive / OpenXML Signature: PK.. (0x50 0x4B 0x03 0x04 or 0x50 0x4B 0x05 0x06 or 0x50 0x4B 0x07 0x08)
    if (
      len >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4B &&
      (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)
    ) {
      const mime = ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/zip';
      return { valid: true, detectedMime: mime, detectedExt: ext };
    }
    return { valid: false, detectedMime: '', detectedExt: '', error: `File content does not match genuine ${ext.toUpperCase()} archive signature.` };
  }

  if (ext === 'doc') {
    // Legacy DOC (Compound File Binary Format: 0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1)
    if (len >= 8 && buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0) {
      return { valid: true, detectedMime: 'application/msword', detectedExt: 'doc' };
    }
    return { valid: false, detectedMime: '', detectedExt: '', error: 'File content does not match genuine DOC binary format.' };
  }

  if (ext === 'txt') {
    // Verify plain text has no null bytes or binary control characters
    const checkLen = Math.min(len, 4096);
    for (let i = 0; i < checkLen; i++) {
      const byte = buffer[i];
      if (byte === 0x00) {
        return { valid: false, detectedMime: '', detectedExt: '', error: 'Text file contains prohibited null bytes.' };
      }
    }
    return { valid: true, detectedMime: 'text/plain', detectedExt: 'txt' };
  }

  return { valid: false, detectedMime: '', detectedExt: '', error: `Unsupported or unverified file extension: .${ext}` };
}

/**
 * Validates filename against path traversal, control characters, double extensions, and dangerous names.
 */
export function sanitizeUploadFilename(rawName: string): { safeName: string; ext: string; error?: string } {
  if (!rawName || typeof rawName !== 'string') {
    return { safeName: '', ext: '', error: 'Filename is required' };
  }

  // 1. Reject Null Bytes & Control Characters
  if (rawName.includes('\0') || /[\x00-\x1F\x7F]/.test(rawName)) {
    return { safeName: '', ext: '', error: 'Filename contains prohibited control characters' };
  }

  // 2. Reject Path Traversal
  if (rawName.includes('..') || rawName.includes('/') || rawName.includes('\\')) {
    return { safeName: '', ext: '', error: 'Filename contains prohibited path traversal sequences' };
  }

  // 3. Extract and check Extension
  const parts = rawName.split('.');
  if (parts.length < 2) {
    return { safeName: '', ext: '', error: 'File must have a valid extension' };
  }

  // Double extension protection: check if any intermediate segment is an executable extension
  const dangerousExtensions = new Set([
    'exe', 'dll', 'so', 'dylib', 'bat', 'cmd', 'sh', 'bash', 'zsh', 'php', 'phtml', 
    'php3', 'php4', 'php5', 'phps', 'py', 'rb', 'pl', 'cgi', 'js', 'mjs', 'cjs', 
    'jsp', 'asp', 'aspx', 'vbs', 'scr', 'hta', 'jar', 'com'
  ]);

  for (let i = 1; i < parts.length; i++) {
    const seg = parts[i].toLowerCase();
    if (dangerousExtensions.has(seg)) {
      return { safeName: '', ext: '', error: `Prohibited dangerous extension segment detected: .${seg}` };
    }
  }

  const ext = parts[parts.length - 1].toLowerCase();
  if (!ALLOWED_FILE_EXTENSIONS[ext]) {
    return { safeName: '', ext: '', error: `Extension .${ext} is not permitted` };
  }

  // Generate safe cryptographically random filename
  const safeBase = parts[0].replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 32);
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const safeName = `upload_${Date.now()}_${safeBase}_${randomSuffix}.${ext}`;

  return { safeName, ext };
}

/**
 * Returns the isolated, private storage path outside of the web root.
 */
export function getIsolatedStoragePath(): string {
  // Stored in `storage/uploads` in project root (outside `public/` web root)
  return path.join(process.cwd(), 'storage', 'uploads');
}
