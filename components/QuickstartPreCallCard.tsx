'use client';
import Link from 'next/link';

interface QuickstartPreCallCardProps {
  isLoading: boolean;
  error: string | null;
  onStartConversation?: () => void;
  onStart?: () => void;
}

export function QuickstartPreCallCard({
  isLoading,
  error,
  onStartConversation,
  onStart,
}: QuickstartPreCallCardProps) {
<<<<<<< HEAD
  return (
    <div
      className="mx-auto flex w-[min(92vw,26.25rem)] animate-fade-up flex-col items-center rounded-[20px] border border-[#2b2b2b] px-10 py-10 text-center shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
      style={{
        backgroundImage:
          'linear-gradient(164.988deg, rgba(54,54,54,0.2) 1.0596%, rgba(0,0,0,0) 96.089%), linear-gradient(90deg, rgb(16,16,16) 0%, rgb(16,16,16) 100%)',
      }}
    >
      <h1 className="text-[28px] font-medium leading-[1.2] text-white">
        Spice Garden Reservations
      </h1>
      <p className="mt-[14px] text-sm font-medium leading-6 text-muted-foreground">
        Call the reservation desk. Priya can check availability and book
        your table in under a minute.
      </p>
=======
  const handleStart = onStartConversation ?? onStart;
>>>>>>> 8605dbb2588cdb6f891ca0070e8fdf9bbd4bc0ef

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#0c0907] via-[#080706] to-[#040404] p-4 sm:p-6 lg:p-8">
      {/* Background ambient glow effects */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-amber-500/15 via-orange-600/10 to-transparent blur-[120px]" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-72 w-72 rounded-full bg-red-600/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#16120f]/90 via-[#100d0b]/95 to-[#0a0807]/95 p-6 sm:p-10 shadow-2xl shadow-black/80 backdrop-blur-2xl">
          {/* Top Brand Banner */}
          <div className="flex flex-col items-center text-center">
            {/* Royal Crest / Logo */}
            <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 shadow-xl shadow-orange-600/30 ring-1 ring-white/20">
              <span className="text-4xl filter drop-shadow">🌶️</span>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-black text-[10px] text-white">
                ✓
              </span>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              PRIYA · AI VOICE CONCIERGE IS ONLINE
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Spice Garden
            </h1>
            <p className="mt-1 text-sm font-medium tracking-wide uppercase text-amber-500/90">
              Fine Indian Dining &amp; Royal Cuisine
            </p>

            <p className="mt-3.5 max-w-md text-sm leading-relaxed text-zinc-300">
              Speak naturally with <span className="font-semibold text-amber-400">Priya</span> to reserve your table, check live availability, or manage existing bookings in seconds.
            </p>
          </div>

          {/* Supported Languages & Feature Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {[
              { label: 'English · हिंदी · తెలుగు', icon: '🌐' },
              { label: 'Instant Table Allotment', icon: '⚡' },
              { label: 'Dietary & Seating Requests', icon: '🍷' },
            ].map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300"
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </span>
            ))}
          </div>

          {/* Quick Voice Suggestions Box */}
          <div className="mt-6 rounded-2xl border border-white/5 bg-black/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 mb-2">
              Sample voice requests you can speak:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
              <div className="rounded-lg bg-white/[0.03] p-2 border border-white/5">
                💬 &ldquo;I&apos;d like a table for 4 tonight at 8 PM.&rdquo;
              </div>
              <div className="rounded-lg bg-white/[0.03] p-2 border border-white/5">
                💬 &ldquo;Aaj raat 8:30 baje table milega do logon ke liye?&rdquo;
              </div>
              <div className="rounded-lg bg-white/[0.03] p-2 border border-white/5">
                💬 &ldquo;Repu 7:30 PM ki 3 members ki table book cheyyi.&rdquo;
              </div>
              <div className="rounded-lg bg-white/[0.03] p-2 border border-white/5">
                💬 &ldquo;Check my reservation for phone 9014286696.&rdquo;
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
              <span className="font-semibold text-red-400">Connection notice: </span>
              {error}
            </div>
          )}

          {/* Primary Call Action */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              id="start-conversation-button"
              onClick={handleStart}
              disabled={isLoading}
              className="relative flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 py-4 text-sm font-bold text-white shadow-xl shadow-orange-600/25 transition-all hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Connecting to Priya…</span>
                </>
              ) : (
                <>
                  <span className="text-lg">📞</span>
                  <span>Speak with Priya (Start Voice Call)</span>
                </>
              )}
            </button>

            {/* Dashboard Quick Navigation Button */}
            <Link
              href="/dashboard"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-zinc-300 transition-all hover:border-amber-500/40 hover:bg-white/10 hover:text-white"
            >
              <span>📊</span>
              <span>Open Staff Dashboard (Live Bookings &amp; Tables)</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                LIVE SYNC
              </span>
            </Link>
          </div>

          {/* Footer note */}
          <p className="mt-5 text-center text-[11px] text-zinc-500">
            Agora Conversational AI · Sarvam Voice Engine · Google Gemini
          </p>
        </div>
      </div>
    </div>
  );
}

export default QuickstartPreCallCard;
