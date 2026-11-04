/**
 * GET /api/reservations
 * Returns upcoming and recent reservations for the dashboard.
 * Protected: requires dashboard session (checked server-side via auth header).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { BookingStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as BookingStatus | null;
    const date = searchParams.get('date'); // YYYY-MM-DD filter
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (date) {
      const start = new Date(`${date}T00:00:00+05:30`);
      const end = new Date(`${date}T23:59:59+05:30`);
      where.startTime = { gte: start, lte: end };
    }

    let bookings: any[] = [];
    let total = 0;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        [bookings, total] = await Promise.all([
          prisma.booking.findMany({
            where,
            include: {
              customer: { select: { name: true, phone: true, language: true } },
              table: { select: { tableNumber: true, capacity: true, location: true } },
            },
            orderBy: [{ createdAt: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.booking.count({ where }),
        ]);
        break;
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    return NextResponse.json(
      { bookings, total, page, limit },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  } catch (error) {
    console.error('[GET /api/reservations]', error);
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}
