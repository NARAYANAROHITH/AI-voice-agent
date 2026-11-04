'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface TableBooking {
  id: string;
  startTime: string;
  endTime: string;
  partySize: number;
  customer: { name: string; phone: string };
}

interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
  location: string | null;
  isActive: boolean;
  bookings: TableBooking[];
}

function Sidebar({ pathname }: { pathname: string }) {
  const nav = [
    { href: '/dashboard', label: 'Reservations', icon: '📋' },
    { href: '/dashboard/tables', label: 'Floor & Tables', icon: '🪑' },
    { href: '/dashboard/calls', label: 'Voice Calls', icon: '📞' },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#0d0a08] border-r border-white/10 flex flex-col justify-between">
      <div>
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

      <div className="p-4 border-t border-white/10 bg-black/30">
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

function TableCard({ table }: { table: Table; date: string }) {
  const isBooked = table.bookings.length > 0;
  const occupancy = table.bookings.length;

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all p-5 ${
        isBooked
          ? 'border-amber-500/30 bg-gradient-to-b from-[#18120e] to-[#0d0a08] shadow-lg shadow-orange-950/20'
          : 'border-white/10 bg-gradient-to-b from-[#121214] to-[#0a0a0c]'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-white tracking-tight">Table {table.tableNumber}</p>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-400 capitalize">
              {table.location ?? 'Indoor Dining'}
            </span>
          </div>
          <p className="text-zinc-400 text-xs mt-1 flex items-center gap-1.5">
            <span>👥 Capacity:</span>
            <span className="font-semibold text-zinc-200">{table.capacity} guests</span>
          </p>
        </div>

        <div
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isBooked
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 ring-1 ring-amber-500/20'
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          }`}
        >
          {isBooked ? `${occupancy} Booked` : '🟢 Available'}
        </div>
      </div>

      {table.bookings.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            Current Reservations:
          </p>
          {table.bookings.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-white/5 bg-black/40 p-2.5 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200">{b.customer.name}</span>
                <span className="font-mono text-[11px] text-amber-400 font-medium">
                  {fmtTime(b.startTime)}–{fmtTime(b.endTime)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 flex items-center justify-between">
                <span>{b.partySize} guests</span>
                <span className="font-mono text-zinc-500">{b.customer.phone}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TablesPage() {
  const pathname = usePathname();
  const [tables, setTables] = useState<Table[]>([]);
  const todayDate = new Date();
  const tomorrowDate = new Date(Date.now() + 86400000);
  const todayStr = todayDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const tomorrowStr = tomorrowDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const tomorrowLabel = tomorrowDate.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  const [date, setDate] = useState(todayStr);
  const [loading, setLoading] = useState(true);

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`/api/tables?date=${date}&_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setTables(data.tables ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchTables();
    const timer = setInterval(fetchTables, 3000);
    return () => clearInterval(timer);
  }, [fetchTables]);

  const available = tables.filter((t) => t.bookings.length === 0 && t.isActive).length;
  const occupied = tables.filter((t) => t.bookings.length > 0).length;

  return (
    <div className="flex h-screen bg-[#070605] text-white overflow-hidden">
      <Sidebar pathname={pathname ?? ''} />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="sticky top-0 z-20 bg-[#0d0a08]/90 backdrop-blur-xl border-b border-white/10 px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-white font-bold text-xl tracking-tight">Floor &amp; Table Map</h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-zinc-400 text-xs mt-0.5">
              {available} open tables · {occupied} reserved for {date}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-xl bg-black/40 border border-white/10 p-1">
              <button
                onClick={() => setDate(todayStr)}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                  date === todayStr
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDate(tomorrowStr)}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                  date === tomorrowStr
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tomorrow ({tomorrowLabel})
              </button>
            </div>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />

            <button
              onClick={() => {
                setLoading(true);
                fetchTables();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <span>↻</span>
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <div className="flex-1 px-8 py-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 animate-spin text-xl">
                ⚙
              </div>
              <p className="text-zinc-400 text-xs mt-3">Loading restaurant floor plan…</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tables.map((t) => (
                <TableCard key={t.id} table={t} date={date} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
