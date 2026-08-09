import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitConfig, AuthRateLimitConfig, RateLimitTierConfig } from '@/config/rateLimitConfig';

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds: number;
  tier: 'auth' | 'public' | 'authenticated';
  isBackoffCooldown?: boolean;
  backoffDelayMs?: number;
  failedAttempts?: number;
  reason?: string;
}

interface IpRecord {
  timestamps: number[];
}

interface AccountAuthRecord {
  failedAttempts: number;
  lastFailureTime: number;
  cooldownUntilTime: number;
  timestamps: number[];
}

// In-memory sliding window registries
const ipRegistry = new Map<string, IpRecord>();
const accountRegistry = new Map<string, AccountAuthRecord>();
const publicRegistry = new Map<string, IpRecord>();
const authUserRegistry = new Map<string, IpRecord>();

// Auto-prune stale records every 2 minutes to ensure constant memory footprint
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const config = getRateLimitConfig();

    // Prune IP registry
    for (const [key, record] of ipRegistry.entries()) {
      record.timestamps = record.timestamps.filter(t => now - t < config.auth.windowMs);
      if (record.timestamps.length === 0) {
        ipRegistry.delete(key);
      }
    }

    // Prune Account registry
    for (const [key, record] of accountRegistry.entries()) {
      record.timestamps = record.timestamps.filter(t => now - t < config.auth.windowMs);
      const isCooldownOver = now > record.cooldownUntilTime;
      const isExpired = now - record.lastFailureTime > config.auth.windowMs;
      if (record.timestamps.length === 0 && isCooldownOver && isExpired) {
        accountRegistry.delete(key);
      }
    }

    // Prune Public registry
    for (const [key, record] of publicRegistry.entries()) {
      record.timestamps = record.timestamps.filter(t => now - t < config.public.windowMs);
      if (record.timestamps.length === 0) {
        publicRegistry.delete(key);
      }
    }

    // Prune Auth User registry
    for (const [key, record] of authUserRegistry.entries()) {
      record.timestamps = record.timestamps.filter(t => now - t < config.authenticated.windowMs);
      if (record.timestamps.length === 0) {
        authUserRegistry.delete(key);
      }
    }
  }, 2 * 60 * 1000);
}

/**
 * Extracts client IP from request headers
 */
export function extractClientIp(req: Request | NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(s => s.trim());
    if (ips[0]) return ips[0];
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();
  return '127.0.0.1';
}

/**
 * Calculates exponential backoff cooldown in milliseconds based on failed attempts:
 * Delay = min(baseMs * multiplier^(failedCount - 1), maxMs)
 */
export function calculateExponentialBackoff(failedAttempts: number, config: AuthRateLimitConfig): number {
  if (failedAttempts <= 1) return 0;
  const power = Math.max(0, failedAttempts - 1);
  const delay = Math.round(config.backoffBaseMs * Math.pow(config.backoffMultiplier, power));
  return Math.min(delay, config.backoffMaxMs);
}

/**
 * 1. Stricter Rate Limiting for Authentication Endpoints
 * Checks both Per-IP limit and Per-Account exponential backoff.
 */
export function checkAuthRateLimit(
  ip: string,
  accountIdentifier?: string
): RateLimitCheckResult {
  const config = getRateLimitConfig().auth;
  const now = Date.now();

  // --- Step A: Check Per-Account Exponential Backoff ---
  let accountRecord: AccountAuthRecord | undefined;
  if (accountIdentifier) {
    const cleanAccount = accountIdentifier.toLowerCase().trim();
    accountRecord = accountRegistry.get(cleanAccount);

    if (accountRecord && now < accountRecord.cooldownUntilTime) {
      const remainingCooldownMs = accountRecord.cooldownUntilTime - now;
      const retryAfterSec = Math.max(1, Math.ceil(remainingCooldownMs / 1000));
      return {
        allowed: false,
        limit: config.maxFailedAttemptsPerAccount,
        remaining: 0,
        resetTimeMs: accountRecord.cooldownUntilTime,
        retryAfterSeconds: retryAfterSec,
        tier: 'auth',
        isBackoffCooldown: true,
        backoffDelayMs: remainingCooldownMs,
        failedAttempts: accountRecord.failedAttempts,
        reason: `Account is in exponential cooldown due to ${accountRecord.failedAttempts} failed attempts. Please wait ${retryAfterSec}s before retrying.`,
      };
    }
  }

  // --- Step B: Check Per-IP Rate Limit ---
  let ipRecord = ipRegistry.get(ip);
  if (!ipRecord) {
    ipRecord = { timestamps: [] };
    ipRegistry.set(ip, ipRecord);
  }

  // Sliding window filter
  ipRecord.timestamps = ipRecord.timestamps.filter(t => now - t < config.windowMs);

  if (ipRecord.timestamps.length >= config.maxRequestsPerIp) {
    const oldest = ipRecord.timestamps[0] || now;
    const resetTime = oldest + config.windowMs;
    const retryAfter = Math.max(1, Math.ceil((resetTime - now) / 1000));
    return {
      allowed: false,
      limit: config.maxRequestsPerIp,
      remaining: 0,
      resetTimeMs: resetTime,
      retryAfterSeconds: retryAfter,
      tier: 'auth',
      isBackoffCooldown: false,
      reason: `Too many authentication attempts from this IP address. Maximum ${config.maxRequestsPerIp} requests per 15 minutes.`,
    };
  }

  // Record this attempt for the IP
  ipRecord.timestamps.push(now);

  const remaining = Math.max(0, config.maxRequestsPerIp - ipRecord.timestamps.length);
  const resetTimeMs = now + config.windowMs;

  return {
    allowed: true,
    limit: config.maxRequestsPerIp,
    remaining,
    resetTimeMs,
    retryAfterSeconds: 0,
    tier: 'auth',
    failedAttempts: accountRecord?.failedAttempts || 0,
  };
}

