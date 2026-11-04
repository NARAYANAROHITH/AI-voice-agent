/**
 * Tool webhook: cancel_booking
 *
 * Cancels a customer's upcoming reservation.
 * Looks up by phone number (most common) or booking ID.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cancelReservation } from '@/lib/availability';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { booking_id, customer_phone } = body as {
      booking_id?: string;
      customer_phone?: string;
    };

    if (!booking_id && !customer_phone) {
      return NextResponse.json(
        { error: 'customer_phone or booking_id is required' },
        { status: 400 },
      );
    }

    const cancelled = await cancelReservation({
      bookingId: booking_id,
      customerPhone: customer_phone,
    });

    return NextResponse.json({
      success: true,
      booking_id: cancelled.id,
      message: `Your reservation (Table ${cancelled.table.tableNumber}) has been successfully cancelled.`,
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
        message: 'You have no upcoming reservations to cancel.',
      });
    }

    console.error('[cancel-booking]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel booking. Please try again.' },
      { status: 500 },
    );
  }
}
