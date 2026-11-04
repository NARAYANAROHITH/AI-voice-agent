'use client';

import { useEffect, useMemo, useRef } from 'react';

type TranscriptMessage = {
  turn_id?: string | number;
  uid: number;
  text?: string;
  createdAt?: number;
};

type QuickstartTranscriptPanelProps = {
  messageList: TranscriptMessage[];
  currentInProgressMessage: TranscriptMessage | null;
  agentUID: string;
};

function formatMessageTime(createdAt?: number) {
  if (!createdAt) return null;
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(createdAt));
}

export function QuickstartTranscriptPanel({
  messageList,
  currentInProgressMessage,
  agentUID,
}: QuickstartTranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = useMemo(
    () =>
      currentInProgressMessage
        ? [...messageList, currentInProgressMessage]
        : messageList,
    [currentInProgressMessage, messageList],
  );

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <section
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#141416]/90 to-[#0c0c0e]/95 backdrop-blur-xl shadow-2xl shadow-black/60"
      aria-label="Live Voice Transcript"
    >
      {/* Panel Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 border border-amber-500/30 text-amber-400">
            🎙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight">Live Transcript</h2>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Audio
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Priya · Sarvam Voice AI</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
            {messages.length} turn{messages.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Messages Stream */}
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 flex items-center justify-center text-2xl shadow-inner shadow-orange-500/10">
              💬
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">Waiting for conversation to begin…</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                Priya will greet you shortly. Speak naturally in English, Hindi, or Telugu to book or modify a table.
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left w-full max-w-xs space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">Try saying:</p>
              <p className="text-xs text-zinc-300 italic">&ldquo;Table for 4 tonight at 8 PM&rdquo;</p>
              <p className="text-xs text-zinc-300 italic">&ldquo;Aaj raat do logon ke liye table book kardo&rdquo;</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isAgent = String(message.uid) === agentUID;
            const text = message.text?.trim();
            const time = formatMessageTime(message.createdAt);
            const isLatest = index === messages.length - 1;

            return (
              <article
                key={`${message.turn_id ?? message.uid}-${index}`}
                className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} transition-all`}
              >
                {/* Meta Header */}
                <div className={`mb-1.5 flex items-center gap-1.5 px-1 text-[11px] ${isAgent ? 'text-amber-400' : 'text-sky-400'}`}>
                  {isAgent ? (
                    <>
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px]">
                        🌶️
                      </span>
                      <span className="font-semibold text-zinc-200">Priya</span>
                      <span className="text-[10px] text-amber-400/80 font-normal">AI Host</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-zinc-200">You</span>
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/20 text-[10px]">
                        👤
                      </span>
                    </>
                  )}
                  {time && <span className="text-[10px] text-zinc-400 ml-1">· {time}</span>}
                </div>

                {/* Bubble Body */}
                <div
                  className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-lg ${
                    isAgent
                      ? 'border border-amber-500/20 bg-gradient-to-br from-[#1c140e] via-[#161210] to-[#111] text-zinc-100 shadow-orange-950/20'
                      : 'border border-sky-500/20 bg-gradient-to-br from-[#111a26] via-[#0d1520] to-[#0a1017] text-white shadow-sky-950/20'
                  } ${isLatest && currentInProgressMessage ? 'ring-1 ring-amber-400/40' : ''}`}
                >
                  {text || (
                    <span className="inline-flex items-center gap-1 text-zinc-400 italic">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                      Listening…
                    </span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Quick Suggestions Footer */}
      <div className="border-t border-white/5 bg-black/40 px-4 py-2.5 text-center">
        <p className="text-[11px] text-zinc-400 flex items-center justify-center gap-2">
          <span>💡</span> State your name and phone number clearly to guarantee instant table confirmation.
        </p>
      </div>
    </section>
  );
}
