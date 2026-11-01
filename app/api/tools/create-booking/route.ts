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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      date,
      time,
      party_size,
      customer_name,
      customer_phone,
      special_requests,
    } = body as {
      date: string;
      time: string;
      party_size: number;
      customer_name: string;
      customer_phone: string;
      special_requests?: string;
    };

    if (!date || !time || !party_size || !customer_name || !customer_phone) {
      return NextResponse.json(
        { error: 'date, time, party_size, customer_name, and customer_phone are required' },
        { status: 400 },
      );
    }

    const restaurantId = requireEnv('NEXT_RESTAURANT_ID');

    const booking = await createReservation({
      restaurantId,
      date,
      time,
      partySize: party_size,
      customerName: customer_name,
      customerPhone: customer_phone,
      specialRequests: special_requests,
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg === 'NO_TABLE_AVAILABLE') {
      return NextResponse.json({
        success: false,
        message: 'Sorry, that time slot just got booked. Please try a different time.',
      });
    }

    console.error('[create-booking]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking. Please try again.' },
      { status: 500 },
    );
  }
}
