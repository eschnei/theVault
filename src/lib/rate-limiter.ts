/**
 * In-memory rate limiting for failed login attempts
 *
 * Blocks IP addresses after 3 consecutive failed login attempts for 15 minutes.
 * State resets on deployment (acceptable for low-traffic use case).
 */

const MAX_FAILED_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  blockedAt: number | null;
}

// In-memory storage for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Cleans up expired entries from the store
 * Called periodically to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();

  for (const [ip, entry] of rateLimitStore.entries()) {
    // Remove if blocked and block has expired
    if (entry.blockedAt && now - entry.blockedAt >= BLOCK_DURATION_MS) {
      rateLimitStore.delete(ip);
      continue;
    }

    // Remove if not blocked and first attempt was over 15 minutes ago
    if (!entry.blockedAt && now - entry.firstAttemptAt >= BLOCK_DURATION_MS) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Records a failed login attempt for an IP address
 * @param ip - The IP address to record the attempt for
 * @returns The current number of failed attempts
 */
export function recordFailedAttempt(ip: string): number {
  cleanupExpiredEntries();

  const now = Date.now();
  const existing = rateLimitStore.get(ip);

  if (!existing) {
    // First failed attempt
    rateLimitStore.set(ip, {
      attempts: 1,
      firstAttemptAt: now,
      blockedAt: null,
    });
    return 1;
  }

  // If already blocked, don't increment
  if (existing.blockedAt) {
    return existing.attempts;
  }

  // Increment attempts
  existing.attempts += 1;

  // Block if reached max attempts
  if (existing.attempts >= MAX_FAILED_ATTEMPTS) {
    existing.blockedAt = now;
  }

  rateLimitStore.set(ip, existing);
  return existing.attempts;
}

/**
 * Checks if an IP address is currently blocked
 * @param ip - The IP address to check
 * @returns true if the IP is blocked, false otherwise
 */
export function isBlocked(ip: string): boolean {
  cleanupExpiredEntries();

  const entry = rateLimitStore.get(ip);

  if (!entry || !entry.blockedAt) {
    return false;
  }

  const now = Date.now();
  const blockExpired = now - entry.blockedAt >= BLOCK_DURATION_MS;

  if (blockExpired) {
    // Block has expired, remove entry
    rateLimitStore.delete(ip);
    return false;
  }

  return true;
}

/**
 * Resets the failed attempt counter for an IP address
 * Call this on successful login
 * @param ip - The IP address to reset
 */
export function resetAttempts(ip: string): void {
  rateLimitStore.delete(ip);
}

/**
 * Gets the remaining block time for an IP address in minutes
 * @param ip - The IP address to check
 * @returns Minutes remaining until unblock, or 0 if not blocked
 */
export function getBlockTimeRemaining(ip: string): number {
  const entry = rateLimitStore.get(ip);

  if (!entry || !entry.blockedAt) {
    return 0;
  }

  const now = Date.now();
  const elapsed = now - entry.blockedAt;
  const remaining = BLOCK_DURATION_MS - elapsed;

  if (remaining <= 0) {
    // Block has expired
    rateLimitStore.delete(ip);
    return 0;
  }

  // Return remaining time in minutes (rounded up)
  return Math.ceil(remaining / (60 * 1000));
}

/**
 * Gets the current number of failed attempts for an IP address
 * @param ip - The IP address to check
 * @returns Number of failed attempts, or 0 if none
 */
export function getFailedAttempts(ip: string): number {
  const entry = rateLimitStore.get(ip);
  return entry?.attempts ?? 0;
}

/**
 * Gets the maximum allowed failed attempts before blocking
 */
export function getMaxAttempts(): number {
  return MAX_FAILED_ATTEMPTS;
}

/**
 * Gets the block duration in minutes
 */
export function getBlockDurationMinutes(): number {
  return BLOCK_DURATION_MS / (60 * 1000);
}
