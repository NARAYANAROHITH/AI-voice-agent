import { prisma } from './db';
import { BookingStatus } from '@prisma/client';

export interface TableAvailabilityQuery {
  restaurantId?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h IST)
  partySize: number;
}

export interface AvailableTableResult {
  id: string;
  tableNumber: number;
  capacity: number;
  location: string | null;
}

export interface AvailabilityResult {
  available: boolean;
  reason?: 'outside_hours' | 'no_capacity' | string;
  tables: AvailableTableResult[];
}

/**
 * Validates whether the given time falls within restaurant operating hours (12:00 PM to 11:00 PM IST).
 */
export function isWithinOperatingHours(time: string): boolean {
  const [hStr, mStr] = time.split(':');
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr || '0', 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return false;

  // Open 12:00 to 23:00 (11:00 PM last booking)
  if (hours < 12) return false;
  if (hours > 23) return false;
  if (hours === 23 && minutes > 0) return false;

  return true;
}

/**
 * Converts IST date and time strings into UTC Date objects.
 */
export function parseIstDateTime(date: string, time: string): {
  startTime: Date;
  endTime: Date;
  reservationDate: Date;
} {
  const padTime = time.length === 5 ? `${time}:00` : time;
  const startTime = new Date(`${date}T${padTime}+05:30`);
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours reservation
  const reservationDate = new Date(`${date}T00:00:00+05:30`);

  return { startTime, endTime, reservationDate };
}

/**
 * Checks for table availability for a given party size, date, and time.
 */
export async function findAvailableTables({
  restaurantId,
  date,
  time,
  partySize,
}: TableAvailabilityQuery): Promise<AvailabilityResult> {
  if (!isWithinOperatingHours(time)) {
    return { available: false, reason: 'outside_hours', tables: [] };
  }

  const { startTime, endTime } = parseIstDateTime(date, time);

  // 1. Fetch candidate tables that can fit the party
  const tables = await prisma.table.findMany({
    where: {
      ...(restaurantId ? { restaurantId } : {}),
      isActive: true,
      capacity: { gte: partySize },
    },
    orderBy: [{ capacity: 'asc' }, { tableNumber: 'asc' }],
  });

  if (tables.length === 0) {
    return { available: false, reason: 'no_capacity', tables: [] };
  }

  // 2. Fetch overlapping bookings for these candidate tables
  const tableIds = tables.map((t) => t.id);
  const overlappingBookings = await prisma.booking.findMany({
    where: {
      tableId: { in: tableIds },
      status: BookingStatus.CONFIRMED,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    select: { tableId: true },
  });

  const bookedTableIds = new Set(overlappingBookings.map((b) => b.tableId));
  const availableTables = tables.filter((t) => !bookedTableIds.has(t.id));

  if (availableTables.length === 0) {
    return { available: false, reason: 'no_capacity', tables: [] };
  }

  return {
    available: true,
    tables: availableTables.map((t) => ({
      id: t.id,
      tableNumber: t.tableNumber,
      capacity: t.capacity,
      location: t.location,
    })),
  };
}

export interface CreateReservationParams {
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  customerName: string;
  customerPhone: string;
  specialRequests?: string;
}

/**
 * Creates a confirmed reservation for a customer, upserting customer record.
 */
export async function createReservation({
  restaurantId,
  date,
  time,
  partySize,
  customerName,
  customerPhone,
  specialRequests,
}: CreateReservationParams) {
  const availability = await findAvailableTables({
    restaurantId,
    date,
    time,
    partySize,
  });

  if (!availability.available || availability.tables.length === 0) {
    throw new Error('NO_TABLE_AVAILABLE');
  }

  const bestTable = availability.tables[0];
  const { startTime, endTime, reservationDate } = parseIstDateTime(date, time);

  // Upsert customer
  const cleanPhone = customerPhone.trim();
  const customer = await prisma.customer.upsert({
    where: { phone: cleanPhone },
    create: {
      name: customerName.trim(),
      phone: cleanPhone,
    },
    update: {
      name: customerName.trim(),
    },
  });

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      restaurantId,
      tableId: bestTable.id,
      customerId: customer.id,
      reservationDate,
      startTime,
      endTime,
      partySize,
      status: BookingStatus.CONFIRMED,
      specialRequests: specialRequests?.trim() || null,
    },
    include: {
      table: true,
      customer: true,
    },
  });

  return booking;
}

/**
 * Fetches upcoming confirmed bookings for a customer by phone number.
 */