/**
 * Records an authentication failure, escalating the exponential backoff penalty
 */
export function recordAuthFailure(
  ip: string,
  accountIdentifier?: string
): { failedAttempts: number; backoffDelayMs: number; cooldownUntil: number } {
  const config = getRateLimitConfig().auth;
  const now = Date.now();

  if (!accountIdentifier) {
    return { failedAttempts: 1, backoffDelayMs: 0, cooldownUntil: now };
  }

  const cleanAccount = accountIdentifier.toLowerCase().trim();
  let record = accountRegistry.get(cleanAccount);

  if (!record || now - record.lastFailureTime > config.windowMs) {
    record = {
      failedAttempts: 1,
      lastFailureTime: now,
      cooldownUntilTime: now,
      timestamps: [now],
    };
  } else {
    record.failedAttempts += 1;
    record.lastFailureTime = now;
    record.timestamps.push(now);
  }

  // Calculate exponential backoff cooldown
  const backoffMs = calculateExponentialBackoff(record.failedAttempts, config);
  record.cooldownUntilTime = now + backoffMs;
  accountRegistry.set(cleanAccount, record);

  return {
    failedAttempts: record.failedAttempts,
    backoffDelayMs: backoffMs,
    cooldownUntil: record.cooldownUntilTime,
  };
}

/**
 * Records an authentication success, resetting failed attempts and backoff
 */
export function recordAuthSuccess(ip: string, accountIdentifier?: string): void {
  if (accountIdentifier) {
    const cleanAccount = accountIdentifier.toLowerCase().trim();
    accountRegistry.delete(cleanAccount);
  }
}

/**
 * 2. Moderate Rate Limiting for Public Endpoints (e.g. leads, chat, payments, forms)
 */
export function checkPublicRateLimit(
  ip: string,
  endpointKey: string = 'global_public'
): RateLimitCheckResult {
  const config = getRateLimitConfig().public;
  const now = Date.now();
  const key = `${ip}:${endpointKey}`;

  let record = publicRegistry.get(key);
  if (!record) {
    record = { timestamps: [] };
    publicRegistry.set(key, record);
  }

  // Sliding window filter
  record.timestamps = record.timestamps.filter(t => now - t < config.windowMs);

  if (record.timestamps.length >= config.maxRequests) {
    const oldest = record.timestamps[0] || now;
    const resetTime = oldest + config.windowMs;
    const retryAfter = Math.max(1, Math.ceil((resetTime - now) / 1000));
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTimeMs: resetTime,
      retryAfterSeconds: retryAfter,
      tier: 'public',
      reason: `Public endpoint rate limit reached (${config.maxRequests} requests / min). Please retry in ${retryAfter}s.`,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, config.maxRequests - record.timestamps.length);

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining,
    resetTimeMs: now + config.windowMs,
    retryAfterSeconds: 0,
    tier: 'public',
  };
}

/**
 * 3. Looser Rate Limiting for Authenticated User Actions (e.g. classroom, notes, uploads, tests)
 */
export function checkAuthenticatedUserRateLimit(
  userIdOrSession: string,
  ip: string,
  actionKey: string = 'authenticated_action'
): RateLimitCheckResult {
  const config = getRateLimitConfig().authenticated;
  const now = Date.now();
  const key = `${userIdOrSession || ip}:${actionKey}`;

  let record = authUserRegistry.get(key);
  if (!record) {
    record = { timestamps: [] };
    authUserRegistry.set(key, record);
  }

  record.timestamps = record.timestamps.filter(t => now - t < config.windowMs);

  if (record.timestamps.length >= config.maxRequests) {
    const oldest = record.timestamps[0] || now;
    const resetTime = oldest + config.windowMs;
    const retryAfter = Math.max(1, Math.ceil((resetTime - now) / 1000));
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTimeMs: resetTime,
      retryAfterSeconds: retryAfter,
      tier: 'authenticated',
      reason: `Authenticated user rate limit exceeded (${config.maxRequests} actions / min). Please slow down.`,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, config.maxRequests - record.timestamps.length);

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining,
    resetTimeMs: now + config.windowMs,
    retryAfterSeconds: 0,
    tier: 'authenticated',
  };
}

/**
 * Standard HTTP Rate Limit Response Generator (HTTP 429 Too Many Requests)
 */
export function createRateLimitResponse(result: RateLimitCheckResult): NextResponse {
  const headers = new Headers();
  headers.set('Retry-After', String(result.retryAfterSeconds));
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTimeMs / 1000)));
  headers.set('X-RateLimit-Tier', result.tier);
  
  if (result.backoffDelayMs !== undefined) {
    headers.set('X-RateLimit-Backoff-Delay', String(result.backoffDelayMs));
  }

  return NextResponse.json(
    {
      success: false,
      error: result.reason || 'Too Many Requests',
      rateLimit: {
        tier: result.tier,
        limit: result.limit,
        remaining: result.remaining,
        retryAfterSeconds: result.retryAfterSeconds,
        resetTime: new Date(result.resetTimeMs).toISOString(),
        isBackoffCooldown: !!result.isBackoffCooldown,
        backoffDelayMs: result.backoffDelayMs || 0,
        failedAttempts: result.failedAttempts || 0,
      },
    },
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Helper to attach rate limit tracking headers to successful responses
 */
export function attachRateLimitHeaders(response: NextResponse, result: RateLimitCheckResult): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTimeMs / 1000)));
  response.headers.set('X-RateLimit-Tier', result.tier);
  return response;
}
