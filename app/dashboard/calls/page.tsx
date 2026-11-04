'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

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

function Sidebar({ pathname }: { pathname: string }) {
  const nav = [
    { href: '/dashboard', label: 'Reservations', icon: '📋' },
    { href: '/dashboard/tables', label: 'Tables', icon: '🪑' },
    { href: '/dashboard/calls', label: 'Call History', icon: '📞' },
  ];
  return (
    <aside className="w-60 shrink-0 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col">
      <div className="px-6 py-6 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f97316] to-[#dc2626] flex items-center justify-center shadow-md shadow-orange-500/20">
            <span className="text-base">🌶️</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Spice Garden</p>
            <p className="text-[#6b7280] text-xs mt-0.5">Management</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-[#f97316]/10 text-[#f97316] font-medium' : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1a1a]'}`}>
              <span className="text-base">{item.icon}</span>{item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-[#1a1a1a]">
        <button onClick={() => signOut({ callbackUrl: '/dashboard/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#6b7280] hover:text-white hover:bg-[#1a1a1a] transition-colors">
          <span>🚪</span> Sign out
        </button>
      </div>
    </aside>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    IN_PROGRESS: 'bg-blue-400 animate-pulse',
    COMPLETED: 'bg-emerald-400',
    FAILED: 'bg-red-400',
    ABANDONED: 'bg-amber-400',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status] ?? 'bg-[#6b7280]'}`} />;
}

function LangChip({ lang }: { lang: string | null }) {
  if (!lang) return <span className="text-[#6b7280]">—</span>;
  const map: Record<string, string> = {
    en: 'bg-blue-500/20 text-blue-400',
    hi: 'bg-orange-500/20 text-orange-400',
    te: 'bg-green-500/20 text-green-400',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${map[lang] ?? 'bg-[#2a2a2a] text-[#9ca3af]'}`}>
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
  const pathname = usePathname();
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

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <Sidebar pathname={pathname ?? ''} />
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur border-b border-[#1a1a1a] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-semibold text-lg">Call History</h1>
            <p className="text-[#6b7280] text-xs mt-0.5">{total} calls total</p>
          </div>
          <button onClick={fetchCalls}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-[#9ca3af] hover:text-white transition-colors">
            ↻ Refresh
          </button>
        </div>

        <div className="px-8 py-6">
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1f1f1f]">
              <h2 className="text-white font-medium text-sm">Recent Calls</h2>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center text-[#6b7280] text-sm">Loading…</div>
            ) : calls.length === 0 ? (
              <div className="px-6 py-12 text-center text-[#6b7280] text-sm">
                No calls yet. Start a conversation to see call logs here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1f1f1f]">
                      {['Status', 'Customer', 'Phone', 'Language', 'Duration', 'Started'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {calls.map((c) => (
                      <tr key={c.id} className="hover:bg-[#1a1a1a]/40 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <StatusDot status={c.status} />
                            <span className="text-[#9ca3af] text-xs">{c.status.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-white">{c.customer?.name ?? '—'}</td>
                        <td className="px-6 py-3.5 text-[#9ca3af] font-mono text-xs">{c.callerPhone ?? c.customer?.phone ?? '—'}</td>
                        <td className="px-6 py-3.5"><LangChip lang={c.language} /></td>
                        <td className="px-6 py-3.5 text-[#9ca3af] font-mono text-xs">{fmtDuration(c.durationSec)}</td>
                        <td className="px-6 py-3.5 text-[#6b7280] text-xs">
                          {new Date(c.startedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
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
