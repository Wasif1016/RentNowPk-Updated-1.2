import { and, count, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookings, users, vehicles } from '@/lib/db/schema'

export type VendorDashboardStats = {
  totalVehicles: number
  activeVehicles: number
  pendingBookings: number
  confirmedBookings: number
  totalBookings: number
  completionRate: number
}

export async function getVendorDashboardStats(
  vendorProfileId: string
): Promise<VendorDashboardStats> {
  const [vehicleRows] = await db
    .select({
      total: count(vehicles.id),
      active: count(sql`CASE WHEN ${vehicles.isActive} = true THEN 1 END`),
    })
    .from(vehicles)
    .where(eq(vehicles.vendorId, vendorProfileId))

  const [bookingRows] = await db
    .select({
      pending: count(sql`CASE WHEN ${bookings.status} = 'PENDING' THEN 1 END`),
      confirmed: count(sql`CASE WHEN ${bookings.status} = 'CONFIRMED' THEN 1 END`),
      completed: count(sql`CASE WHEN ${bookings.status} = 'COMPLETED' THEN 1 END`),
      total: count(bookings.id),
    })
    .from(bookings)
    .where(eq(bookings.vendorId, vendorProfileId))

  const totalBookings = bookingRows?.total ?? 0
  const completed = bookingRows?.completed ?? 0
  const completionRate =
    totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0

  return {
    totalVehicles: vehicleRows?.total ?? 0,
    activeVehicles: vehicleRows?.active ?? 0,
    pendingBookings: bookingRows?.pending ?? 0,
    confirmedBookings: bookingRows?.confirmed ?? 0,
    totalBookings,
    completionRate,
  }
}

export type VendorUpcomingPickup = {
  bookingId: string
  vehicleName: string
  customerName: string
  pickupAt: Date
  status: string
  pickupAddress: string
}

export async function getVendorUpcomingPickups(
  vendorProfileId: string,
  limit = 5
): Promise<VendorUpcomingPickup[]> {
  const rows = await db
    .select({
      bookingId: bookings.id,
      vehicleName: vehicles.name,
      customerName: users.fullName,
      pickupAt: bookings.pickupAt,
      status: bookings.status,
      pickupAddress: bookings.pickupAddress,
    })
    .from(bookings)
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .innerJoin(users, eq(users.id, bookings.customerUserId))
    .where(
      and(
        eq(bookings.vendorId, vendorProfileId),
        eq(bookings.status, 'CONFIRMED'),
        sql`${bookings.pickupAt} >= NOW()`
      )
    )
    .orderBy(bookings.pickupAt)
    .limit(limit)

  return rows.map((r) => ({
    bookingId: r.bookingId,
    vehicleName: r.vehicleName,
    customerName: r.customerName ?? 'Customer',
    pickupAt: r.pickupAt,
    status: r.status,
    pickupAddress: r.pickupAddress,
  }))
}

export type VendorRecentBooking = {
  bookingId: string
  vehicleName: string
  customerName: string
  pickupAt: Date
  dropoffAt: Date
  pickupAddress: string
  status: string
  createdAt: Date
}

export async function getVendorRecentBookings(
  vendorProfileId: string,
  limit = 10
): Promise<VendorRecentBooking[]> {
  const rows = await db
    .select({
      bookingId: bookings.id,
      vehicleName: vehicles.name,
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
    .where(eq(bookings.vendorId, vendorProfileId))
    .orderBy(bookings.createdAt)
    .limit(limit)

  return rows
}
