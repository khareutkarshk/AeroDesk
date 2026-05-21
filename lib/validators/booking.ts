import { z } from "zod";
import { passengerSchema } from "@/lib/validators/passenger";

export const bookingPassengerSchema = passengerSchema.extend({
  seatId: z.string().uuid(),
});

export const createBookingsSchema = z.object({
  flightId: z.string().uuid(),
  passengers: z.array(bookingPassengerSchema).min(1).max(6),
});

export type BookingPassengerInput = z.infer<typeof bookingPassengerSchema>;
