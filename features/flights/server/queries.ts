import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FlightSearchInput } from "@/lib/validators/search";

export async function searchFlights(input: FlightSearchInput) {
  noStore();

  const supabase = createClient();
  const start = `${input.date}T00:00:00.000Z`;
  const end = `${input.date}T23:59:59.999Z`;

  return supabase
    .from("flights")
    .select("id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price")
    .eq("origin", input.origin)
    .eq("destination", input.destination)
    .eq("status", "scheduled")
    .gte("departs_at", start)
    .lte("departs_at", end)
    .order("departs_at", { ascending: true });
}

export async function getFlight(flightId: string) {
  noStore();

  return createClient()
    .from("flights")
    .select("id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price")
    .eq("id", flightId)
    .single();
}

export async function getAlternativeFlights(flightId: string) {
  noStore();
  const supabase = createClient();
  const { data: current, error } = await supabase
    .from("flights")
    .select("id, origin, destination, departs_at")
    .eq("id", flightId)
    .single();

  if (error || !current) return { data: [], error };

  return supabase
    .from("flights")
    .select("id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price")
    .eq("origin", current.origin)
    .eq("destination", current.destination)
    .eq("status", "scheduled")
    .neq("id", current.id)
    .gte("departs_at", new Date().toISOString())
    .order("departs_at", { ascending: true });
}

export async function getRescheduleOptions(flightId: string) {
  noStore();
  const supabase = createClient();
  const alternatives = await getAlternativeFlights(flightId);
  const flights = alternatives.data ?? [];
  const flightIds = flights.map((flight) => flight.id);

  if (flightIds.length === 0) return { data: [], error: alternatives.error };

  const seats = await supabase
    .from("seats")
    .select("id, flight_id, seat_number, class, extra_fee, is_available")
    .in("flight_id", flightIds)
    .eq("is_available", true)
    .order("seat_number", { ascending: true });

  if (seats.error) return { data: [], error: seats.error };

  return {
    data: flights.map((flight) => ({
      ...flight,
      seats: (seats.data ?? []).filter((seat) => seat.flight_id === flight.id).slice(0, 12),
    })),
    error: null,
  };
}
