import { AppShell } from "@/components/shared/app-shell";
import { SearchForm } from "@/features/flights/components/search-form";
import { FlightCard } from "@/features/flights/components/flight-card";
import { searchFlights } from "@/features/flights/server/queries";
import { flightSearchSchema } from "@/lib/validators/search";

export const dynamic = "force-dynamic";

export default async function FlightsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const parsed = flightSearchSchema.safeParse({
    origin: searchParams.origin,
    destination: searchParams.destination,
    date: searchParams.date,
    passengers: searchParams.passengers,
  });

  if (!parsed.success) {
    return (
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold tracking-tight">Search flights</h1>
          <SearchForm />
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Enter a route, date, and passenger count to see matching flights.
          </p>
        </div>
      </AppShell>
    );
  }

  const { data, error } = await searchFlights(parsed.data);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Available flights</h1>
          <SearchForm defaults={parsed.data} />
        </div>
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </p>
        ) : data.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold">No flights found</h2>
            <p className="mt-2 text-sm text-slate-600">Try another date or route.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((flight) => (
              <FlightCard key={flight.id} flight={flight} passengers={parsed.data.passengers} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
