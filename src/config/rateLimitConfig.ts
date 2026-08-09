/**
 * Configurable Rate Limiting Configuration Registry
 * 
 * All thresholds are fully configurable via environment variables or runtime overrides.
 * No limits are hardcoded.
 */

export interface RateLimitTierConfig {
  maxRequests: number;
  windowMs: number;
}

export interface AuthRateLimitConfig {
  /** Maximum requests allowed from a single IP within the window */
  maxRequestsPerIp: number;
  /** Maximum failed login attempts allowed for an account before backoff escalates */
  maxFailedAttemptsPerAccount: number;
  /** Rolling window for IP and account tracking (in milliseconds) */
  windowMs: number;
  /** Initial cooldown penalty for the first backoff level (in milliseconds) */
  backoffBaseMs: number;
  /** Multiplier for exponential backoff (e.g. 2 means 2s, 4s, 8s, 16s, 32s...) */
  backoffMultiplier: number;
  /** Maximum backoff ceiling cap (in milliseconds, default 5 mins) */
  backoffMaxMs: number;
}

export interface RateLimitConfigRegistry {
  /** Stricter limits for authentication endpoints (login, signup, password reset, otp) */
  auth: AuthRateLimitConfig;
  /** Moderate limits for public endpoints (lead capture, chatbot, payments, forms) */
  public: RateLimitTierConfig;
  /** Looser limits for authenticated user actions (classroom, notes, assignments, tests) */
  authenticated: RateLimitTierConfig;
}

/**
 * Parses numeric environment variable with a safe fallback
 */
function parseEnvInt(key: string, fallback: number): number {
  if (typeof process === 'undefined' || !process.env) return fallback;
  const val = process.env[key];
  if (!val) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

function parseEnvFloat(key: string, fallback: number): number {
  if (typeof process === 'undefined' || !process.env) return fallback;
  const val = process.env[key];
  if (!val) return fallback;
  const parsed = parseFloat(val);
  return isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

/**
 * Default Configurable Thresholds
 */
const DEFAULT_CONFIG: RateLimitConfigRegistry = {
  auth: {
    maxRequestsPerIp: parseEnvInt('RATE_LIMIT_AUTH_IP_MAX', 10), // 10 auth requests per 15 min per IP
    maxFailedAttemptsPerAccount: parseEnvInt('RATE_LIMIT_AUTH_ACCOUNT_MAX', 5), // 5 failed attempts per account
    windowMs: parseEnvInt('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
    backoffBaseMs: parseEnvInt('RATE_LIMIT_AUTH_BACKOFF_BASE_MS', 2000), // 2 seconds base
    backoffMultiplier: parseEnvFloat('RATE_LIMIT_AUTH_BACKOFF_MULTIPLIER', 2.0), // 2x exponential scale
    backoffMaxMs: parseEnvInt('RATE_LIMIT_AUTH_BACKOFF_MAX_MS', 5 * 60 * 1000), // 5 minutes max cooldown
  },
  public: {
    maxRequests: parseEnvInt('RATE_LIMIT_PUBLIC_MAX', 30), // 30 requests per minute
    windowMs: parseEnvInt('RATE_LIMIT_PUBLIC_WINDOW_MS', 60 * 1000), // 1 minute
  },
  authenticated: {
    maxRequests: parseEnvInt('RATE_LIMIT_AUTH_USER_MAX', 120), // 120 requests per minute (looser limit)
    windowMs: parseEnvInt('RATE_LIMIT_AUTH_USER_WINDOW_MS', 60 * 1000), // 1 minute
  },
};

// Mutable runtime state allowing dynamic configuration changes without restarts
let currentConfig: RateLimitConfigRegistry = {
  auth: { ...DEFAULT_CONFIG.auth },
  public: { ...DEFAULT_CONFIG.public },
  authenticated: { ...DEFAULT_CONFIG.authenticated },
};

/**
 * Retrieves the active rate limit configuration
 */
export function getRateLimitConfig(): RateLimitConfigRegistry {
  return currentConfig;
}

/**
 * Dynamically updates rate limit thresholds at runtime
 */
export function updateRateLimitConfig(partial: Partial<RateLimitConfigRegistry>): RateLimitConfigRegistry {
  currentConfig = {
    auth: { ...currentConfig.auth, ...(partial.auth || {}) },
    public: { ...currentConfig.public, ...(partial.public || {}) },
    authenticated: { ...currentConfig.authenticated, ...(partial.authenticated || {}) },
  };
  return currentConfig;
}

/**
 * Resets configuration to environment defaults
 */
export function resetRateLimitConfig(): RateLimitConfigRegistry {
  currentConfig = {
    auth: { ...DEFAULT_CONFIG.auth },
    public: { ...DEFAULT_CONFIG.public },
    authenticated: { ...DEFAULT_CONFIG.authenticated },
  };
  return currentConfig;
}
