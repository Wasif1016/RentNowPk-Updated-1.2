import { and, count, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookings, users, vendorProfiles, vehicles } from '@/lib/db/schema'

export type AdminDashboardStats = {
  totalUsers: number
  totalVendors: number
  pendingVerifications: number
  totalBookings: number
  activeBookings: number
  totalVehicles: number
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [userRows] = await db
    .select({
      total: count(users.id),
    })
    .from(users)

  const [vendorRows] = await db
    .select({
      total: count(vendorProfiles.id),
      pending: count(sql`CASE WHEN ${vendorProfiles.verificationStatus} = 'PENDING_VERIFICATION' THEN 1 END`),
    })
    .from(vendorProfiles)

  const [bookingRows] = await db
    .select({
      total: count(bookings.id),
      active: count(sql`CASE WHEN ${bookings.status} = 'CONFIRMED' THEN 1 END`),
    })
    .from(bookings)

  const [vehicleRows] = await db
    .select({
      total: count(vehicles.id),
    })
    .from(vehicles)

  return {
    totalUsers: userRows?.total ?? 0,
    totalVendors: vendorRows?.total ?? 0,
    pendingVerifications: vendorRows?.pending ?? 0,
    totalBookings: bookingRows?.total ?? 0,
    activeBookings: bookingRows?.active ?? 0,
    totalVehicles: vehicleRows?.total ?? 0,
  }
}

export type AdminPendingVendor = {
  vendorId: string
  businessName: string
  publicSlug: string
  submittedAt: Date | null
  status: string
}

export async function getAdminPendingVendors(
  limit = 5
): Promise<AdminPendingVendor[]> {
  const rows = await db
    .select({
      vendorId: vendorProfiles.id,
      businessName: vendorProfiles.businessName,
      publicSlug: vendorProfiles.publicSlug,
      submittedAt: vendorProfiles.verificationSubmittedAt,
      status: vendorProfiles.verificationStatus,
    })
    .from(vendorProfiles)
    .where(
      sql`${vendorProfiles.verificationStatus} IN ('PENDING_VERIFICATION', 'REJECTED')`
    )
    .orderBy(
      sql`CASE WHEN ${vendorProfiles.verificationStatus} = 'PENDING_VERIFICATION' THEN 0 ELSE 1 END`,
      vendorProfiles.verificationSubmittedAt
    )
    .limit(limit)

  return rows
}

export type AdminRecentBooking = {
  bookingId: string
  vehicleName: string
  customerName: string
  vendorBusinessName: string
  status: string
  createdAt: Date
}

export async function getAdminRecentBookings(
  limit = 10
): Promise<AdminRecentBooking[]> {
  const rows = await db
    .select({
      bookingId: bookings.id,
      vehicleName: vehicles.name,
      customerName: users.fullName,
      vendorBusinessName: sql<string>`(SELECT business_name FROM vendor_profiles WHERE id = ${bookings.vendorId} LIMIT 1)`,
      status: bookings.status,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(vehicles, eq(vehicles.id, bookings.vehicleId))
    .innerJoin(users, eq(users.id, bookings.customerUserId))
    .orderBy(bookings.createdAt)
    .limit(limit)

  return rows
}
