/**
 * Client for calling the Google Apps Script middleware
 */

import type {
  ListFilesResponse,
  GetPasswordResponse,
  GetAccessCountResponse,
  LogAccessResponse,
  HealthResponse,
} from './types';
import { logError } from './errors';

const SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

if (!SCRIPT_URL) {
  console.warn('GOOGLE_APPS_SCRIPT_URL environment variable is not set');
}

/**
 * Makes a request to the Google Apps Script
 */
async function callScript<T>(
  action: string,
  params: Record<string, string> = {}
): Promise<T> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL is not configured');
  }

  try {
    const url = new URL(SCRIPT_URL);
    url.searchParams.set('action', action);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      logError(`callScript:${action}`, `HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    logError(`callScript:${action}`, error);
    throw error;
  }
}

/**
 * Makes a POST request to the Google Apps Script
 */
async function postToScript<T>(
  action: string,
  body: Record<string, string>
): Promise<T> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL is not configured');
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ action, ...body }),
    });

    if (!response.ok) {
      logError(`postToScript:${action}`, `HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    logError(`postToScript:${action}`, error);
    throw error;
  }
}

/**
 * Fetches all files from the configured Drive folder
 */
export async function fetchFiles(): Promise<ListFilesResponse> {
  try {
    return await callScript<ListFilesResponse>('listFiles');
  } catch (error) {
    logError('fetchFiles', error);
    return {
      success: false,
      error: 'Failed to load files from Google Drive',
    };
  }
}

/**
 * Fetches the password from the Config sheet
 */
export async function fetchPassword(): Promise<GetPasswordResponse> {
  try {
    return await callScript<GetPasswordResponse>('getPassword');
  } catch (error) {
    logError('fetchPassword', error);
    return {
      success: false,
      error: 'Failed to verify credentials',
    };
  }
}

/**
 * Gets the access count for a specific email
 */
export async function getAccessCount(email: string): Promise<GetAccessCountResponse> {
  try {
    return await callScript<GetAccessCountResponse>('getAccessCount', { email });
  } catch (error) {
    logError('getAccessCount', error);
    return {
      success: false,
      error: 'Failed to get access count',
    };
  }
}

/**
 * Logs an access event (uses POST for reliability)
 * Returns success even on failure to make logging non-blocking
 */
export async function logAccess(
  email: string,
  fileName: string
): Promise<LogAccessResponse> {
  try {
    return await postToScript<LogAccessResponse>('logAccess', { email, fileName });
  } catch (error) {
    logError('logAccess', error);
    // Return success: false but don't throw - logging is non-blocking
    return {
      success: false,
      error: 'Failed to log access',
    };
  }
}

/**
 * Checks if the Apps Script is healthy
 */
export async function checkHealth(): Promise<HealthResponse> {
  return callScript<HealthResponse>('health');
}

/**
 * Validates credentials against the stored password
 * This is a convenience function that fetches the password and compares
 */
export async function validatePassword(inputPassword: string): Promise<boolean> {
  const response = await fetchPassword();

  if (!response.success || !response.password) {
    throw new Error(response.error || 'Failed to fetch password');
  }

  return inputPassword === response.password;
}
