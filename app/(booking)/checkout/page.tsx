import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { Button } from "@/components/ui/button";
import { PassengerForm } from "@/features/bookings/components/passenger-form";
import { getFlight } from "@/features/flights/server/queries";
import { SeatMap } from "@/features/seats/components/seat-map";
import { getSeatMap } from "@/features/seats/server/queries";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

function parsePassengerCount(value?: string) {
  const count = Number(value ?? 1);
  if (!Number.isInteger(count) || count < 1) return 1;
  return Math.min(count, 6);
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { flightId?: string; passengers?: string };
}) {
  const passengerCount = parsePassengerCount(searchParams.passengers);
  if (!searchParams.flightId) {
    return (
      <AppShell>
        <EmptyCheckout />
      </AppShell>
    );
  }

  const [flightResult, seatResult] = await Promise.all([
    getFlight(searchParams.flightId),
    getSeatMap(searchParams.flightId),
  ]);

  if (flightResult.error || !flightResult.data) {
    return (
      <AppShell>
        <EmptyCheckout />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">Checkout</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Choose {passengerCount === 1 ? "your seat" : `your ${passengerCount} seats`}
          </h1>
        </div>
        <PassengerForm
          flightId={flightResult.data.id}
          passengerCount={passengerCount}
          seats={seatResult.data ?? []}
        >
          <section className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{flightResult.data.flight_no}</p>
                  <p className="text-sm text-slate-600">
                    {flightResult.data.origin} to {flightResult.data.destination}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatDateTime(flightResult.data.departs_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Base fare</p>
                  <p className="text-xl font-semibold">{formatCurrency(flightResult.data.base_price)}</p>
                </div>
              </div>
            </div>
            {seatResult.error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {seatResult.error.message}
              </p>
            ) : (
              <SeatMap
                flightId={flightResult.data.id}
                initialSeats={seatResult.data ?? []}
                passengerCount={passengerCount}
              />
            )}
          </section>
        </PassengerForm>
      </div>
    </AppShell>
  );
}

function EmptyCheckout() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
      <h1 className="text-2xl font-semibold">Select a flight first</h1>
      <p className="mt-2 text-sm text-slate-600">Choose a flight before opening checkout.</p>
      <Button asChild className="mt-5">
        <Link href="/search">Search flights</Link>
      </Button>
    </div>
  );
}
