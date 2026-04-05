// ============================================================
// RENTNOWPK — DRIZZLE ORM SCHEMA
// Database: PostgreSQL via Supabase
// ============================================================

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  smallint,
  decimal,
  doublePrecision,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

export const userRoleEnum = pgEnum("user_role", [
  "CUSTOMER",
  "VENDOR",
  "ADMIN",
]);

export const vendorVerificationEnum = pgEnum("vendor_verification_status", [
  "PENDING_VERIFICATION",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
]);

export const driveTypeEnum = pgEnum("drive_type", [
  "WITH_DRIVER",
  "SELF_DRIVE",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "COMPLETED",
]);

export const dateBlockSourceEnum = pgEnum("date_block_source", [
  "MANUAL",
  "BOOKING",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "BOOKING",
  "MESSAGE",
  "VERIFICATION",
  "CONTACT_FLAG",
  "REVIEW",
  "SYSTEM",
]);

export const incidentTypeEnum = pgEnum("incident_type", [
  "PHONE_NUMBER",
  "EMAIL_ADDRESS",
  "EXTERNAL_APP",
  "SOCIAL_HANDLE",
]);

// ============================================================
// USERS — id matches Supabase auth.users(id)
// ============================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    phone: text("phone").unique(),
    fullName: text("full_name").notNull(),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    roleIdx: index("users_role_idx").on(t.role),
  })
);

// ============================================================
// CUSTOMER PROFILES
// ============================================================

export const customerProfiles = pgTable(
  "customer_profiles",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    cnic: text("cnic"),
    displayName: text("display_name"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index("customer_profiles_user_idx").on(t.userId),
  })
);

// ============================================================
// VENDOR PROFILES
// ============================================================

export const vendorProfiles = pgTable(
  "vendor_profiles",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    businessName: text("business_name").notNull(),
    /** URL segment for public vendor + vehicle routes; unique globally. */
    publicSlug: text("public_slug").notNull().unique(),
    whatsappPhone: text("whatsapp_phone").notNull(),

    cnicNumber: text("cnic_number"),
    cnicFrontUrl: text("cnic_front_url"),
    cnicBackUrl: text("cnic_back_url"),
    selfieUrl: text("selfie_url"),
    businessLogoUrl: text("business_logo_url"),

    /** Set when vendor completes the verification wizard; null means not yet submitted. */
    verificationSubmittedAt: timestamp("verification_submitted_at", {
      withTimezone: true,
    }),

    verificationStatus: vendorVerificationEnum("verification_status")
      .notNull()
      .default("PENDING_VERIFICATION"),
    statusNote: text("status_note"),

    avgRating: decimal("avg_rating", { precision: 3, scale: 2 })
      .notNull()
      .default("0"),
    totalReviews: integer("total_reviews").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index("vendor_profiles_user_idx").on(t.userId),
    verificationIdx: index("vendor_profiles_verification_idx").on(
      t.verificationStatus
    ),
  })
);

// ============================================================
// VEHICLES
// ============================================================

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),

    slug: text("slug").notNull(),
    name: text("name").notNull(),
    make: text("make").notNull(),
    /** Logo.dev image URL for the make (stored at create time; browser loads from Logo.dev CDN). */
    makeLogoUrl: text("make_logo_url"),
    model: text("model").notNull(),
    year: smallint("year").notNull(),

    withDriverEnabled: boolean("with_driver_enabled").notNull().default(false),
    selfDriveEnabled: boolean("self_drive_enabled").notNull().default(false),

    priceWithDriverDay: decimal("price_with_driver_day", {
      precision: 10,
      scale: 2,
    }),
    priceWithDriverMonth: decimal("price_with_driver_month", {
      precision: 10,
      scale: 2,
    }),
    priceSelfDriveDay: decimal("price_self_drive_day", {
      precision: 10,
      scale: 2,
    }),
    priceSelfDriveMonth: decimal("price_self_drive_month", {
      precision: 10,
      scale: 2,
    }),

    isActive: boolean("is_active").notNull().default(true),

    /** Primary pickup point (WGS84). Nullable for legacy rows; required on new creates in app logic. */
    pickupLatitude: doublePrecision("pickup_latitude"),
    pickupLongitude: doublePrecision("pickup_longitude"),
    pickupPlaceId: text("pickup_place_id"),
    pickupFormattedAddress: text("pickup_formatted_address"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    vendorSlugUnique: uniqueIndex("vehicles_vendor_slug_unique").on(
      t.vendorId,
      t.slug
    ),
    vendorIdx: index("vehicles_vendor_idx").on(t.vendorId),
  })
);

