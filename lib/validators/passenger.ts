import { z } from "zod";

export const passengerSchema = z.object({
  fullName: z.string().min(2).max(120),
  passportNo: z.string().min(6).max(20),
  nationality: z.string().min(2).max(80),
  dob: z.string().date(),
});

export type PassengerInput = z.infer<typeof passengerSchema>;
