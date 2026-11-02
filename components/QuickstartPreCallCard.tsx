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
  const handleStart = onStartConversation ?? onStart;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-6">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0a00] via-[#120800] to-[#0a0a0a] border border-[#2a1500] p-10 shadow-2xl shadow-orange-900/20">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#f97316]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#dc2626]/10 blur-3xl" />

          {/* Logo */}
          <div className="relative flex justify-center mb-8">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#dc2626] shadow-xl shadow-orange-500/30">
              <span className="text-4xl">🌶️</span>
            </div>
          </div>

          {/* Heading */}
          <div className="relative text-center mb-8">
            <h1 className="text-white text-2xl font-bold tracking-tight">Spice Garden</h1>
            <p className="text-[#f97316] text-sm font-medium mt-1">AI Reservation Assistant</p>
            <p className="text-[#6b7280] text-sm mt-4 leading-relaxed">
              Talk to Priya, our AI receptionist. Book, modify, or cancel your table in seconds — in English, Hindi, or Telugu.
            </p>
          </div>

          {/* Feature chips */}
          <div className="relative flex flex-wrap gap-2 justify-center mb-8">
            {['🗓 Table Booking', '🌐 EN · HI · TE', '⚡ Instant Confirmation'].map((f) => (
              <span key={f} className="px-3 py-1.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded-full text-[#9ca3af] text-xs font-medium">
                {f}
              </span>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="relative mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* CTA Button */}
          <button
            id="start-conversation-button"
            onClick={handleStart}
            disabled={isLoading}
            className="relative w-full py-3.5 rounded-xl bg-gradient-to-r from-[#f97316] to-[#dc2626] text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Connecting to Priya…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>📞</span> Start Conversation
              </span>
            )}
          </button>

          {/* Staff Dashboard Button */}
          <div className="relative mt-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 text-xs font-medium text-[#d1d5db] hover:text-white transition-colors py-2.5 px-3 rounded-xl border border-[#2a2a2a] bg-[#171717] hover:bg-[#222222] w-full"
            >
              <span>📊</span> Open Staff Dashboard
            </Link>
          </div>

          {/* Footer note */}
          <p className="relative text-center text-[#4b5563] text-xs mt-5">
            Powered by Agora ConvAI · Sarvam AI · Gemini
          </p>
        </div>
      </div>
    </div>
  );
}

export default QuickstartPreCallCard;
