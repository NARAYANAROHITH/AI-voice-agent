'use client';

import { Loader2, PhoneCall, Building2, Languages, Utensils, Mic, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface QuickstartPreCallCardProps {
  isLoading: boolean;
  error: string | null;
  onStartConversation?: () => void;
  onStart?: () => void;
}

const LANGUAGES = ['English', 'Hindi', 'Telugu'] as const;

const SAMPLE_REQUESTS = [
  'I need a table for 4 tonight at 8 PM',
  'Aaj raat 8:30 baje 2 logon ke liye table mil sakta hai?',
  'Repu 7:30 PM ki 3 members ki table book cheyyi',
  'Check my reservation for phone 9014286696',
];

export function QuickstartPreCallCard({
  isLoading,
  error,
  onStartConversation,
  onStart,
}: QuickstartPreCallCardProps) {
  const handleStart = onStartConversation ?? onStart;

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      {/* Top navigation */}
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#B45309]">
              <Utensils className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold tracking-tight text-[#202124]">Spice Garden</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#6B7280]">
                Fine Indian Dining
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3.5 text-sm font-medium text-[#202124] transition-colors hover:border-[#B45309] hover:text-[#B45309]"
          >
            <Building2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Staff Dashboard
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:gap-16">
        {/* Left: copy + actions */}
        <div className="flex w-full max-w-xl flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B45309]">
            <Mic className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            AI Voice Receptionist
          </span>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-[#202124] sm:text-5xl">
              Reserve your table
              <br />
              with <span className="text-[#B45309]">Priya</span>.
            </h1>
            <p className="max-w-md text-base leading-relaxed text-[#6B7280] sm:text-lg">
              Priya is Spice Garden&apos;s AI voice receptionist. Call in, speak naturally in English,
              Hindi, or Telugu, and your reservation is confirmed in under a minute.
            </p>
          </div>

          {/* Language support */}
          <div
            className="flex flex-wrap items-center gap-2"
            aria-label="Supported languages"
          >
            <Languages className="h-4 w-4 text-[#6B7280]" strokeWidth={1.75} aria-hidden="true" />
            <span className="text-sm text-[#6B7280]">Speaks</span>
            {LANGUAGES.map((lang) => (
              <span
                key={lang}
                className="rounded-md border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-medium text-[#202124]"
              >
                {lang}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex w-full flex-col gap-3 pt-1 sm:flex-row">
            <button
              id="start-conversation-button"
              onClick={handleStart}
              disabled={isLoading}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#B45309] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#9A4508] focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={isLoading ? 'Connecting to Priya' : 'Start voice call with Priya'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Connecting to Priya…
                </>
              ) : (
                <>
                  <PhoneCall className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  Start Voice Call
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </>
              )}
            </button>
            <Link
              href="/dashboard"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-5 text-sm font-semibold text-[#202124] transition-colors hover:border-[#B45309] hover:text-[#B45309]"
            >
              <Building2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              Staff Dashboard
            </Link>
          </div>

          {error && (
            <div
              role="alert"
              className="flex w-full items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-[#DC2626]"
            >
              <span className="font-medium">Connection issue:</span> {error}
            </div>
          )}

          <p className="text-xs text-[#6B7280]">
            Priya answers 24/7. No forms, no app download — just talk.
          </p>
        </div>

        {/* Right: sample voice requests */}
        <div className="w-full max-w-md shrink-0">
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div>
                <p className="text-sm font-semibold text-[#202124]">Try saying…</p>
                <p className="mt-0.5 text-xs text-[#6B7280]">
                  Sample requests Priya understands
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-white">
                <Mic className="h-4 w-4 text-[#B45309]" strokeWidth={1.75} aria-hidden="true" />
              </div>
            </div>
            <ul className="space-y-2.5">
              {SAMPLE_REQUESTS.map((request) => (
                <li
                  key={request}
                  className="rounded-md border border-[#E5E7EB] bg-white px-3.5 py-3 text-sm leading-snug text-[#202124]"
                >
                  <span className="mr-2 font-semibold text-[#B45309]">“</span>
                  {request}
                  <span className="ml-2 font-semibold text-[#B45309]">”</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-[#E5E7EB] pt-4">
              <ul className="space-y-1.5 text-[11px] text-[#6B7280]">
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                  Live availability check before every booking
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                  Modify or cancel by phone number anytime
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                  Real-time confirmation in the staff dashboard
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default QuickstartPreCallCard;
