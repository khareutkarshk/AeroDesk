"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { passengerSchema } from "@/lib/validators/passenger";

export async function createBooking(_prevState: string | null, formData: FormData) {
  const flightId = String(formData.get("flightId") ?? "");
  const seatId = String(formData.get("seatId") ?? "");
  const parsed = passengerSchema.safeParse({
    fullName: formData.get("fullName"),
    passportNo: formData.get("passportNo"),
    nationality: formData.get("nationality"),
    dob: formData.get("dob"),
  });

  if (!flightId || !seatId) return "Select an available seat.";
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Passenger details are invalid.";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/checkout?flightId=${flightId}`);

  const { data, error } = await supabase.rpc("reserve_seat", {
    p_flight_id: flightId,
    p_seat_id: seatId,
    p_passenger_full_name: parsed.data.fullName,
    p_passport_no: parsed.data.passportNo,
    p_nationality: parsed.data.nationality,
    p_dob: parsed.data.dob,
  });

  if (error) return error.message;
  const booking = data.at(0);
  if (!booking) return "Booking could not be created.";

  revalidatePath("/bookings");
  redirect(`/confirmation?bookingId=${booking.booking_id}`);
}

export async function cancelBooking(bookingId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("cancel_booking", { p_booking_id: bookingId });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/bookings");
  return { ok: true, message: "Booking cancelled." };
}

export async function rescheduleBooking(bookingId: string, flightId: string, seatId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("reschedule_booking", {
    p_booking_id: bookingId,
    p_new_flight_id: flightId,
    p_new_seat_id: seatId,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/bookings");
  return { ok: true, message: "Booking rescheduled." };
}
