import { and, count, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookings, users, vehicles, vendorProfiles } from '@/lib/db/schema'

export type AdminBookingRow = {
  bookingId: string
  vehicleName: string
  customerName: string
  vendorBusinessName: string
  pickupAt: Date
  dropoffAt: Date
  pickupAddress: string
  status: string
  createdAt: Date
}

export type AdminBookingStats = {
  total: number
  active: number
  completed: number
  pending: number
}

export async function getAdminBookingStats(): Promise<AdminBookingStats> {
  const [rows] = await db
    .select({
      total: count(bookings.id),
      active: count(sql`CASE WHEN ${bookings.status} = 'CONFIRMED' THEN 1 END`),
      completed: count(sql`CASE WHEN ${bookings.status} = 'COMPLETED' THEN 1 END`),
      pending: count(sql`CASE WHEN ${bookings.status} = 'PENDING' THEN 1 END`),
    })
    .from(bookings)

  return {
    total: rows?.total ?? 0,
    active: rows?.active ?? 0,
    completed: rows?.completed ?? 0,
    pending: rows?.pending ?? 0,
  }
}

export async function getAdminBookingsList(params: {
  status?: string
  page: number
  pageSize: number
}): Promise<{ rows: AdminBookingRow[]; total: number }> {
  const whereClause = params.status
    ? eq(bookings.status, params.status as typeof bookings.$inferSelect.status)
    : undefined

  const [countRows] = await db
    .select({ total: count(bookings.id) })
    .from(bookings)
    .where(whereClause)

  const rows = await db
    .select({
      bookingId: bookings.id,
      vehicleName: vehicles.name,
      customerName: users.fullName,
      vendorBusinessName: vendorProfiles.businessName,
      pickupAt: bookings.pickupAt,
      dropoffAt: bookings.dropoffAt,
      pickupAddress: bookings.pickupAddress,
      status: bookings.status,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .innerJoin(users, eq(users.id, bookings.customerUserId))
    .innerJoin(vendorProfiles, eq(vendorProfiles.id, bookings.vendorId))
    .where(whereClause)
    .orderBy(bookings.createdAt)
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize)

  return {
    rows,
    total: countRows?.total ?? 0,
  }
}
