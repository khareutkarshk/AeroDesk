import Link from "next/link";
import { Clock, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateTime, formatDuration, getDurationMinutes } from "@/lib/utils/format";
import type { Database } from "@/types/database";

type Flight = Pick<
  Database["public"]["Tables"]["flights"]["Row"],
  "id" | "flight_no" | "origin" | "destination" | "departs_at" | "arrives_at" | "aircraft_type" | "base_price"
>;

export function FlightCard({ flight, passengers }: { flight: Flight; passengers: number }) {
  const duration = formatDuration(getDurationMinutes(flight.departs_at, flight.arrives_at));

  return (
    <Card>
      <CardContent className="p-5">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-950">{flight.flight_no}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                {flight.aircraft_type}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div>
                <p className="text-sm text-slate-500">{flight.origin}</p>
                <p className="font-medium">{formatDateTime(flight.departs_at)}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                {duration}
              </div>
              <div className="sm:text-right">
                <p className="text-sm text-slate-500">{flight.destination}</p>
                <p className="font-medium">{formatDateTime(flight.arrives_at)}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 md:min-w-44 md:text-right">
            <p className="text-sm text-slate-500">From</p>
            <p className="text-2xl font-semibold">{formatCurrency(flight.base_price * passengers)}</p>
            <Button asChild className="w-full">
              <Link href={`/checkout?flightId=${flight.id}&passengers=${passengers}`}>
                <Plane className="h-4 w-4" />
                Select seats
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
