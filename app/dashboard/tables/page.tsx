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

function TableCard({ table, date: _date }: { table: Table; date: string }) {
  const isBooked = table.bookings.length > 0;
  const occupancy = table.bookings.length;

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
    });
  }

  return (
    <div className={`bg-[#111111] border rounded-xl p-5 transition-all ${isBooked ? 'border-[#f97316]/30' : 'border-[#1f1f1f]'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white font-bold text-xl">T{table.tableNumber}</p>
          <p className="text-[#6b7280] text-xs mt-0.5">{table.location ?? 'main dining'}</p>
        </div>
        <div className={`px-2 py-1 rounded-lg text-xs font-medium ${isBooked ? 'bg-[#f97316]/15 text-[#f97316]' : 'bg-emerald-500/15 text-emerald-400'}`}>
          {isBooked ? `${occupancy} booking${occupancy > 1 ? 's' : ''}` : 'Available'}
        </div>
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-[#6b7280] text-xs">Capacity:</span>
        <span className="text-white text-xs font-medium">{table.capacity} guests</span>
      </div>

      {/* Bookings */}
      {table.bookings.length > 0 && (
        <div className="space-y-2 border-t border-[#1f1f1f] pt-3">
          {table.bookings.map((b) => (
            <div key={b.id} className="bg-[#1a1a1a] rounded-lg px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-white text-xs font-medium">{b.customer.name}</span>
                <span className="text-[#6b7280] font-mono text-xs">{fmtTime(b.startTime)}–{fmtTime(b.endTime)}</span>
              </div>
              <p className="text-[#6b7280] text-xs mt-0.5">{b.partySize} guests · {b.customer.phone}</p>
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
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [date, setDate] = useState(tomorrowStr); // Default to tomorrow or today
  const [loading, setLoading] = useState(true);

  const fetchTables = useCallback(async () => {
    try {
      const data = await fetch(`/api/tables?date=${date}`).then((r) => r.json());
      setTables(data.tables ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchTables();
    const timer = setInterval(fetchTables, 4000);
    return () => clearInterval(timer);
  }, [fetchTables]);

  const available = tables.filter((t) => t.bookings.length === 0 && t.isActive).length;
  const occupied = tables.filter((t) => t.bookings.length > 0).length;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <Sidebar pathname={pathname ?? ''} />
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#0a0a0a]/80 backdrop-blur border-b border-[#1a1a1a] px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-white font-semibold text-lg">Tables</h1>
            <p className="text-[#6b7280] text-xs mt-0.5">{available} available · {occupied} booked on {date} · Live 🟢</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-[#141414] border border-[#222] p-0.5">
              <button
                onClick={() => setDate(todayStr)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  date === todayStr
                    ? 'bg-[#f97316] text-white shadow'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDate(tomorrowStr)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  date === tomorrowStr
                    ? 'bg-[#f97316] text-white shadow'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                Tomorrow (Nov 3)
              </button>
            </div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-[#f97316]" />
            <button onClick={() => { setLoading(true); fetchTables(); }}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2.5 py-1 text-xs text-[#9ca3af] hover:text-white transition-colors">↻ Refresh</button>
          </div>
        </div>

        <div className="px-8 py-6">
          {loading ? (
            <div className="text-center text-[#6b7280] text-sm py-16">Loading tables…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tables.map((t) => <TableCard key={t.id} table={t} date={date} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
