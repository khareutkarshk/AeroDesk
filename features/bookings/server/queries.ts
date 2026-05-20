import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getBooking(bookingId: string) {
  noStore();

  return createClient()
    .from("bookings")
    .select(
      "id, status, booked_at, total_price, pnr_code, flights(id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type), seats(id, seat_number, class, extra_fee), passengers(full_name, nationality, dob)",
    )
    .eq("id", bookingId)
    .single();
}

export async function getMyBookings() {
  noStore();

  return createClient()
    .from("bookings")
    .select(
      "id, flight_id, seat_id, status, booked_at, total_price, pnr_code, flights(id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, base_price), seats(id, seat_number, class, extra_fee), passengers(full_name, nationality, dob)",
    )
    .order("booked_at", { ascending: false });
}
