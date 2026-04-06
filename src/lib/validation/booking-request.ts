import { z } from 'zod'

const placeId = z.string().min(1).max(512)
const uuid = z.string().uuid()

export const BookingRequestSchema = z
  .object({
    vehicleId: uuid,
    pickupPlaceId: placeId,
    dropoffPlaceId: placeId,
    pickupAddress: z.string().min(1, 'Select a pickup location'),
    dropoffAddress: z.string().min(1, 'Select a drop-off location'),
    pickupAt: z.string().min(1),
    dropoffAt: z.string().min(1),
    driveType: z.enum(['WITH_DRIVER', 'SELF_DRIVE']),
    fullName: z.string().trim().min(2).max(200),
    cnic: z
      .string()
      .trim()
      .regex(/^\d{13}$/, 'CNIC must be 13 digits.'),
    note: z.string().trim().max(2000).optional().default(''),
  })
  .superRefine((data, ctx) => {
    const a = new Date(data.pickupAt)
    const b = new Date(data.dropoffAt)
    if (Number.isNaN(a.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Invalid pickup date.', path: ['pickupAt'] })
    }
    if (Number.isNaN(b.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Invalid drop-off date.', path: ['dropoffAt'] })
    }
    if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) && b <= a) {
      ctx.addIssue({
        code: 'custom',
        message: 'Drop-off must be after pickup.',
        path: ['dropoffAt'],
      })
    }
  })

export type BookingRequestInput = z.infer<typeof BookingRequestSchema>