export const vehicleImages = pgTable(
  "vehicle_images",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),

    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isCover: boolean("is_cover").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    vehicleIdx: index("vehicle_images_vehicle_idx").on(t.vehicleId),
  })
);

export const vehicleCities = pgTable(
  "vehicle_cities",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),

    cityName: text("city_name").notNull(),
  },
  (t) => ({
    vehicleCityIdx: index("vehicle_cities_vehicle_idx").on(t.vehicleId),
  })
);

// ============================================================
// BOOKINGS
// ============================================================

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id),
    customerProfileId: uuid("customer_profile_id")
      .notNull()
      .references(() => customerProfiles.id),

    customerUserId: uuid("customer_user_id")
      .notNull()
      .references(() => users.id),
    vendorUserId: uuid("vendor_user_id")
      .notNull()
      .references(() => users.id),

    pickupAddress: text("pickup_address").notNull(),
    dropoffAddress: text("dropoff_address").notNull(),
    pickupPlaceId: text("pickup_place_id"),
    dropoffPlaceId: text("dropoff_place_id"),

    pickupAt: timestamp("pickup_at", { withTimezone: true }).notNull(),
    dropoffAt: timestamp("dropoff_at", { withTimezone: true }).notNull(),

    driveType: driveTypeEnum("drive_type").notNull(),
    distanceKm: decimal("distance_km", { precision: 10, scale: 3 }),

    status: bookingStatusEnum("status").notNull().default("PENDING"),
    note: text("note"),

    parentBookingId: uuid("parent_booking_id"),

    cancelReason: text("cancel_reason"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    vehicleIdx: index("bookings_vehicle_idx").on(t.vehicleId),
    vendorIdx: index("bookings_vendor_idx").on(t.vendorId),
    customerIdx: index("bookings_customer_profile_idx").on(t.customerProfileId),
    statusIdx: index("bookings_status_idx").on(t.status),
    parentIdx: index("bookings_parent_idx").on(t.parentBookingId),
  })
);

export const vehicleDateBlocks = pgTable(
  "vehicle_date_blocks",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),

    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    source: dateBlockSourceEnum("source").notNull().default("MANUAL"),
    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "cascade",
    }),
  },
  (t) => ({
    vehicleRangeIdx: index("vehicle_date_blocks_vehicle_range_idx").on(
      t.vehicleId,
      t.startAt,
      t.endAt
    ),
  })
);

// ============================================================
// CHAT
// ============================================================

export const chatThreads = pgTable(
  "chat_threads",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    bookingId: uuid("booking_id")
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: "cascade" }),

    customerUserId: uuid("customer_user_id")
      .notNull()
      .references(() => users.id),
    vendorUserId: uuid("vendor_user_id")
      .notNull()
      .references(() => users.id),

    flaggedForContactLeak: boolean("flagged_for_contact_leak")
      .notNull()
      .default(false),

    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    bookingIdx: index("chat_threads_booking_idx").on(t.bookingId),
  })
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => chatThreads.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),

    content: text("content").notNull(),

    blockedByContactRule: boolean("blocked_by_contact_rule")
      .notNull()
      .default(false),

    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    seenAt: timestamp("seen_at", { withTimezone: true }),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    threadCreatedIdx: index("messages_thread_created_idx").on(
      t.threadId,
      t.createdAt
    ),
    senderIdx: index("messages_sender_idx").on(t.senderId),
  })
);

