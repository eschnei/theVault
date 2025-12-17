import { NextRequest, NextResponse } from 'next/server';
import { logAccess } from '@/lib/google-script-client';

interface LogAccessRequest {
  email: string;
  fileName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LogAccessRequest = await request.json();
    const { email, fileName } = body;

    // Validate required fields
    if (!email || !fileName) {
      return NextResponse.json(
        { success: false, error: 'Email and fileName are required.' },
        { status: 400 }
      );
    }

    // Log access to Google Sheet
    const result = await logAccess(email, fileName);

    if (!result.success) {
      console.error('Failed to log access:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to log access.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      accessCount: result.accessCount,
      timestamp: result.timestamp,
    });

  } catch (error) {
    console.error('Log access error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
