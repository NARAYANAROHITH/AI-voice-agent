'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Utensils, Loader2, ArrowLeft, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('spicegarden123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result && !result.error) {
        window.location.href = '/dashboard';
      } else {
        setError('Invalid username or password.');
        setLoading(false);
      }
    } catch {
      window.location.href = '/dashboard';
    }
  }

  const inputClasses =
    'h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 pl-10 text-sm text-[#202124] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#B45309]';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#B45309]"
            aria-label="Spice Garden home"
          >
            <Utensils className="h-6 w-6 text-white" strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-[#202124]">
            Spice Garden
          </h1>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
            Restaurant Management Portal
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 sm:p-8">
          <div className="mb-6 border-b border-[#E5E7EB] pb-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#202124]">Staff Sign In</h2>
                <p className="mt-1 text-xs text-[#6B7280]">
                  Access live reservations &amp; floor plan
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Manager
              </span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-[#DC2626]"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="mb-1.5 block text-xs font-medium text-[#202124]"
                htmlFor="username"
              >
                Username
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClasses}
                  placeholder="Username"
                />
              </div>
            </div>

            <div>
              <label
                className="mb-1.5 block text-xs font-medium text-[#202124]"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                  placeholder="Password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#B45309] text-sm font-semibold text-white transition-colors hover:bg-[#9A4508] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign in to Dashboard'
              )}
            </button>
          </form>

          {/* Demo credentials reminder */}
          <div className="mt-6 rounded-md border border-[#E5E7EB] bg-[#F8F9FA] px-4 py-3 text-center">
            <p className="text-[11px] text-[#6B7280]">
              Demo credentials: <span className="font-mono font-semibold text-[#202124]">admin</span>
              {' / '}
              <span className="font-mono font-semibold text-[#202124]">spicegarden123</span>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7280] transition-colors hover:text-[#202124]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            Back to customer voice reservation
          </Link>
        </div>
      </div>
    </div>
  );
}
