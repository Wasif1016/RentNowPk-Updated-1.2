import { and, count, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookings, users, vehicles } from '@/lib/db/schema'

export type VendorBookingRow = {
  bookingId: string
  vehicleName: string
  driveType: string
  customerName: string
  pickupAt: Date
  dropoffAt: Date
  pickupAddress: string
  status: string
  createdAt: Date
}

export type VendorBookingStats = {
  total: number
  active: number
  completed: number
  pending: number
}

export async function getVendorBookingStats(
  vendorUserId: string
): Promise<VendorBookingStats> {
  const [rows] = await db
    .select({
      total: count(bookings.id),
      active: count(sql`CASE WHEN ${bookings.status} = 'CONFIRMED' THEN 1 END`),
      completed: count(sql`CASE WHEN ${bookings.status} = 'COMPLETED' THEN 1 END`),
      pending: count(sql`CASE WHEN ${bookings.status} = 'PENDING' THEN 1 END`),
    })
    .from(bookings)
    .where(eq(bookings.vendorUserId, vendorUserId))

  return {
    total: rows?.total ?? 0,
    active: rows?.active ?? 0,
    completed: rows?.completed ?? 0,
    pending: rows?.pending ?? 0,
  }
}

export async function getVendorBookingsList(params: {
  vendorUserId: string
  status?: string
  page: number
  pageSize: number
}): Promise<{ rows: VendorBookingRow[]; total: number }> {
  const conditions = [eq(bookings.vendorUserId, params.vendorUserId)]
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
      customerName: users.fullName,
      pickupAt: bookings.pickupAt,
      dropoffAt: bookings.dropoffAt,
      pickupAddress: bookings.pickupAddress,
      status: bookings.status,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .innerJoin(users, eq(users.id, bookings.customerUserId))
    .where(and(...conditions))
    .orderBy(bookings.createdAt)
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize)

  return {
    rows,
    total: countRows?.total ?? 0,
  }
}
