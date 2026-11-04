'use client';

import { useEffect, useMemo, useRef } from 'react';
import { AudioLines, MessageSquareText, Lightbulb } from 'lucide-react';

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
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white"
      aria-label="Live Voice Transcript"
    >
      {/* Panel header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E7EB] px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E5E7EB] bg-[#F8F9FA]">
            <AudioLines className="h-4 w-4 text-[#B45309]" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-[#202124]">
                Live Transcript
              </h2>
              <span className="flex items-center gap-1.5 rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-medium text-[#16A34A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                Live
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#6B7280]">Priya · Sarvam Voice AI</p>
          </div>
        </div>
        <span className="rounded-md border border-[#E5E7EB] bg-[#F8F9FA] px-2 py-1 font-mono text-[11px] text-[#6B7280]">
          {messages.length} turn{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-[#F8F9FA] p-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white">
              <MessageSquareText className="h-6 w-6 text-[#B45309]" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#202124]">
                Waiting for the conversation to begin
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#6B7280]">
                Priya will greet you shortly. Speak in English, Hindi, or Telugu to book or modify a table.
              </p>
            </div>
            <div className="w-full max-w-xs rounded-md border border-[#E5E7EB] bg-white p-3 text-left">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                Try saying
              </p>
              <p className="text-xs leading-snug text-[#202124]">
                &ldquo;Table for 4 tonight at 8 PM&rdquo;
              </p>
              <p className="mt-1 text-xs leading-snug text-[#202124]">
                &ldquo;Aaj raat do logon ke liye table book kar do&rdquo;
              </p>
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
                className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
              >
                {/* Meta header */}
                <div
                  className={`mb-1 flex items-baseline gap-1.5 px-0.5 text-[11px] ${
                    isAgent ? 'text-[#B45309]' : 'text-[#6B7280]'
                  }`}
                >
                  <span className="font-semibold text-[#202124]">
                    {isAgent ? 'Priya' : 'You'}
                  </span>
                  {isAgent && (
                    <span className="font-medium text-[#B45309]">· AI Host</span>
                  )}
                  {time && <span className="text-[10px] text-[#6B7280]">{time}</span>}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[92%] whitespace-pre-wrap rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed ${
                    isAgent
                      ? 'border-[#E5E7EB] bg-white text-[#202124]'
                      : 'border-[#B45309] bg-[#B45309] text-white'
                  } ${
                    isLatest && currentInProgressMessage
                      ? 'border-l-2 border-l-[#B45309]'
                      : ''
                  }`}
                >
                  {text || (
                    <span className="inline-flex items-center gap-1.5 text-xs italic text-[#6B7280]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#B45309]" />
                      Listening…
                    </span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="shrink-0 border-t border-[#E5E7EB] bg-white px-4 py-2.5">
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#6B7280]">
          <Lightbulb className="h-3.5 w-3.5 text-[#B45309]" strokeWidth={1.75} aria-hidden="true" />
          State your name and phone number clearly for faster confirmation.
        </p>
      </div>
    </section>
  );
}
