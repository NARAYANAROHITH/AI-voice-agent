/**
 * Tool webhook: get_bookings_by_phone
 *
 * Looks up existing upcoming reservations for a customer by phone number.
 * The agent calls this before cancellation or modification to confirm
 * the details with the customer.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getBookingsByPhone } from '@/lib/availability';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_phone } = body as { customer_phone: string };

    if (!customer_phone) {
      return NextResponse.json(
        { error: 'customer_phone is required' },
        { status: 400 },
      );
    }

    const customer = await getBookingsByPhone(customer_phone);

    if (!customer || customer.bookings.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'No upcoming reservations found for that phone number.',
      });
    }

    const bookings = customer.bookings.map((b) => {
      // Convert UTC back to IST for display
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istStart = new Date(b.startTime.getTime() + istOffset);
      const dateStr = istStart.toISOString().slice(0, 10);
      const timeStr = `${String(istStart.getUTCHours()).padStart(2, '0')}:${String(istStart.getUTCMinutes()).padStart(2, '0')}`;

      return {
        booking_id: b.id,
        booking_short_id: b.id.slice(-6).toUpperCase(),
        table_number: b.table.tableNumber,
        date: dateStr,
        time: timeStr,
        party_size: b.partySize,
        special_requests: b.specialRequests ?? null,
      };
    });

    const next = bookings[0];
    const summary =
      bookings.length === 1
        ? `You have 1 upcoming reservation: Table ${next.table_number} on ${next.date} at ${next.time} for ${next.party_size} guests. Booking ID: ${next.booking_short_id}.`
        : `You have ${bookings.length} upcoming reservations. The next one is Table ${next.table_number} on ${next.date} at ${next.time} for ${next.party_size} guests.`;

    return NextResponse.json({
      found: true,
      customer_name: customer.name,
      bookings,
      message: summary,
    });
  } catch (error) {
    console.error('[get-bookings-by-phone]', error);
    return NextResponse.json(
      { error: 'Failed to look up reservations. Please try again.' },
      { status: 500 },
    );
  }
}
