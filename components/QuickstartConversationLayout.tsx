'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Utensils, LayoutDashboard, PhoneOff, Mic, Globe } from 'lucide-react';

type QuickstartConversationLayoutProps = {
  statusPanel: ReactNode;
  pipelineMetrics: ReactNode;
  transcriptPanel: ReactNode;
  visualizer: ReactNode;
  controls: ReactNode;
  onEndConversation: () => void;
};

export function QuickstartConversationLayout({
  statusPanel,
  pipelineMetrics,
  transcriptPanel,
  visualizer,
  controls,
  onEndConversation,
}: QuickstartConversationLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F8F9FA] text-[#202124]">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#E5E7EB] bg-white px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#B45309]">
            <Utensils className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold tracking-tight text-[#202124] sm:text-base">
                Spice Garden
              </span>
              <span className="hidden rounded-md bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280] sm:inline-block border border-[#E5E7EB]">
                Priya · AI Receptionist
              </span>
            </div>
            <div className="mt-0.5 hidden sm:block">{pipelineMetrics}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {statusPanel}

          <Link
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Staff Dashboard in new tab"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#202124] transition-colors hover:border-[#B45309] hover:text-[#B45309]"
          >
            <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <button
            onClick={onEndConversation}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#DC2626] bg-white px-3 text-xs font-semibold text-[#DC2626] transition-colors hover:bg-[#DC2626] hover:text-white"
            aria-label="End conversation with Priya"
            title="End conversation"
          >
            <PhoneOff className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 p-4 sm:p-6 lg:flex-row">
        {/* Left: transcript */}
        <aside className="order-2 flex h-72 min-h-0 w-full shrink-0 flex-col lg:order-1 lg:h-auto lg:w-[26rem] xl:w-[28rem]">
          {transcriptPanel}
        </aside>

        {/* Right: voice interaction */}
        <main className="order-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white lg:order-2">
          {/* Status row */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#16A34A]" aria-hidden="true" />
              <p className="text-xs font-medium text-[#202124]">
                Priya is listening · Table booking line
              </p>
            </div>
            <div
              className="flex items-center gap-1.5"
              aria-label="Supported languages"
            >
              <Globe className="h-3.5 w-3.5 text-[#6B7280]" strokeWidth={1.75} aria-hidden="true" />
              {['EN', 'हिंदी', 'తెలుగు'].map((lang) => (
                <span
                  key={lang}
                  className="rounded-md border border-[#E5E7EB] bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-medium text-[#6B7280]"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Voice stage */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4 py-6 sm:gap-8">
            {visualizer}
            <div className="max-w-xs text-center">
              <p className="text-sm font-semibold text-[#202124]">Speak to Priya</p>
              <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
                Ask for a table, check availability, or manage an existing booking.
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex shrink-0 flex-col items-center gap-3 border-t border-[#E5E7EB] px-4 py-4 sm:py-5">
            <div className="flex items-center gap-3 rounded-full border border-[#E5E7EB] bg-[#F8F9FA] px-4 py-2">
              {controls}
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
              <Mic className="h-3 w-3 text-[#B45309]" strokeWidth={2} aria-hidden="true" />
              Microphone active · Speak naturally in English, Hindi, or Telugu
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
