"use client";

import { useFormState, useFormStatus } from "react-dom";
import { UserRound } from "lucide-react";
import { createBooking } from "@/features/bookings/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFlightStore } from "@/stores/use-flight-store";

function SubmitButton() {
  const { pending } = useFormStatus();
  const selectedSeatId = useFlightStore((state) => state.selectedSeatId);
  return (
    <Button className="w-full" disabled={pending || !selectedSeatId} type="submit">
      <UserRound className="h-4 w-4" />
      {pending ? "Confirming..." : "Confirm booking"}
    </Button>
  );
}

export function PassengerForm({ flightId, children }: { flightId: string; children: React.ReactNode }) {
  const [error, action] = useFormState(createBooking, null);
  const passenger = useFlightStore((state) => state.passenger);
  const setPassenger = useFlightStore((state) => state.setPassenger);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <input name="flightId" type="hidden" value={flightId} />
      {children}
      <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Passenger details</h2>
          <p className="text-sm text-slate-600">Passport number is submitted only to Supabase.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            required
            value={passenger.fullName}
            onChange={(event) => setPassenger({ ...passenger, fullName: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passportNo">Passport number</Label>
          <Input id="passportNo" name="passportNo" required minLength={6} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Input
            id="nationality"
            name="nationality"
            required
            value={passenger.nationality}
            onChange={(event) => setPassenger({ ...passenger, nationality: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dob">Date of birth</Label>
          <Input
            id="dob"
            name="dob"
            required
            type="date"
            value={passenger.dob}
            onChange={(event) => setPassenger({ ...passenger, dob: event.target.value })}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <SubmitButton />
      </aside>
    </form>
  );
}
