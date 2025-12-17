'use client';

import { useState } from 'react';
import type { VaultFile } from '@/lib/types';

interface FileViewerProps {
  file: VaultFile;
  onClose: () => void;
}

/**
 * Extracts YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Generates the appropriate embed URL for a file
 */
function getEmbedUrl(file: VaultFile): string | null {
  switch (file.fileType) {
    case 'youtube':
      if (file.youtubeUrl) {
        const videoId = extractYouTubeId(file.youtubeUrl);
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      return null;

    case 'doc':
      // Google Docs embed URL
      return `https://docs.google.com/document/d/${file.id}/preview`;

    case 'sheet':
      // Google Sheets embed URL
      return `https://docs.google.com/spreadsheets/d/${file.id}/preview`;

    case 'slides':
      // Google Slides embed URL
      return `https://docs.google.com/presentation/d/${file.id}/preview`;

    case 'pdf':
      // Google Drive PDF viewer
      return `https://drive.google.com/file/d/${file.id}/preview`;

    case 'video':
      // Google Drive video viewer
      return `https://drive.google.com/file/d/${file.id}/preview`;

    default:
      // For other files, open in new tab
      return null;
  }
}

export default function FileViewer({ file, onClose }: FileViewerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const embedUrl = getEmbedUrl(file);

  // If no embed URL, open in new tab and close viewer
  if (!embedUrl) {
    window.open(file.webViewLink, '_blank', 'noopener,noreferrer');
    onClose();
    return null;
  }

  const handleIframeError = () => {
    setHasError(true);
    setIsLoading(false);
    console.error(`Failed to load embedded content for: ${file.name}`);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleOpenInNewTab = () => {
    window.open(file.webViewLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          <h2 className="text-sm font-medium truncate pr-4" title={file.name}>
            {file.name}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="text-xs text-gray-600 hover:text-black px-3 py-1 border border-gray-300 hover:border-black"
            >
              Open in new tab
            </button>
            <button
              onClick={onClose}
              className="text-xs px-3 py-1 bg-black text-white hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-100 relative">
          {/* Loading State */}
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <p className="text-sm text-gray-500">Loading content...</p>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4">
              <p className="text-sm text-gray-700 mb-4">
                Unable to display this content in the viewer.
              </p>
              <button
                onClick={handleOpenInNewTab}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
              >
                Open in new tab
              </button>
            </div>
          )}

          {/* Embed */}
          {!hasError && (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={file.name}
              onError={handleIframeError}
              onLoad={handleIframeLoad}
            />
          )}
        </div>
      </div>
    </div>
  );
}
