"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBookingsSchema } from "@/lib/validators/booking";

function parsePassengers(formData: FormData, passengerCount: number) {
  const passengers = [];
  for (let index = 0; index < passengerCount; index += 1) {
    passengers.push({
      seatId: formData.get(`passengers[${index}][seatId]`),
      fullName: formData.get(`passengers[${index}][fullName]`),
      passportNo: formData.get(`passengers[${index}][passportNo]`),
      nationality: formData.get(`passengers[${index}][nationality]`),
      dob: formData.get(`passengers[${index}][dob]`),
    });
  }
  return passengers;
}

export async function createBooking(_prevState: string | null, formData: FormData) {
  const flightId = String(formData.get("flightId") ?? "");
  const passengerCount = Number(formData.get("passengerCount") ?? 1);
  const parsed = createBookingsSchema.safeParse({
    flightId,
    passengers: parsePassengers(formData, passengerCount),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Booking details are invalid.";
  }

  const { passengers } = parsed.data;
  const seatIds = passengers.map((entry) => entry.seatId);
  if (new Set(seatIds).size !== seatIds.length) {
    return "Each passenger must have a different seat.";
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/checkout?flightId=${flightId}&passengers=${passengers.length}`);

  const { data, error } = await supabase.rpc("reserve_seats", {
    p_flight_id: flightId,
    p_bookings: passengers.map((entry) => ({
      seat_id: entry.seatId,
      full_name: entry.fullName,
      passport_no: entry.passportNo,
      nationality: entry.nationality,
      dob: entry.dob,
    })),
  });

  if (error) return error.message;
  if (!data?.length) return "Booking could not be created.";

  revalidatePath("/bookings");

  if (data.length === 1) {
    redirect(`/confirmation?bookingId=${data[0].booking_id}`);
  }

  redirect(`/bookings?confirmed=${data.length}`);
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
