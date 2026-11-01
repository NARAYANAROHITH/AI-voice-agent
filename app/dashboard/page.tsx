'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  startTime: string;
  partySize: number;
  status: string;
  specialRequests: string | null;
  customer: { name: string; phone: string; language: string | null };
  table: { tableNumber: number; capacity: number; location: string | null };
}

interface StatsData {
  todayBookings: number;
  confirmedBookings: number;
  totalGuests: number;
  activeCalls: number;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ pathname }: { pathname: string }) {
  const nav = [
    { href: '/dashboard', label: 'Reservations', icon: '📋' },
    { href: '/dashboard/tables', label: 'Tables', icon: '🪑' },
    { href: '/dashboard/calls', label: 'Call History', icon: '📞' },
  ];

  return (
    <aside className="w-60 shrink-0 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col">
      {/* Logo */}
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

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[#f97316]/10 text-[#f97316] font-medium'
                  : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[#1a1a1a]">
        <button
          onClick={() => signOut({ callbackUrl: '/dashboard/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#6b7280] hover:text-white hover:bg-[#1a1a1a] transition-colors"
        >
          <span>🚪</span> Sign out
        </button>
      </div>
    </aside>
  );
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#6b7280] text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-white mt-1.5">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Language Badge ───────────────────────────────────────────────────────────

function LangBadge({ lang }: { lang: string | null }) {
  if (!lang) return null;
  const map: Record<string, { label: string; cls: string }> = {
    en: { label: 'EN', cls: 'bg-blue-500/20 text-blue-400' },
    hi: { label: 'HI', cls: 'bg-orange-500/20 text-orange-400' },
    te: { label: 'TE', cls: 'bg-green-500/20 text-green-400' },
  };
  const entry = map[lang] ?? { label: lang.toUpperCase(), cls: 'bg-[#2a2a2a] text-[#9ca3af]' };
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${entry.cls}`}>
      {entry.label}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    CONFIRMED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20',
    COMPLETED: 'bg-[#2a2a2a] text-[#9ca3af] border-[#333]',
    NO_SHOW: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  };
  const cls = map[status] ?? 'bg-[#2a2a2a] text-[#9ca3af]';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<StatsData>({ todayBookings: 0, confirmedBookings: 0, totalGuests: 0, activeCalls: 0 });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resJson, allJson] = await Promise.all([
        fetch(`/api/reservations?date=${dateFilter}&limit=50`).then((r) => r.json()),
        fetch(`/api/reservations?limit=1`).then((r) => r.json()),
      ]);

      setBookings(resJson.bookings ?? []);
      setTotal(resJson.total ?? 0);

      // Compute simple stats
      const confirmed = (resJson.bookings as Booking[])?.filter((b) => b.status === 'CONFIRMED') ?? [];
      const guests = confirmed.reduce((acc: number, b: Booking) => acc + b.partySize, 0);
      setStats({
        todayBookings: resJson.total ?? 0,
        confirmedBookings: confirmed.length,
        totalGuests: guests,
        activeCalls: 0,
      });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <Sidebar pathname={pathname ?? ''} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur border-b border-[#1a1a1a] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-semibold text-lg">Reservations</h1>
            <p className="text-[#6b7280] text-xs mt-0.5">{total} booking{total !== 1 ? 's' : ''} for {dateFilter}</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#f97316]"
            />
            <button
              onClick={fetchData}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-[#9ca3af] hover:text-white transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Bookings" value={stats.todayBookings} icon="📋" color="bg-blue-500/10" />
            <StatCard label="Confirmed" value={stats.confirmedBookings} icon="✅" color="bg-emerald-500/10" />
            <StatCard label="Total Guests" value={stats.totalGuests} icon="👥" color="bg-orange-500/10" />
            <StatCard label="Active Calls" value={stats.activeCalls} icon="📞" color="bg-purple-500/10" />
          </div>

          {/* Table */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1f1f1f]">
              <h2 className="text-white font-medium text-sm">Booking List</h2>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center text-[#6b7280] text-sm">Loading…</div>
            ) : bookings.length === 0 ? (
              <div className="px-6 py-12 text-center text-[#6b7280] text-sm">No bookings for this date.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1f1f1f]">
                      {['Time', 'Customer', 'Guests', 'Table', 'Status', 'Special Requests'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#1a1a1a]/40 transition-colors">
                        <td className="px-6 py-3.5 text-white font-mono text-xs">{formatTime(b.startTime)}</td>
                        <td className="px-6 py-3.5">
                          <p className="text-white text-sm">{b.customer.name}</p>
                          <p className="text-[#6b7280] text-xs flex items-center gap-1.5 mt-0.5">
                            {b.customer.phone} <LangBadge lang={b.customer.language} />
                          </p>
                        </td>
                        <td className="px-6 py-3.5 text-[#9ca3af]">{b.partySize}</td>
                        <td className="px-6 py-3.5">
                          <p className="text-white">Table {b.table.tableNumber}</p>
                          <p className="text-[#6b7280] text-xs">{b.table.location ?? 'main'}</p>
                        </td>
                        <td className="px-6 py-3.5"><StatusBadge status={b.status} /></td>
                        <td className="px-6 py-3.5 text-[#9ca3af] max-w-xs truncate">{b.specialRequests ?? '—'}</td>
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
