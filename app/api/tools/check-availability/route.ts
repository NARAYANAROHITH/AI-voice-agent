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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Agora sends the tool arguments directly in the request body.
    // The structure matches the function parameter schema defined in invite-agent.
    const { date, time, party_size } = body as {
      date: string;
      time: string;
      party_size: number;
    };

    if (!date || !time || !party_size) {
      return NextResponse.json(
        { error: 'date, time, and party_size are required' },
        { status: 400 },
      );
    }

    const restaurantId = requireEnv('NEXT_RESTAURANT_ID');

    const result = await findAvailableTables({
      restaurantId,
      date,
      time,
      partySize: party_size,
    });

    if (!result.available) {
      return NextResponse.json({
        available: false,
        message:
          result.reason === 'outside_hours'
            ? 'We are not open at that time. Our hours are 12 PM to 11 PM.'
            : `Sorry, no tables are available for ${party_size} guests on ${date} at ${time}. Please try a different time.`,
      });
    }

    const best = result.tables[0];
    return NextResponse.json({
      available: true,
      table_number: best.tableNumber,
      table_capacity: best.capacity,
      location: best.location ?? 'main dining',
      date,
      time,
      party_size,
      message: `Great news! A table for ${party_size} (Table ${best.tableNumber}, ${best.location ?? 'main dining area'}) is available on ${date} at ${time}.`,
    });
  } catch (error) {
    console.error('[check-availability]', error);
    return NextResponse.json(
      { error: 'Failed to check availability. Please try again.' },
      { status: 500 },
    );
  }
}
