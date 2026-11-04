'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Loader2,
  PhoneCall,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';

interface CallLog {
  id: string;
  channelName: string;
  callerPhone: string | null;
  language: string | null;
  durationSec: number | null;
  status: string;
  startedAt: string;
  endedAt: string | null;
  customer: { name: string; phone: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  FAILED: 'border-red-200 bg-red-50 text-red-700',
  ABANDONED: 'border-amber-200 bg-amber-50 text-amber-800',
};

const DOT_STYLES: Record<string, string> = {
  IN_PROGRESS: 'bg-[#2563EB]',
  COMPLETED: 'bg-[#16A34A]',
  FAILED: 'bg-[#DC2626]',
  ABANDONED: 'bg-[#D97706]',
};

function StatusDot({ status }: { status: string }) {
  const cls = DOT_STYLES[status] ?? 'bg-[#6B7280]';
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${cls} ${
        status === 'IN_PROGRESS' ? 'animate-pulse' : ''
      }`}
      aria-hidden="true"
    />
  );
}

function LangChip({ lang }: { lang: string | null }) {
  if (!lang) return <span className="text-[#6B7280]">—</span>;
  const map: Record<string, string> = {
    en: 'border-blue-200 bg-blue-50 text-blue-700',
    hi: 'border-orange-200 bg-orange-50 text-orange-700',
    te: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
        map[lang] ?? 'border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280]'
      }`}
    >
      {lang.toUpperCase()}
    </span>
  );
}

function fmtDuration(sec: number | null) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch('/api/calls?limit=30').then((r) => r.json());
      setCalls(data.calls ?? []);
      setTotal(data.total ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8F9FA] text-[#202124] lg:flex-row">
      <DashboardSidebar />

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Header */}
        <header className="sticky top-14 z-20 border-b border-[#E5E7EB] bg-white px-4 py-4 sm:px-6 lg:top-0 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-[#202124] sm:text-xl">
                Voice Calls
              </h1>
              <p className="mt-1 text-xs text-[#6B7280]">{total} calls logged</p>
            </div>
            <button
              onClick={fetchCalls}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#202124] transition-colors hover:bg-[#F8F9FA]"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </header>

        {/* Table */}
        <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-4 py-3 sm:px-5">
              <PhoneCall className="h-4 w-4 text-[#B45309]" strokeWidth={1.75} aria-hidden="true" />
              <h2 className="text-sm font-semibold text-[#202124]">Recent Calls</h2>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <Loader2
                  className="h-6 w-6 animate-spin text-[#B45309]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <p className="text-xs text-[#6B7280]">Loading calls…</p>
              </div>
            ) : calls.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                <PhoneCall className="h-8 w-8 text-[#B45309]" strokeWidth={1.25} aria-hidden="true" />
                <p className="text-sm font-semibold text-[#202124]">No calls yet</p>
                <p className="max-w-xs text-xs leading-relaxed text-[#6B7280]">
                  Start a conversation on the customer line — call logs will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA]">
                      {['Status', 'Customer', 'Phone', 'Language', 'Duration', 'Started'].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="whitespace-nowrap px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {calls.map((c) => (
                      <tr key={c.id} className="transition-colors hover:bg-[#F8F9FA]">
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="inline-flex items-center gap-2">
                            <StatusDot status={c.status} />
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                STATUS_STYLES[c.status] ??
                                'border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280]'
                              }`}
                            >
                              {c.status.replace('_', ' ')}
                            </span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-medium text-[#202124]">
                          {c.customer?.name ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-[#6B7280]">
                          {c.callerPhone ?? c.customer?.phone ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <LangChip lang={c.language} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-[#6B7280]">
                          {fmtDuration(c.durationSec)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-[#6B7280]">
                          {new Date(c.startedAt).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour12: false,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
