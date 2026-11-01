/**
 * GET /api/tables
 * Returns all tables with their current availability status.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { BookingStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
    const restaurantId = process.env.NEXT_RESTAURANT_ID;

    // Fetch all tables with bookings for the requested date
    const startOfDay = new Date(`${date}T00:00:00+05:30`);
    const endOfDay = new Date(`${date}T23:59:59+05:30`);

    const tables = await prisma.table.findMany({
      where: restaurantId ? { restaurantId } : undefined,
      include: {
        bookings: {
          where: {
            status: BookingStatus.CONFIRMED,
            startTime: { gte: startOfDay, lte: endOfDay },
          },
          include: {
            customer: { select: { name: true, phone: true } },
          },
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { tableNumber: 'asc' },
    });

    return NextResponse.json({ tables, date });
  } catch (error) {
    console.error('[GET /api/tables]', error);
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 });
  }
}
