import { NextRequest, NextResponse } from 'next/server';
import {
  fetchPassword,
  fetchFiles,
  logAccess,
} from '@/lib/google-script-client';
import {
  isBlocked,
  recordFailedAttempt,
  resetAttempts,
  getBlockTimeRemaining,
} from '@/lib/rate-limiter';

interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Extracts client IP address from request headers
 * Handles Vercel's proxy headers for accurate IP detection
 */
function getClientIp(request: NextRequest): string {
  // Vercel forwards the real IP in x-forwarded-for
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback to x-real-ip
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Default fallback
  return 'unknown';
}

/**
 * Basic email format validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting
    const clientIp = getClientIp(request);

    // Check if IP is rate limited
    if (isBlocked(clientIp)) {
      const minutesRemaining = getBlockTimeRemaining(clientIp);
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed attempts. Please try again in ${minutesRemaining} minutes.`,
          blocked: true,
          minutesRemaining,
        },
        { status: 429 }
      );
    }

    // Fetch password from Google Sheet
    const passwordResponse = await fetchPassword();

    if (!passwordResponse.success || !passwordResponse.password) {
      console.error('Failed to fetch password:', passwordResponse.error);
      return NextResponse.json(
        { success: false, error: 'Unable to verify credentials. Please contact support.' },
        { status: 500 }
      );
    }

    // Validate password
    if (password !== passwordResponse.password) {
      // Record failed attempt
      recordFailedAttempt(clientIp);

      // Check if now blocked after this attempt
      if (isBlocked(clientIp)) {
        const minutesRemaining = getBlockTimeRemaining(clientIp);
        return NextResponse.json(
          {
            success: false,
            error: `Too many failed attempts. Please try again in ${minutesRemaining} minutes.`,
            blocked: true,
            minutesRemaining,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    // Password is correct - reset rate limiter
    resetAttempts(clientIp);

    // Log successful access (non-blocking - don't fail login if logging fails)
    try {
      await logAccess(email, 'Login');
    } catch (logError) {
      console.error('Failed to log access:', logError);
      // Continue anyway - logging is non-blocking
    }

    // Fetch files from Google Drive
    const filesResponse = await fetchFiles();

    if (!filesResponse.success) {
      console.error('Failed to fetch files:', filesResponse.error);
      // Return success but with empty files - user is authenticated
      return NextResponse.json({
        success: true,
        files: [],
        error: 'Unable to load content. Files may be temporarily unavailable.',
      });
    }

    return NextResponse.json({
      success: true,
      files: filesResponse.files || [],
      count: filesResponse.count || 0,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
