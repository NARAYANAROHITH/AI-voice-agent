'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Users,
  Armchair,
  Loader2,
  CalendarClock,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';

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

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280] sm:text-[11px]">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#202124] sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-[#6B7280]">{sublabel}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#E5E7EB] bg-[#F8F9FA]">
          <Icon className="h-5 w-5 text-[#B45309]" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function LangBadge({ lang }: { lang: string | null }) {
  if (!lang) return null;
  const map: Record<string, { label: string; cls: string }> = {
    en: { label: 'EN', cls: 'border-blue-200 bg-blue-50 text-blue-700' },
    hi: { label: 'HI', cls: 'border-orange-200 bg-orange-50 text-orange-700' },
    te: { label: 'TE', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  };
  const entry = map[lang] ?? {
    label: lang.toUpperCase(),
    cls: 'border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280]',
  };
  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${entry.cls}`}
    >
      {entry.label}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
  COMPLETED: 'border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280]',
  NO_SHOW: 'border-amber-200 bg-amber-50 text-amber-800',
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    STATUS_STYLES[status] ?? 'border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}
    >
      {status === 'CONFIRMED' && (
        <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
      )}
      {status.replace('_', ' ')}
    </span>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
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
  const tomorrowStr = tomorrowDate.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });
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
        }),
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
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8F9FA] text-[#202124] lg:flex-row">
      <DashboardSidebar />

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Header */}
        <header className="sticky top-14 z-20 border-b border-[#E5E7EB] bg-white px-4 py-4 sm:px-6 lg:top-0 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold tracking-tight text-[#202124] sm:text-xl">
                  Live Reservations
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
                  Live Sync
                </span>
                {lastSyncTime && (
                  <span className="hidden font-mono text-[11px] text-[#6B7280] md:inline">
                    Updated {lastSyncTime} IST
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#6B7280]">
                {total} total booking{total !== 1 ? 's' : ''}{' '}
                {dateFilter ? `for ${dateFilter}` : '(all upcoming)'} · Syncs automatically when
                Priya confirms a table
              </p>
            </div>

            {/* Date filters & refresh */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex rounded-md border border-[#E5E7EB] bg-white p-0.5"
                role="group"
                aria-label="Date range"
              >
                {[
                  { key: '', label: 'All Dates' },
                  { key: todayStr, label: 'Today' },
                  { key: tomorrowStr, label: `Tomorrow (${tomorrowLabel})` },
                ].map(({ key, label }) => {
                  const active = dateFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setDateFilter(key)}
                      aria-pressed={active}
                      className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#B45309] text-white'
                          : 'text-[#6B7280] hover:bg-[#F8F9FA] hover:text-[#202124]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <label className="sr-only" htmlFor="date-filter">
                Filter by date
              </label>
              <input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-xs text-[#202124] outline-none transition-colors focus:border-[#B45309]"
              />

              <button
                onClick={() => {
                  setLoading(true);
                  fetchData();
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#202124] transition-colors hover:bg-[#F8F9FA]"
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              label="Total Reservations"
              value={stats.todayBookings}
              sublabel="Logged in system"
              icon={ClipboardList}
            />
            <StatCard
              label="Confirmed Tables"
              value={stats.confirmedBookings}
              sublabel="Active seating guaranteed"
              icon={CheckCircle2}
            />
            <StatCard
              label="Expected Guests"
              value={stats.totalGuests}
              sublabel="Total party covers"
              icon={Users}
            />
            <StatCard
              label="Tables Occupied"
              value={`${stats.activeTables} / 8`}
              sublabel="Allocated restaurant tables"
              icon={Armchair}
            />
          </div>

          {/* Reservations table */}
          <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3 sm:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:min-w-72">
                <Search
                  className="h-4 w-4 shrink-0 text-[#6B7280]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  placeholder="Search by customer name, phone, or table…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search reservations"
                  className="h-9 w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-3 text-xs text-[#202124] outline-none transition-colors placeholder:text-[#6B7280] focus:border-[#B45309]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="shrink-0 text-xs font-medium text-[#6B7280] transition-colors hover:text-[#202124]"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Status filter */}
              <div
                className="inline-flex rounded-md border border-[#E5E7EB] bg-white p-0.5"
                role="group"
                aria-label="Status filter"
              >
                {['ALL', 'CONFIRMED', 'CANCELLED'].map((st) => {
                  const active = statusFilter === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      aria-pressed={active}
                      className={`rounded-[6px] px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                        active
                          ? 'bg-[#202124] text-white'
                          : 'text-[#6B7280] hover:bg-[#F8F9FA] hover:text-[#202124]'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <Loader2
                  className="h-6 w-6 animate-spin text-[#B45309]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <p className="text-xs text-[#6B7280]">Loading live bookings…</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                <CalendarClock
                  className="h-8 w-8 text-[#B45309]"
                  strokeWidth={1.25}
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold text-[#202124]">No reservations found</p>
                <p className="max-w-sm text-xs leading-relaxed text-[#6B7280]">
                  {searchQuery
                    ? `No bookings match "${searchQuery}". Try clearing the search.`
                    : 'No tables booked for this filter. Start a call with Priya to book a table.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA]">
                      {[
                        'Date & Time',
                        'Guest Information',
                        'Party Size',
                        'Assigned Table',
                        'Status',
                        'Special Notes',
                      ].map((h) => (
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
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="transition-colors hover:bg-[#F8F9FA]">
                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-mono text-sm font-semibold text-[#202124]">
                            {formatTime(b.startTime)}
                          </p>
                          <p className="mt-0.5 text-xs text-[#6B7280]">
                            {formatDate(b.startTime)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F8F9FA] text-[11px] font-semibold text-[#B45309]">
                              {b.customer.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-[#202124]">
                                {b.customer.name}
                              </p>
                              <p className="mt-0.5 flex items-center gap-2 font-mono text-xs text-[#6B7280]">
                                <span>{b.customer.phone}</span>
                                <LangBadge lang={b.customer.language} />
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-[#F8F9FA] px-2 py-1 text-xs font-medium text-[#202124]">
                            <Users className="h-3.5 w-3.5 text-[#6B7280]" strokeWidth={1.75} aria-hidden="true" />
                            {b.partySize} {b.partySize === 1 ? 'Guest' : 'Guests'}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-semibold text-[#202124]">Table {b.table.tableNumber}</p>
                          <p className="mt-0.5 text-[11px] capitalize text-[#6B7280]">
                            {b.table.location ?? 'Indoor Dining'} · Cap {b.table.capacity}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <StatusBadge status={b.status} />
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          {b.specialRequests ? (
                            <span className="inline-block rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                              {b.specialRequests}
                            </span>
                          ) : (
                            <span className="text-xs text-[#6B7280]">—</span>
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
