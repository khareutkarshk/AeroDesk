"use client";

import { useFormState, useFormStatus } from "react-dom";
import { UserRound } from "lucide-react";
import { createBooking } from "@/features/bookings/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils/format";
import { useFlightStore } from "@/stores/use-flight-store";
import type { Database, SeatClass } from "@/types/database";

type Seat = Pick<
  Database["public"]["Tables"]["seats"]["Row"],
  "id" | "seat_number" | "class" | "extra_fee"
>;

const classLabel: Record<SeatClass, string> = {
  first: "First",
  business: "Business",
  economy: "Economy",
};

function SubmitButton({ passengerCount }: { passengerCount: number }) {
  const { pending } = useFormStatus();
  const selectedSeatIds = useFlightStore((state) => state.selectedSeatIds);
  const ready = selectedSeatIds.length === passengerCount;
  const label =
    passengerCount === 1
      ? "Confirm booking"
      : `Confirm ${passengerCount} bookings`;

  return (
    <Button className="w-full" disabled={pending || !ready} type="submit">
      <UserRound className="h-4 w-4" />
      {pending ? "Confirming..." : label}
    </Button>
  );
}

export function PassengerForm({
  flightId,
  passengerCount,
  seats,
  children,
}: {
  flightId: string;
  passengerCount: number;
  seats: Seat[];
  children: React.ReactNode;
}) {
  const [error, action] = useFormState(createBooking, null);
  const selectedSeatIds = useFlightStore((state) => state.selectedSeatIds);
  const passenger = useFlightStore((state) => state.passenger);
  const setPassenger = useFlightStore((state) => state.setPassenger);

  const selectedSeats = selectedSeatIds
    .map((id) => seats.find((seat) => seat.id === id))
    .filter((seat): seat is Seat => Boolean(seat));

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <input name="flightId" type="hidden" value={flightId} />
      <input name="passengerCount" type="hidden" value={passengerCount} />
      {children}
      <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Passenger details</h2>
          <p className="text-sm text-slate-600">
            One form per selected seat. Passport numbers are submitted only to Supabase.
          </p>
        </div>
        {selectedSeats.length === 0 ? (
          <p className="text-sm text-slate-500">
            Select {passengerCount} seat{passengerCount === 1 ? "" : "s"} on the map first.
          </p>
        ) : (
          selectedSeats.map((seat, index) => (
            <fieldset
              key={seat.id}
              className="space-y-3 rounded-md border border-slate-100 bg-slate-50 p-4"
            >
              <legend className="px-1 text-sm font-semibold text-slate-950">
                Passenger {index + 1} · Seat {seat.seat_number} ({classLabel[seat.class]},{" "}
                {formatCurrency(seat.extra_fee)} extra)
              </legend>
              <input name={`passengers[${index}][seatId]`} type="hidden" value={seat.id} />
              <div className="space-y-2">
                <Label htmlFor={`fullName-${index}`}>Full name</Label>
                <Input
                  id={`fullName-${index}`}
                  name={`passengers[${index}][fullName]`}
                  required
                  defaultValue={index === 0 ? passenger.fullName : ""}
                  onChange={
                    index === 0
                      ? (event) => setPassenger({ ...passenger, fullName: event.target.value })
                      : undefined
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`passportNo-${index}`}>Passport number</Label>
                <Input
                  id={`passportNo-${index}`}
                  name={`passengers[${index}][passportNo]`}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`nationality-${index}`}>Nationality</Label>
                <Input
                  id={`nationality-${index}`}
                  name={`passengers[${index}][nationality]`}
                  required
                  defaultValue={index === 0 ? passenger.nationality : ""}
                  onChange={
                    index === 0
                      ? (event) => setPassenger({ ...passenger, nationality: event.target.value })
                      : undefined
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`dob-${index}`}>Date of birth</Label>
                <Input
                  id={`dob-${index}`}
                  name={`passengers[${index}][dob]`}
                  required
                  type="date"
                  defaultValue={index === 0 ? passenger.dob : ""}
                  onChange={
                    index === 0
                      ? (event) => setPassenger({ ...passenger, dob: event.target.value })
                      : undefined
                  }
                />
              </div>
            </fieldset>
          ))
        )}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <SubmitButton passengerCount={passengerCount} />
      </aside>
    </form>
  );
}
