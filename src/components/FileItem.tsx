'use client';

import type { VaultFile, FileType } from '@/lib/types';

interface FileItemProps {
  file: VaultFile;
  email: string;
  onSelect: (file: VaultFile) => void;
}

const FILE_TYPE_ICONS: Record<FileType, string> = {
  doc: '[DOC]',
  sheet: '[SHEET]',
  slides: '[SLIDES]',
  pdf: '[PDF]',
  text: '[TXT]',
  video: '[VIDEO]',
  youtube: '[YT]',
  file: '[FILE]',
};

const FILE_TYPE_LABELS: Record<FileType, string> = {
  doc: 'Google Doc',
  sheet: 'Google Sheet',
  slides: 'Google Slides',
  pdf: 'PDF Document',
  text: 'Text File',
  video: 'Video',
  youtube: 'YouTube Video',
  file: 'File',
};

/**
 * Logs file access asynchronously (non-blocking)
 */
async function logFileAccess(email: string, fileName: string): Promise<void> {
  try {
    const response = await fetch('/api/log-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, fileName }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Failed to log file access:', data.error);
    }
  } catch (error) {
    console.error('Error logging file access:', error);
  }
}

export default function FileItem({ file, email, onSelect }: FileItemProps) {
  const icon = FILE_TYPE_ICONS[file.fileType] || FILE_TYPE_ICONS.file;
  const label = FILE_TYPE_LABELS[file.fileType] || FILE_TYPE_LABELS.file;

  const handleClick = () => {
    // Log access asynchronously (non-blocking)
    logFileAccess(email, file.name);

    // Open file immediately
    onSelect(file);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full p-4 border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors text-left"
    >
      <div className="flex items-start gap-3">
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate" title={file.name}>
            {file.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
      </div>
    </button>
  );
}
