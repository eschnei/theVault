'use client';

import { useState } from 'react';
import type { VaultFile } from '@/lib/types';
import FileList from './FileList';
import FileViewer from './FileViewer';

interface ContentDisplayProps {
  files: VaultFile[];
  userEmail: string;
  calComLink?: string;
  error?: string;
}

export default function ContentDisplay({
  files,
  userEmail,
  calComLink,
  error,
}: ContentDisplayProps) {
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);

  const handleSelectFile = (file: VaultFile) => {
    setSelectedFile(file);
  };

  const handleCloseViewer = () => {
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-300 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">The Vault</h1>
              <p className="text-xs text-gray-500 mt-1">
                Logged in as {userEmail}
              </p>
            </div>

            {calComLink && (
              <a
                href={calComLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
              >
                Book a Meeting
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-gray-100 border border-gray-300">
            <p className="text-sm text-gray-700">{error}</p>
            <p className="text-xs text-gray-500 mt-2">
              If this problem persists, please contact support.
            </p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-600">
            Available Materials ({files.length})
          </h2>
        </div>

        <FileList
          files={files}
          email={userEmail}
          onSelectFile={handleSelectFile}
        />
      </main>

      {/* File Viewer Modal */}
      {selectedFile && (
        <FileViewer file={selectedFile} onClose={handleCloseViewer} />
      )}
    </div>
  );
}
