import { and, count, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookings, users, vehicles } from '@/lib/db/schema'

export type CustomerBookingRow = {
  bookingId: string
  vehicleName: string
  driveType: string
  vendorBusinessName: string
  pickupAt: Date
  dropoffAt: Date
  pickupAddress: string
  status: string
  createdAt: Date
}

export type CustomerBookingStats = {
  total: number
  active: number
  completed: number
  pending: number
}

export async function getCustomerBookingStats(
  customerUserId: string
): Promise<CustomerBookingStats> {
  const [rows] = await db
    .select({
      total: count(bookings.id),
      active: count(sql`CASE WHEN ${bookings.status} = 'CONFIRMED' THEN 1 END`),
      completed: count(sql`CASE WHEN ${bookings.status} = 'COMPLETED' THEN 1 END`),
      pending: count(sql`CASE WHEN ${bookings.status} = 'PENDING' THEN 1 END`),
    })
    .from(bookings)
    .where(eq(bookings.customerUserId, customerUserId))

  return {
    total: rows?.total ?? 0,
    active: rows?.active ?? 0,
    completed: rows?.completed ?? 0,
    pending: rows?.pending ?? 0,
  }
}

export async function getCustomerBookingsList(params: {
  customerUserId: string
  status?: string
  page: number
  pageSize: number
}): Promise<{ rows: CustomerBookingRow[]; total: number }> {
  const conditions = [eq(bookings.customerUserId, params.customerUserId)]
  if (params.status) {
    conditions.push(eq(bookings.status, params.status as typeof bookings.$inferSelect.status))
  }

  const [countRows] = await db
    .select({ total: count(bookings.id) })
    .from(bookings)
    .where(and(...conditions))

  const rows = await db
    .select({
      bookingId: bookings.id,
      vehicleName: vehicles.name,
      driveType: bookings.driveType,
      vendorBusinessName: sql<string>`(SELECT business_name FROM vendor_profiles WHERE id = ${bookings.vendorId} LIMIT 1)`,
      pickupAt: bookings.pickupAt,
      dropoffAt: bookings.dropoffAt,
      pickupAddress: bookings.pickupAddress,
      status: bookings.status,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .where(and(...conditions))
    .orderBy(bookings.createdAt)
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize)

  return {
    rows,
    total: countRows?.total ?? 0,
  }
}
