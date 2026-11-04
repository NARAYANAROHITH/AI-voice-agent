/**
 * Tool webhook: create_booking
 *
 * Creates a confirmed restaurant reservation.
 * The booking is only confirmed after a successful DB write —
 * the agent is instructed never to tell the customer it's confirmed
 * until this endpoint returns success.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createReservation } from '@/lib/availability';

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
      customer_name,
      customer_phone,
      special_requests,
    } = body as {
      date?: string;
      time?: string;
      party_size?: number | string;
      customer_name?: string;
      customer_phone?: string;
      special_requests?: string;
    };

    const date = normalizeDate(rawDate);
    const time = normalizeTime(rawTime);
    const party_size = typeof rawPartySize === 'number' ? rawPartySize : (parseInt(String(rawPartySize || '2'), 10) || 2);
    const cleanPhone = String(customer_phone || '').trim().replace(/[\s-]/g, '');
    const resolvedName = customer_name?.trim() || 'Guest';

    if (!cleanPhone) {
      return NextResponse.json(
        { error: 'customer_phone is required' },
        { status: 400 },
      );
    }

    const restaurantId = requireEnv('NEXT_RESTAURANT_ID');

    const booking = await createReservation({
      restaurantId,
      date,
      time,
      partySize: party_size,
      customerName: resolvedName,
      customerPhone: cleanPhone,
      specialRequests: special_requests,
    });

    const closeHeaders = { Connection: 'close' };

    return NextResponse.json(
      {
        success: true,
        booking_id: booking.id,
        table_number: booking.table.tableNumber,
        location: booking.table.location ?? 'main dining area',
        date,
        time,
        party_size,
        customer_name: booking.customer.name,
        customer_phone: booking.customer.phone,
        special_requests: booking.specialRequests ?? null,
        message: `Your reservation is confirmed! Table ${booking.table.tableNumber} for ${party_size} guests on ${date} at ${time}. Booking ID: ${booking.id.slice(-6).toUpperCase()}.`,
      },
      { headers: closeHeaders },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg === 'NO_TABLE_AVAILABLE') {
      return NextResponse.json(
        {
          success: false,
          message: 'Sorry, that time slot just got booked. Please try a different time.',
        },
        { headers: { Connection: 'close' } },
      );
    }

    console.error('[create-booking]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking. Please try again.' },
      { status: 500, headers: { Connection: 'close' } },
    );
  }
}
