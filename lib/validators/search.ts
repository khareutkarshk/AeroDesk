import { z } from "zod";

export const flightSearchSchema = z.object({
  origin: z.string().min(3).max(80),
  destination: z.string().min(3).max(80),
  date: z.string().date(),
  passengers: z.coerce.number().int().min(1).max(6),
});

export type FlightSearchInput = z.infer<typeof flightSearchSchema>;
