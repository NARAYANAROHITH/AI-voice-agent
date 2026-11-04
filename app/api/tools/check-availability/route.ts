/**
 * Tool webhook: check_availability
 *
 * Called by Agora Conversational AI Engine when the LLM invokes the
 * check_availability tool. Returns whether tables are available for
 * the requested date, time, and party size.
 */
import { NextRequest, NextResponse } from 'next/server';
import { findAvailableTables } from '@/lib/availability';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function normalizeDate(d?: string): string {
  if (!d) return new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const lower = d.toLowerCase().trim();
  if (lower === 'today') return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  if (lower === 'tomorrow') return new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return d.trim();
}

function normalizeTime(t?: string): string {
  if (!t) return '19:30';
  const clean = t.trim();
  const match = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const mins = match[2] || '00';
    const ampm = match[3]?.toLowerCase();
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${mins}`;
  }
  return clean;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      date: rawDate,
      time: rawTime,
      party_size: rawPartySize,
    } = body as {
      date?: string;
      time?: string;
      party_size?: number | string;
    };

    const date = normalizeDate(rawDate);
    const time = normalizeTime(rawTime);
    const party_size = typeof rawPartySize === 'number' ? rawPartySize : (parseInt(String(rawPartySize || '2'), 10) || 2);

    const restaurantId = requireEnv('NEXT_RESTAURANT_ID');

    const result = await findAvailableTables({
      restaurantId,
      date,
      time,
      partySize: party_size,
    });

    const closeHeaders = { Connection: 'close' };

    if (!result.available) {
      return NextResponse.json(
        {
          available: false,
          message:
            result.reason === 'outside_hours'
              ? 'We are not open at that time. Our hours are 12 PM to 11 PM.'
              : `Sorry, no tables are available for ${party_size} guests on ${date} at ${time}. Please try a different time.`,
        },
        { headers: closeHeaders },
      );
    }

    const best = result.tables[0];
    return NextResponse.json(
      {
        available: true,
        table_number: best.tableNumber,
        table_capacity: best.capacity,
        location: best.location ?? 'main dining',
        date,
        time,
        party_size,
        message: `Great news! A table for ${party_size} (Table ${best.tableNumber}, ${best.location ?? 'main dining area'}) is available on ${date} at ${time}.`,
      },
      { headers: closeHeaders },
    );
  } catch (error) {
    console.error('[check-availability]', error);
    return NextResponse.json(
      { error: 'Failed to check availability. Please try again.' },
      { status: 500, headers: { Connection: 'close' } },
    );
  }
}
