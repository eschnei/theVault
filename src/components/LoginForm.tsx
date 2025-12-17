'use client';

import { useState, FormEvent } from 'react';
import type { VaultFile } from '@/lib/types';

interface LoginFormProps {
  onSuccess: (email: string, files: VaultFile[], error?: string) => void;
}

interface LoginResponse {
  success: boolean;
  files?: VaultFile[];
  error?: string;
  blocked?: boolean;
  minutesRemaining?: number;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (data.success) {
        // Pass any content loading errors to the parent
        onSuccess(email, data.files || [], data.error);
      } else if (data.blocked) {
        setError(`Too many failed attempts. Please try again in ${data.minutesRemaining} minutes.`);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch {
      setError('Unable to connect. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          placeholder="investor@example.com"
          className="w-full px-3 py-2 border border-gray-300 bg-white text-black focus:outline-none focus:border-black disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          placeholder="Enter password"
          className="w-full px-3 py-2 border border-gray-300 bg-white text-black focus:outline-none focus:border-black disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {error && (
        <div className="p-3 text-sm bg-gray-100 border border-gray-300 text-gray-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-black text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Authenticating...' : 'Access Content'}
      </button>
    </form>
  );
}
