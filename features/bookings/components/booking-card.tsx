"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { CalendarClock, Plane, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cancelBooking, rescheduleBooking } from "@/features/bookings/server/actions";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { useFlightStore } from "@/stores/use-flight-store";
import type { BookingStatus, SeatClass } from "@/types/database";

export type BookingCardData = {
  id: string;
  flightId: string;
  status: BookingStatus;
  pnrCode: string;
  totalPrice: number;
  flight: {
    id: string;
    flightNo: string;
    origin: string;
    destination: string;
    departsAt: string;
    arrivesAt: string;
    aircraftType: string;
    basePrice: number;
  };
  seat: {
    id: string;
    seatNumber: string;
    class: SeatClass;
    extraFee: number;
  };
  passengerName: string;
};

export type RescheduleOption = {
  id: string;
  flight_no: string;
  origin: string;
  destination: string;
  departs_at: string;
  arrives_at: string;
  aircraft_type: string;
  base_price: number;
  seats: {
    id: string;
    flight_id: string;
    seat_number: string;
    class: SeatClass;
    extra_fee: number;
    is_available: boolean;
  }[];
};

export function BookingCard({
  booking,
  options,
}: {
  booking: BookingCardData;
  options: RescheduleOption[];
}) {
  const [status, setStatus] = useOptimistic(booking.status);
  const [message, setMessage] = useState<string | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState(options[0]?.id ?? "");
  const [selectedSeatId, setSelectedSeatId] = useState(options[0]?.seats[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const resetBooking = useFlightStore((state) => state.resetBooking);

  const selectedFlight = useMemo(
    () => options.find((option) => option.id === selectedFlightId),
    [options, selectedFlightId],
  );

  const statusVariant =
    status === "confirmed" ? "success" : status === "rescheduled" ? "warning" : "destructive";

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{booking.flight.flightNo}</h2>
            <Badge variant={statusVariant}>{status}</Badge>
            <span className="text-sm text-slate-500">PNR {booking.pnrCode}</span>
          </div>
          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <p>
              {booking.flight.origin} to {booking.flight.destination}
            </p>
            <p>{formatDateTime(booking.flight.departsAt)}</p>
            <p>
              Seat {booking.seat.seatNumber} · {booking.seat.class}
            </p>
            <p>{formatCurrency(booking.totalPrice)}</p>
          </div>
          <p className="text-sm text-slate-500">{booking.passengerName}</p>
          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
          <Button
            disabled={isPending || status === "cancelled"}
            onClick={() => {
              if (!window.confirm("Cancel this booking?")) return;
              startTransition(async () => {
                setStatus("cancelled");
                resetBooking();
                const result = await cancelBooking(booking.id);
                setMessage(result.message);
                if (!result.ok) setStatus(booking.status);
              });
            }}
            variant="destructive"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            disabled={status === "cancelled" || options.length === 0}
            onClick={() => setShowReschedule((value) => !value)}
            variant="outline"
          >
            <CalendarClock className="h-4 w-4" />
            Reschedule
          </Button>
        </div>
      </div>

      {showReschedule ? (
        <div className="mt-5 grid gap-3 rounded-md bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-800">New flight</span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3"
              value={selectedFlightId}
              onChange={(event) => {
                const nextFlight = options.find((option) => option.id === event.target.value);
                setSelectedFlightId(event.target.value);
                setSelectedSeatId(nextFlight?.seats[0]?.id ?? "");
              }}
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.flight_no} · {formatDateTime(option.departs_at)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-800">Seat</span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3"
              value={selectedSeatId}
              onChange={(event) => setSelectedSeatId(event.target.value)}
            >
              {(selectedFlight?.seats ?? []).map((seat) => (
                <option key={seat.id} value={seat.id}>
                  {seat.seat_number} · {seat.class} · +{formatCurrency(seat.extra_fee)}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={isPending || !selectedFlightId || !selectedSeatId}
            onClick={() => {
              if (!window.confirm("Reschedule to the selected flight?")) return;
              startTransition(async () => {
                setStatus("rescheduled");
                const result = await rescheduleBooking(booking.id, selectedFlightId, selectedSeatId);
                setMessage(result.message);
                if (!result.ok) setStatus(booking.status);
              });
            }}
          >
            <Plane className="h-4 w-4" />
            Apply
          </Button>
        </div>
      ) : null}
    </article>
  );
}
