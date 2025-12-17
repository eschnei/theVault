'use client';

import { useState } from 'react';
import type { VaultFile } from '@/lib/types';
import LoginForm from '@/components/LoginForm';
import ContentDisplay from '@/components/ContentDisplay';

// Cal.com link from environment variable (set at build time for client)
const CAL_COM_LINK = process.env.NEXT_PUBLIC_CAL_COM_LINK;

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [contentError, setContentError] = useState<string | undefined>();

  const handleLoginSuccess = (email: string, fileList: VaultFile[], error?: string) => {
    setUserEmail(email);
    setFiles(fileList);
    setContentError(error);
    setIsAuthenticated(true);
  };

  if (isAuthenticated) {
    return (
      <ContentDisplay
        files={files}
        userEmail={userEmail}
        calComLink={CAL_COM_LINK}
        error={contentError}
      />
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">The Vault</h1>
          <p className="text-gray-600 text-sm">Enter your credentials to access investor materials</p>
        </div>
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </main>
  );
}
