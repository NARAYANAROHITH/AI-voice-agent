/**
 * Database seed script for Spice Garden restaurant.
 *
 * Run: pnpm run seed
 *
 * Creates:
 *  - 1 restaurant: "Spice Garden"
 *  - 8 tables of varying capacity across indoor/outdoor/private sections
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Spice Garden restaurant...');

  // ─── Restaurant ───────────────────────────────────────────────────────────
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'spice-garden-main' },
    create: {
      id: 'spice-garden-main',
      name: 'Spice Garden',
      address: '42 MG Road, Bangalore, Karnataka 560001',
      phone: '+918012345678',
      timezone: 'Asia/Kolkata',
    },
    update: {
      name: 'Spice Garden',
      address: '42 MG Road, Bangalore, Karnataka 560001',
    },
  });
  console.log(`✅ Restaurant: ${restaurant.name} (${restaurant.id})`);

  // ─── Tables ───────────────────────────────────────────────────────────────
  const tableData = [
    // Indoor tables
    { tableNumber: 1, capacity: 2, location: 'indoor' },
    { tableNumber: 2, capacity: 2, location: 'indoor' },
    { tableNumber: 3, capacity: 4, location: 'indoor' },
    { tableNumber: 4, capacity: 4, location: 'indoor' },
    { tableNumber: 5, capacity: 6, location: 'indoor' },
    // Outdoor tables
    { tableNumber: 6, capacity: 4, location: 'outdoor terrace' },
    { tableNumber: 7, capacity: 6, location: 'outdoor terrace' },
    // Private dining room
    { tableNumber: 8, capacity: 12, location: 'private dining room' },
  ];

  for (const t of tableData) {
    const table = await prisma.table.upsert({
      where: {
        restaurantId_tableNumber: {
          restaurantId: restaurant.id,
          tableNumber: t.tableNumber,
        },
      },
      create: {
        restaurantId: restaurant.id,
        tableNumber: t.tableNumber,
        capacity: t.capacity,
        location: t.location,
        isActive: true,
      },
      update: {
        capacity: t.capacity,
        location: t.location,
        isActive: true,
      },
    });
    console.log(`  🪑 Table ${table.tableNumber}: ${table.capacity} guests (${table.location})`);
  }

  console.log('\n✅ Seed complete!');
  console.log(`\n📋 Add this to your .env.local:`);
  console.log(`NEXT_RESTAURANT_ID=${restaurant.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
