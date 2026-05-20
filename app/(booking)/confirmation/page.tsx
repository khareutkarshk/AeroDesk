import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/shared/app-shell";
import { Button } from "@/components/ui/button";
import { getBooking } from "@/features/bookings/server/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: { bookingId?: string };
}) {
  if (!searchParams.bookingId) {
    return (
      <AppShell>
        <EmptyConfirmation />
      </AppShell>
    );
  }
  const { data, error } = await getBooking(searchParams.bookingId);
  if (error || !data) {
    return (
      <AppShell>
        <EmptyConfirmation />
      </AppShell>
    );
  }

  const flight = Array.isArray(data.flights) ? data.flights[0] : data.flights;
  const seat = Array.isArray(data.seats) ? data.seats[0] : data.seats;
  const passenger = Array.isArray(data.passengers) ? data.passengers[0] : data.passengers;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg border border-emerald-200 bg-white p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Booking confirmed</h1>
          <p className="mt-2 text-sm text-slate-600">PNR {data.pnr_code}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Passenger" value={passenger?.full_name ?? "Passenger"} />
            <Info label="Flight" value={flight?.flight_no ?? "-"} />
            <Info label="Route" value={`${flight?.origin ?? "-"} to ${flight?.destination ?? "-"}`} />
            <Info label="Departure" value={flight ? formatDateTime(flight.departs_at) : "-"} />
            <Info label="Seat" value={seat ? `${seat.seat_number} · ${seat.class}` : "-"} />
            <Info label="Total" value={formatCurrency(data.total_price)} />
          </dl>
        </div>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/bookings">My bookings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">Book another</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function EmptyConfirmation() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
      <h1 className="text-2xl font-semibold">No confirmation found</h1>
      <p className="mt-2 text-sm text-slate-600">Open a confirmed booking from your trips.</p>
      <Button asChild className="mt-5">
        <Link href="/bookings">My bookings</Link>
      </Button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-950">{value}</dd>
    </div>
  );
}
