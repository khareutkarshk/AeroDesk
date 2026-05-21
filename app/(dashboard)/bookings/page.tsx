import { AppShell } from "@/components/shared/app-shell";
import { BookingCard, type BookingCardData, type RescheduleOption } from "@/features/bookings/components/booking-card";
import { getMyBookings } from "@/features/bookings/server/queries";
import { getRescheduleOptions } from "@/features/flights/server/queries";
import type { BookingStatus, SeatClass } from "@/types/database";

export const dynamic = "force-dynamic";

type RawBooking = {
  id: string;
  flight_id: string;
  status: BookingStatus;
  total_price: number;
  pnr_code: string;
  flights:
    | {
        id: string;
        flight_no: string;
        origin: string;
        destination: string;
        departs_at: string;
        arrives_at: string;
        aircraft_type: string;
        base_price: number;
      }
    | {
        id: string;
        flight_no: string;
        origin: string;
        destination: string;
        departs_at: string;
        arrives_at: string;
        aircraft_type: string;
        base_price: number;
      }[];
  seats:
    | { id: string; seat_number: string; class: SeatClass; extra_fee: number }
    | { id: string; seat_number: string; class: SeatClass; extra_fee: number }[];
  passengers:
    | { full_name: string; nationality: string; dob: string }
    | { full_name: string; nationality: string; dob: string }[];
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: { confirmed?: string };
}) {
  const confirmedCount = Number(searchParams.confirmed ?? 0);
  const { data, error } = await getMyBookings();
  const rawBookings = (data ?? []) as unknown as RawBooking[];
  const bookings = rawBookings.map(toBookingCardData);
  const options = await Promise.all(
    bookings.map(async (booking) => {
      const result = await getRescheduleOptions(booking.flightId);
      return [booking.id, result.data as RescheduleOption[]] as const;
    }),
  );
  const optionsByBooking = new Map(options);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">Trips</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">My bookings</h1>
        </div>
        {confirmedCount > 1 ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {confirmedCount} bookings confirmed. Each passenger has a separate PNR below.
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </p>
        ) : bookings.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold">No bookings yet</h2>
            <p className="mt-2 text-sm text-slate-600">Search flights and confirm a seat to see trips here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                options={optionsByBooking.get(booking.id) ?? []}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function first<T>(value: T | T[]) {
  return Array.isArray(value) ? value[0] : value;
}

function toBookingCardData(raw: RawBooking): BookingCardData {
  const flight = first(raw.flights);
  const seat = first(raw.seats);
  const passenger = first(raw.passengers);

  return {
    id: raw.id,
    flightId: raw.flight_id,
    status: raw.status,
    pnrCode: raw.pnr_code,
    totalPrice: raw.total_price,
    passengerName: passenger?.full_name ?? "Passenger",
    flight: {
      id: flight.id,
      flightNo: flight.flight_no,
      origin: flight.origin,
      destination: flight.destination,
      departsAt: flight.departs_at,
      arrivesAt: flight.arrives_at,
      aircraftType: flight.aircraft_type,
      basePrice: flight.base_price,
    },
    seat: {
      id: seat.id,
      seatNumber: seat.seat_number,
      class: seat.class,
      extraFee: seat.extra_fee,
    },
  };
}
