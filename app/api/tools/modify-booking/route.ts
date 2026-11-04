/**
 * Tool webhook: modify_booking
 *
 * Modifies an existing reservation (date, time, or party size).
 * Transactionally cancels the old booking and creates a new one.
 */
import { NextRequest, NextResponse } from 'next/server';
import { modifyReservation } from '@/lib/availability';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customer_phone,
      booking_id,
      new_date,
      new_time,
      new_party_size,
    } = body as {
      customer_phone: string;
      booking_id?: string;
      new_date?: string;
      new_time?: string;
      new_party_size?: number;
    };

    if (!customer_phone) {
      return NextResponse.json(
        { error: 'customer_phone is required' },
        { status: 400 },
      );
    }

    const booking = await modifyReservation({
      customerPhone: customer_phone,
      bookingId: booking_id,
      newDate: new_date,
      newTime: new_time,
      newPartySize: new_party_size,
    });

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      table_number: booking.table.tableNumber,
      party_size: booking.partySize,
      message: `Your reservation has been updated. Table ${booking.table.tableNumber} for ${booking.partySize} guests. Booking ID: ${booking.id.slice(-6).toUpperCase()}.`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg === 'CUSTOMER_NOT_FOUND') {
      return NextResponse.json({
        success: false,
        message: 'I could not find any bookings for that phone number.',
      });
    }
    if (msg === 'NO_BOOKING_FOUND') {
      return NextResponse.json({
        success: false,
        message: 'You have no upcoming reservations to modify.',
      });
    }
    if (msg === 'NO_TABLE_AVAILABLE') {
      return NextResponse.json({
        success: false,
        message: 'Sorry, the new time slot is not available. Please try a different time.',
      });
    }

    console.error('[modify-booking]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to modify booking. Please try again.' },
      { status: 500 },
    );
  }
}
