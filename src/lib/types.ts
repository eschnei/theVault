/**
 * Types for Google Apps Script API responses
 */

export type FileType = 'doc' | 'sheet' | 'slides' | 'pdf' | 'text' | 'video' | 'youtube' | 'file';

export interface VaultFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink: string;
  createdDate: string;
  modifiedDate: string;
  fileType: FileType;
  youtubeUrl?: string;
}

export interface ListFilesResponse {
  success: boolean;
  files?: VaultFile[];
  count?: number;
  error?: string;
}

export interface GetPasswordResponse {
  success: boolean;
  password?: string;
  error?: string;
}

export interface GetAccessCountResponse {
  success: boolean;
  count?: number;
  error?: string;
}

export interface LogAccessResponse {
  success: boolean;
  message?: string;
  accessCount?: number;
  timestamp?: string;
  error?: string;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  validActions?: string[];
}
