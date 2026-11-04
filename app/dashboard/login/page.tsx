'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

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

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0c0907] via-[#080706] to-[#040404] flex items-center justify-center p-4">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-orange-600/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Crest */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-18 h-18 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 mb-4 shadow-xl shadow-orange-600/30 ring-1 ring-white/20 p-4">
            <span className="text-3xl">🌶️</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Spice Garden</h1>
          <p className="text-amber-500/90 text-xs font-semibold uppercase tracking-wider mt-1">
            Restaurant Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#141210]/95 to-[#0a0807]/95 p-8 shadow-2xl shadow-black/80 backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-white font-bold text-lg">Staff Sign In</h2>
              <p className="text-zinc-400 text-xs mt-0.5">Access live reservations &amp; floor plan</p>
            </div>
            <span className="text-xs bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
              Manager
            </span>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-all shadow-lg shadow-orange-600/20"
            >
              {loading ? 'Signing in…' : 'Sign in to Dashboard'}
            </button>
          </form>

          {/* Quick Demo Credentials Reminder */}
          <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
            <p className="text-[11px] text-zinc-400">
              Demo Credentials: <span className="font-mono text-amber-400">admin</span> / <span className="font-mono text-amber-400">spicegarden123</span>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-zinc-500 hover:text-amber-400 transition-colors">
            ← Back to Customer Voice Reservation
          </Link>
        </div>
      </div>
    </div>
  );
}
