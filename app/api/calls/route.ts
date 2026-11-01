/**
 * GET /api/calls
 * Returns call log history for the dashboard.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));

    const [calls, total] = await Promise.all([
      prisma.callLog.findMany({
        include: {
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.callLog.count(),
    ]);

    return NextResponse.json({ calls, total, page, limit });
  } catch (error) {
    console.error('[GET /api/calls]', error);
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
  }
}
