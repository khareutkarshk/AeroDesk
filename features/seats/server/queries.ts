import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getSeatMap(flightId: string) {
  noStore();

  return createClient()
    .from("seats")
    .select("id, flight_id, seat_number, class, is_available, extra_fee")
    .eq("flight_id", flightId)
    .order("seat_number", { ascending: true });
}
