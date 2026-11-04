'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
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
  activeTables: number;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ pathname }: { pathname: string }) {
  const nav = [
    { href: '/dashboard', label: 'Reservations', icon: '📋' },
    { href: '/dashboard/tables', label: 'Floor & Tables', icon: '🪑' },
    { href: '/dashboard/calls', label: 'Voice Calls', icon: '📞' },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#0d0a08] border-r border-white/10 flex flex-col justify-between">
      <div>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-600/30 ring-1 ring-white/20 transition-transform group-hover:scale-105">
              <span className="text-xl">🌶️</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-tight">Spice Garden</p>
              <p className="text-amber-500/80 text-[11px] font-medium uppercase tracking-wider">Staff Management</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1.5">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/10 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User info */}
      <div className="p-4 border-t border-white/10 bg-black/30">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300">
              A
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200 leading-none">Admin Staff</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Manager Access</p>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/dashboard/login' })}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sublabel,
  icon,
  gradient,
}: {
  label: string;
  value: number | string;
  sublabel: string;
  icon: string;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#141210] to-[#0a0908] p-5 shadow-lg shadow-black/40">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
          <p className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">{value}</p>
          <p className="text-[11px] text-zinc-500 mt-1">{sublabel}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${gradient} text-2xl shadow-inner ring-1 ring-white/10`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function LangBadge({ lang }: { lang: string | null }) {
  if (!lang) return null;
  const map: Record<string, { label: string; cls: string }> = {
    en: { label: 'EN', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    hi: { label: 'HI', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    te: { label: 'TE', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  };
  const entry = map[lang] ?? { label: lang.toUpperCase(), cls: 'bg-white/10 text-zinc-300 border-white/10' };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${entry.cls}`}>
      {entry.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    CONFIRMED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/20',
    CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
    COMPLETED: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    NO_SHOW: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };
  const cls = map[status] ?? 'bg-white/10 text-zinc-300 border-white/10';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {status === 'CONFIRMED' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {status.replace('_', ' ')}
    </span>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const pathname = usePathname();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<StatsData>({
    todayBookings: 0,
    confirmedBookings: 0,
    totalGuests: 0,
    activeTables: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>(''); // '' = All Bookings
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, CONFIRMED, CANCELLED
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const todayDate = new Date();
  const tomorrowDate = new Date(Date.now() + 86400000);
  const todayStr = todayDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const tomorrowStr = tomorrowDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const tomorrowLabel = tomorrowDate.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const fetchData = useCallback(async () => {
    try {
      const url = dateFilter
        ? `/api/reservations?date=${dateFilter}&limit=100&_t=${Date.now()}`
        : `/api/reservations?limit=100&_t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const resJson = await res.json();

      const list: Booking[] = resJson.bookings ?? [];
      setBookings(list);
      setTotal(resJson.total ?? list.length);

      const confirmed = list.filter((b) => b.status === 'CONFIRMED');
      const guests = confirmed.reduce((acc, b) => acc + b.partySize, 0);
      const uniqueTables = new Set(confirmed.map((b) => b.table.tableNumber)).size;

      setStats({
        todayBookings: list.length,
        confirmedBookings: confirmed.length,
        totalGuests: guests,
        activeTables: uniqueTables,
      });

      const now = new Date();
      setLastSyncTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Kolkata',
        })
      );
    } catch (err) {
      console.error('[Dashboard fetch]', err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  // Fast auto-refresh every 2 seconds, plus instant on window focus
  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 2000);
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData]);

  // Real-time in-memory filter for search & status
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      const name = b.customer.name.toLowerCase();
      const phone = b.customer.phone.toLowerCase();
      const tableNum = String(b.table.tableNumber);
      return name.includes(query) || phone.includes(query) || tableNum.includes(query);
    });
  }, [bookings, statusFilter, searchQuery]);

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Kolkata',
    });
  }

  return (
    <div className="flex h-screen bg-[#070605] text-white overflow-hidden">
      <Sidebar pathname={pathname ?? ''} />

      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-20 bg-[#0d0a08]/90 backdrop-blur-xl border-b border-white/10 px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-white font-bold text-xl tracking-tight">Live Reservations</h1>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync (2s)
                </span>
                {lastSyncTime && (
                  <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
                    Updated {lastSyncTime} IST
                  </span>
                )}
              </div>
              <p className="text-zinc-400 text-xs mt-0.5">
                {total} total booking{total !== 1 ? 's' : ''} {dateFilter ? `for ${dateFilter}` : '(all upcoming)'} · Auto-updating when Priya confirms a table
              </p>
            </div>

            {/* Date Filters & Refresh */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex rounded-xl bg-black/40 border border-white/10 p-1">
                <button
                  onClick={() => setDateFilter('')}
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                    dateFilter === ''
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All Dates
                </button>
                <button
                  onClick={() => setDateFilter(todayStr)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                    dateFilter === todayStr
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilter(tomorrowStr)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                    dateFilter === tomorrowStr
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tomorrow ({tomorrowLabel})
                </button>
              </div>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />

              <button
                onClick={() => {
                  setLoading(true);
                  fetchData();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
                title="Force refresh"
              >
                <span>↻</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 px-8 py-6 space-y-6">
          {/* Executive Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Reservations"
              value={stats.todayBookings}
              sublabel="Logged in system"
              icon="📋"
              gradient="bg-blue-500/15 text-blue-400"
            />
            <StatCard
              label="Confirmed Tables"
              value={stats.confirmedBookings}
              sublabel="Active seating guaranteed"
              icon="✅"
              gradient="bg-emerald-500/15 text-emerald-400"
            />
            <StatCard
              label="Expected Guests"
              value={stats.totalGuests}
              sublabel="Total party covers"
              icon="👥"
              gradient="bg-orange-500/15 text-orange-400"
            />
            <StatCard
              label="Tables Occupied"
              value={`${stats.activeTables} / 8`}
              sublabel="Allocated restaurant tables"
              icon="🪑"
              gradient="bg-amber-500/15 text-amber-400"
            />
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#120f0d] to-[#090807] overflow-hidden shadow-2xl shadow-black/60">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Search by customer name, phone, or table…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 w-72"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-zinc-500 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Status pill filter */}
              <div className="inline-flex rounded-xl bg-black/40 border border-white/10 p-0.5 text-xs">
                {['ALL', 'CONFIRMED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      statusFilter === st
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Table data or states */}
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 animate-spin text-xl">
                  ⚙
                </div>
                <p className="text-zinc-400 text-xs mt-3">Loading live bookings…</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                  🍽️
                </div>
                <p className="text-zinc-200 text-sm font-semibold">No reservations found</p>
                <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                  {searchQuery
                    ? `No bookings match "${searchQuery}". Try clearing search.`
                    : 'No tables booked for this filter. Start a call with Priya to book a table!'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      {['Date & Time', 'Guest Information', 'Party Size', 'Assigned Table', 'Status', 'Special Notes'].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-6 py-3.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredBookings.map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-white/[0.03] transition-colors group"
                      >
                        {/* Time & Date */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🕒</span>
                            <div>
                              <p className="font-mono text-sm font-bold text-white">
                                {formatTime(b.startTime)}
                              </p>
                              <p className="text-amber-400/90 text-xs font-semibold mt-0.5">
                                {formatDate(b.startTime)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs">
                              {b.customer.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-100 text-sm">
                                {b.customer.name}
                              </p>
                              <p className="text-zinc-400 text-xs font-mono flex items-center gap-2 mt-0.5">
                                <span>{b.customer.phone}</span>
                                <LangBadge lang={b.customer.language} />
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Party Size */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-zinc-200">
                            <span>👥</span>
                            <span>{b.partySize} {b.partySize === 1 ? 'Guest' : 'Guests'}</span>
                          </span>
                        </td>

                        {/* Table */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <span className="font-bold text-white text-sm">
                              Table {b.table.tableNumber}
                            </span>
                            <p className="text-[11px] text-zinc-400 capitalize mt-0.5">
                              {b.table.location ?? 'Indoor Dining'} · Cap {b.table.capacity}
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={b.status} />
                        </td>

                        {/* Special Requests */}
                        <td className="px-6 py-4 max-w-xs">
                          {b.specialRequests ? (
                            <span className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1 inline-block">
                              📝 {b.specialRequests}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500">—</span>
                          )}
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