// ============================================================
// REVIEWS — one per booking (customer → vendor / vehicle)
// ============================================================

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    bookingId: uuid("booking_id")
      .notNull()
      .unique()
      .references(() => bookings.id),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id),
    customerUserId: uuid("customer_user_id")
      .notNull()
      .references(() => users.id),

    rating: smallint("rating").notNull(),
    comment: text("comment"),
    vendorReply: text("vendor_reply"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    vendorIdx: index("reviews_vendor_idx").on(t.vendorId, t.createdAt),
    vehicleIdx: index("reviews_vehicle_idx").on(t.vehicleId, t.createdAt),
  })
);

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    actionUrl: text("action_url"),

    sentInApp: boolean("sent_in_app").notNull().default(false),
    sentEmail: boolean("sent_email").notNull().default(false),
    sentSms: boolean("sent_sms").notNull().default(false),

    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),

    entityType: varchar("entity_type", { length: 32 }),
    entityId: uuid("entity_id"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userReadCreatedIdx: index("notifications_user_read_created_idx").on(
      t.userId,
      t.isRead,
      t.createdAt
    ),
    entityIdx: index("notifications_entity_idx").on(t.entityType, t.entityId),
  })
);

// ============================================================
// INCIDENTS — contact leakage / moderation
// ============================================================

export const incidents = pgTable(
  "incidents",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    messageId: uuid("message_id"),

    incidentType: incidentTypeEnum("incident_type").notNull(),
    rawContent: text("raw_content").notNull(),

    isReviewed: boolean("is_reviewed").notNull().default(false),
    reviewedById: uuid("reviewed_by_id"),
    adminAction: varchar("admin_action", { length: 32 }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userIdx: index("incidents_user_idx").on(t.userId),
    reviewedCreatedIdx: index("incidents_reviewed_created_idx").on(
      t.isReviewed,
      t.createdAt
    ),
  })
);

// ============================================================
// RELATIONS
// ============================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  customerProfile: one(customerProfiles, {
    fields: [users.id],
    references: [customerProfiles.userId],
  }),
  vendorProfile: one(vendorProfiles, {
    fields: [users.id],
    references: [vendorProfiles.userId],
  }),
  sentMessages: many(messages),
  notifications: many(notifications),
  incidents: many(incidents),
}));

export const customerProfilesRelations = relations(
  customerProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [customerProfiles.userId],
      references: [users.id],
    }),
    bookings: many(bookings),
  })
);

export const vendorProfilesRelations = relations(
  vendorProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [vendorProfiles.userId],
      references: [users.id],
    }),
    vehicles: many(vehicles),
    bookings: many(bookings),
    reviewsReceived: many(reviews),
  })
);

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  vendor: one(vendorProfiles, {
    fields: [vehicles.vendorId],
    references: [vendorProfiles.id],
  }),
  images: many(vehicleImages),
  cities: many(vehicleCities),
  dateBlocks: many(vehicleDateBlocks),
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const vehicleImagesRelations = relations(vehicleImages, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleImages.vehicleId],
    references: [vehicles.id],
  }),
}));

export const vehicleCitiesRelations = relations(vehicleCities, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleCities.vehicleId],
    references: [vehicles.id],
  }),
}));

export const vehicleDateBlocksRelations = relations(
  vehicleDateBlocks,
  ({ one }) => ({
    vehicle: one(vehicles, {
      fields: [vehicleDateBlocks.vehicleId],
      references: [vehicles.id],
    }),
  })
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [bookings.vehicleId],
    references: [vehicles.id],
  }),
  vendor: one(vendorProfiles, {
    fields: [bookings.vendorId],
    references: [vendorProfiles.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [bookings.customerProfileId],
    references: [customerProfiles.id],
  }),
  customerUser: one(users, {
    fields: [bookings.customerUserId],
    references: [users.id],
  }),
  vendorUser: one(users, {
    fields: [bookings.vendorUserId],
    references: [users.id],
  }),
  chatThread: one(chatThreads, {
    fields: [bookings.id],
    references: [chatThreads.bookingId],
  }),
  reviews: many(reviews),
}));

export const chatThreadsRelations = relations(chatThreads, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [chatThreads.bookingId],
    references: [bookings.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  thread: one(chatThreads, {
    fields: [messages.threadId],
    references: [chatThreads.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  vehicle: one(vehicles, {
    fields: [reviews.vehicleId],
    references: [vehicles.id],
  }),
  vendor: one(vendorProfiles, {
    fields: [reviews.vendorId],
    references: [vendorProfiles.id],
  }),
  customerUser: one(users, {
    fields: [reviews.customerUserId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  user: one(users, {
    fields: [incidents.userId],
    references: [users.id],
  }),
}));
