'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

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
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-[#0d0907] via-[#080706] to-[#040404] text-white">
      {/* Subtle luxury ambient glows */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-orange-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-80 w-80 rounded-full bg-amber-500/10 blur-[100px]" />

      {/* Header */}
      <header className="relative z-20 flex shrink-0 flex-col gap-3 border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl md:h-[76px] md:flex-row md:items-center md:justify-between md:px-8 md:py-0">
        {/* Brand identity */}
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 shadow-lg shadow-orange-600/30 ring-1 ring-white/20">
            <span className="text-xl">🌶️</span>
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="truncate text-base font-bold tracking-tight text-white md:text-lg">
                Spice Garden
              </span>
              <span className="hidden rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-400 uppercase sm:inline-block">
                AI Host · Priya
              </span>
            </div>
            <div className="mt-0.5">{pipelineMetrics}</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          {statusPanel}

          <Link
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-200 transition-all hover:border-amber-500/40 hover:bg-white/10 hover:text-white"
            title="Open Staff Dashboard in new tab"
          >
            <span>📊</span>
            <span>Dashboard</span>
            <span className="ml-1 rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-400">
              LIVE
            </span>
          </Link>

          <button
            onClick={onEndConversation}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 active:scale-95 shadow-sm shadow-red-950/40"
            aria-label="End conversation with Priya"
            title="End conversation"
          >
            <span>✕</span>
            <span>End Call</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col gap-4 p-4 md:p-6 lg:flex-row lg:gap-6">
        {/* Left: Transcript Rail */}
        <aside className="order-2 h-72 min-h-0 w-full shrink-0 lg:order-1 lg:h-full lg:w-[28rem]">
          {transcriptPanel}
        </aside>

        {/* Right: AI Visualizer Core & Controls */}
        <main className="order-1 flex min-h-0 flex-1 flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-[#141210]/60 to-[#0a0a0c]/80 p-6 backdrop-blur-md lg:order-2">
          {/* Top assistant banner */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-medium text-zinc-300">
                Priya is listening · Table booking active
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                English
              </span>
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                हिंदी
              </span>
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                తెలుగు
              </span>
            </div>
          </div>

          {/* Center Visualizer */}
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center">
              {/* Outer glowing aura rings */}
              <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-gradient-to-tr from-orange-500/10 via-amber-500/10 to-red-500/10 blur-2xl" />
              <div className="pointer-events-none absolute h-60 w-60 rounded-full border border-amber-500/10" />
              {visualizer}
            </div>
          </div>

          {/* Bottom Dock Controls */}
          <div className="flex shrink-0 flex-col items-center gap-3 pt-2">
            <div className="w-full max-w-md">{controls}</div>
            <p className="text-[11px] text-zinc-500">
              Microphone active · Speak naturally to Priya or ask for today&apos;s special table
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
