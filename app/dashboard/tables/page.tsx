'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Users,
  Loader2,
  Armchair,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';

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

function TableCard({ table }: { table: Table }) {
  const isBooked = table.bookings.length > 0;

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    });
  }

  return (
    <div
      className={`flex flex-col rounded-lg border p-5 transition-colors ${
        isBooked
          ? 'border-amber-200 bg-amber-50/40'
          : 'border-[#E5E7EB] bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold tracking-tight text-[#202124]">
              Table {table.tableNumber}
            </p>
            <span className="rounded-md border border-[#E5E7EB] bg-[#F8F9FA] px-2 py-0.5 text-[10px] font-medium capitalize text-[#6B7280]">
              {table.location ?? 'Indoor'}
            </span>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#6B7280]">
            <Users className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            Capacity: <span className="font-medium text-[#202124]">{table.capacity} guests</span>
          </p>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            isBooked
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {isBooked ? `${table.bookings.length} Booked` : 'Available'}
        </span>
      </div>

      {table.bookings.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-[#E5E7EB] pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
            Current reservations
          </p>
          {table.bookings.map((b) => (
            <div
              key={b.id}
              className="rounded-md border border-[#E5E7EB] bg-white p-2.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[#202124]">{b.customer.name}</span>
                <span className="font-mono text-[10px] text-[#6B7280]">
                  {fmtTime(b.startTime)}–{fmtTime(b.endTime)}
                </span>
              </div>
              <p className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[#6B7280]">
                <span>{b.partySize} guests</span>
                <span className="font-mono">{b.customer.phone}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
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
  const [date, setDate] = useState(todayStr);
  const [loading, setLoading] = useState(true);

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`/api/tables?date=${date}&_t=${Date.now()}`, {
        cache: 'no-store',
      });
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
    <div className="flex h-screen flex-col overflow-hidden bg-[#F8F9FA] text-[#202124] lg:flex-row">
      <DashboardSidebar />

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Header */}
        <header className="sticky top-14 z-20 border-b border-[#E5E7EB] bg-white px-4 py-4 sm:px-6 lg:top-0 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold tracking-tight text-[#202124] sm:text-xl">
                  Floor &amp; Table Map
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" aria-hidden="true" />
                  Live Sync
                </span>
              </div>
              <p className="mt-1 text-xs text-[#6B7280]">
                {available} open tables · {occupied} reserved for {date}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex rounded-md border border-[#E5E7EB] bg-white p-0.5"
                role="group"
                aria-label="Date"
              >
                <button
                  onClick={() => setDate(todayStr)}
                  aria-pressed={date === todayStr}
                  className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors ${
                    date === todayStr
                      ? 'bg-[#B45309] text-white'
                      : 'text-[#6B7280] hover:bg-[#F8F9FA] hover:text-[#202124]'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDate(tomorrowStr)}
                  aria-pressed={date === tomorrowStr}
                  className={`rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors ${
                    date === tomorrowStr
                      ? 'bg-[#B45309] text-white'
                      : 'text-[#6B7280] hover:bg-[#F8F9FA] hover:text-[#202124]'
                  }`}
                >
                  Tomorrow ({tomorrowLabel})
                </button>
              </div>

              <label className="sr-only" htmlFor="floor-date">
                Filter by date
              </label>
              <input
                id="floor-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 rounded-md border border-[#E5E7EB] bg-white px-3 text-xs text-[#202124] outline-none transition-colors focus:border-[#B45309]"
              />

              <button
                onClick={() => {
                  setLoading(true);
                  fetchTables();
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#202124] transition-colors hover:bg-[#F8F9FA]"
              >
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Grid */}
        <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2
                className="h-6 w-6 animate-spin text-[#B45309]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <p className="text-xs text-[#6B7280]">Loading restaurant floor plan…</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Armchair className="h-8 w-8 text-[#B45309]" strokeWidth={1.25} aria-hidden="true" />
              <p className="text-sm font-semibold text-[#202124]">No tables configured</p>
              <p className="max-w-xs text-xs leading-relaxed text-[#6B7280]">
                Run the seed script against your database to populate the floor plan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tables.map((t) => (
                <TableCard key={t.id} table={t} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
