import { and, count, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookings, customerProfiles, users, vehicles } from '@/lib/db/schema'

export type CustomerDashboardStats = {
  totalBookings: number
  activeBookings: number
  pendingBookings: number
  completedBookings: number
}

export async function getCustomerDashboardStats(
  customerUserId: string
): Promise<CustomerDashboardStats> {
  const [rows] = await db
    .select({
      total: count(bookings.id),
      active: count(sql`CASE WHEN ${bookings.status} = 'CONFIRMED' THEN 1 END`),
      pending: count(sql`CASE WHEN ${bookings.status} = 'PENDING' THEN 1 END`),
      completed: count(sql`CASE WHEN ${bookings.status} = 'COMPLETED' THEN 1 END`),
    })
    .from(bookings)
    .where(eq(bookings.customerUserId, customerUserId))

  return {
    totalBookings: rows?.total ?? 0,
    activeBookings: rows?.active ?? 0,
    pendingBookings: rows?.pending ?? 0,
    completedBookings: rows?.completed ?? 0,
  }
}

export type CustomerRecentBooking = {
  bookingId: string
  vehicleName: string
  vendorBusinessName: string
  pickupAt: Date
  dropoffAt: Date
  pickupAddress: string
  status: string
  createdAt: Date
}

export async function getCustomerRecentBookings(
  customerUserId: string,
  limit = 10
): Promise<CustomerRecentBooking[]> {
  const rows = await db
    .select({
      bookingId: bookings.id,
      vehicleName: vehicles.name,
      vendorBusinessName: sql<string>`(SELECT business_name FROM vendor_profiles WHERE id = ${bookings.vendorId} LIMIT 1)`,
      pickupAt: bookings.pickupAt,
      dropoffAt: bookings.dropoffAt,
      pickupAddress: bookings.pickupAddress,
      status: bookings.status,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .where(eq(bookings.customerUserId, customerUserId))
    .orderBy(bookings.createdAt)
    .limit(limit)

  return rows
}

export type CustomerUpcomingBooking = {
  bookingId: string
  vehicleName: string
  vendorBusinessName: string
  pickupAt: Date
  pickupAddress: string
  status: string
}

export async function getCustomerUpcomingBookings(
  customerUserId: string,
  limit = 3
): Promise<CustomerUpcomingBooking[]> {
  const rows = await db
    .select({
      bookingId: bookings.id,
      vehicleName: vehicles.name,
      vendorBusinessName: sql<string>`(SELECT business_name FROM vendor_profiles WHERE id = ${bookings.vendorId} LIMIT 1)`,
      pickupAt: bookings.pickupAt,
      pickupAddress: bookings.pickupAddress,
      status: bookings.status,
    })
    .from(bookings)
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .where(
      and(
        eq(bookings.customerUserId, customerUserId),
        eq(bookings.status, 'CONFIRMED'),
        sql`${bookings.pickupAt} >= NOW()`
      )
    )
    .orderBy(bookings.pickupAt)
    .limit(limit)

  return rows
}
