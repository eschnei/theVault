/**
 * Error handling utilities and user-friendly error messages
 */

// User-friendly error messages
export const ERROR_MESSAGES = {
  INVALID_PASSWORD: 'Incorrect password. Please try again.',
  RATE_LIMITED: 'Too many failed attempts. Please try again in {minutes} minutes.',
  GOOGLE_API_ERROR: 'Unable to load content. Please contact support.',
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  EMPTY_FOLDER: 'No content available at this time.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  CONFIG_ERROR: 'Service not configured. Please contact support.',
} as const;

/**
 * Maps technical errors to user-friendly messages
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('failed to fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // Configuration errors
    if (message.includes('environment variable') || message.includes('not set') || message.includes('not configured')) {
      return ERROR_MESSAGES.CONFIG_ERROR;
    }

    // Google API errors
    if (message.includes('script') || message.includes('google') || message.includes('api')) {
      return ERROR_MESSAGES.GOOGLE_API_ERROR;
    }
  }

  return ERROR_MESSAGES.GENERIC_ERROR;
}

/**
 * Logs error to console with context for debugging
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error instanceof Error ? error.message : error);
  if (error instanceof Error && error.stack) {
    console.error(`[${context}] Stack:`, error.stack);
  }
}

/**
 * Formats rate limit error message with minutes remaining
 */
export function formatRateLimitError(minutesRemaining: number): string {
  return ERROR_MESSAGES.RATE_LIMITED.replace('{minutes}', String(minutesRemaining));
}
