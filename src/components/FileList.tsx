'use client';

import type { VaultFile } from '@/lib/types';
import FileItem from './FileItem';

interface FileListProps {
  files: VaultFile[];
  email: string;
  onSelectFile: (file: VaultFile) => void;
}

export default function FileList({ files, email, onSelectFile }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No content available at this time.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
        <FileItem
          key={file.id}
          file={file}
          email={email}
          onSelect={onSelectFile}
        />
      ))}
    </div>
  );
}