export async function getBookingsByPhone(customerPhone: string) {
  const cleanPhone = customerPhone.trim();
  const customer = await prisma.customer.findUnique({
    where: { phone: cleanPhone },
    include: {
      bookings: {
        where: {
          status: BookingStatus.CONFIRMED,
          startTime: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        },
        include: {
          table: {
            select: {
              tableNumber: true,
              capacity: true,
              location: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
      },
    },
  });

  return customer;
}

export interface ModifyReservationParams {
  customerPhone: string;
  bookingId?: string;
  newDate?: string;
  newTime?: string;
  newPartySize?: number;
}

/**
 * Modifies an existing reservation.
 */
export async function modifyReservation({
  customerPhone,
  bookingId,
  newDate,
  newTime,
  newPartySize,
}: ModifyReservationParams) {
  const cleanPhone = customerPhone.trim();
  const customer = await prisma.customer.findUnique({
    where: { phone: cleanPhone },
  });

  if (!customer) {
    throw new Error('CUSTOMER_NOT_FOUND');
  }

  let booking = null;
  if (bookingId) {
    booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: customer.id,
        status: BookingStatus.CONFIRMED,
      },
      include: { table: true },
    });
  } else {
    booking = await prisma.booking.findFirst({
      where: {
        customerId: customer.id,
        status: BookingStatus.CONFIRMED,
        startTime: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      },
      include: { table: true },
      orderBy: { startTime: 'asc' },
    });
  }

  if (!booking) {
    throw new Error('NO_BOOKING_FOUND');
  }

  // Determine target date, time, and party size
  const istOffset = 5.5 * 60 * 60 * 1000;
  const currentIst = new Date(booking.startTime.getTime() + istOffset);
  const targetDate = newDate ?? currentIst.toISOString().slice(0, 10);
  const targetTime =
    newTime ??
    `${String(currentIst.getUTCHours()).padStart(2, '0')}:${String(
      currentIst.getUTCMinutes(),
    ).padStart(2, '0')}`;
  const targetPartySize = newPartySize ?? booking.partySize;

  const { startTime: newStart, endTime: newEnd, reservationDate: newResDate } =
    parseIstDateTime(targetDate, targetTime);

  if (!isWithinOperatingHours(targetTime)) {
    throw new Error('OUTSIDE_HOURS');
  }

  // Check table availability excluding this current booking
  const tables = await prisma.table.findMany({
    where: {
      restaurantId: booking.restaurantId,
      isActive: true,
      capacity: { gte: targetPartySize },
    },
    orderBy: [{ capacity: 'asc' }, { tableNumber: 'asc' }],
  });

  const tableIds = tables.map((t) => t.id);
  const overlapping = await prisma.booking.findMany({
    where: {
      id: { not: booking.id },
      tableId: { in: tableIds },
      status: BookingStatus.CONFIRMED,
      startTime: { lt: newEnd },
      endTime: { gt: newStart },
    },
    select: { tableId: true },
  });

  const bookedIds = new Set(overlapping.map((b) => b.tableId));
  const available = tables.filter((t) => !bookedIds.has(t.id));

  if (available.length === 0) {
    throw new Error('NO_TABLE_AVAILABLE');
  }

  const newTable = available[0];

  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      tableId: newTable.id,
      startTime: newStart,
      endTime: newEnd,
      reservationDate: newResDate,
      partySize: targetPartySize,
    },
    include: {
      table: true,
      customer: true,
    },
  });

  return updatedBooking;
}

export interface CancelReservationParams {
  bookingId?: string;
  customerPhone?: string;
}

/**
 * Cancels a reservation by bookingId or customerPhone.
 */
export async function cancelReservation({
  bookingId,
  customerPhone,
}: CancelReservationParams) {
  let booking = null;

  if (bookingId) {
    booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { table: true },
    });
  } else if (customerPhone) {
    const cleanPhone = customerPhone.trim();
    const customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    if (!customer) {
      throw new Error('CUSTOMER_NOT_FOUND');
    }

    booking = await prisma.booking.findFirst({
      where: {
        customerId: customer.id,
        status: BookingStatus.CONFIRMED,
        startTime: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      },
      include: { table: true },
      orderBy: { startTime: 'asc' },
    });
  }

  if (!booking) {
    throw new Error('NO_BOOKING_FOUND');
  }

  const cancelled = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: BookingStatus.CANCELLED },
    include: {
      table: true,
      customer: true,
    },
  });

  return cancelled;
}
