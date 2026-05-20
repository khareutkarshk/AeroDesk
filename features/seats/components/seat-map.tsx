"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import { useFlightStore } from "@/stores/use-flight-store";
import type { Database, SeatClass } from "@/types/database";

type Seat = Pick<
  Database["public"]["Tables"]["seats"]["Row"],
  "id" | "flight_id" | "seat_number" | "class" | "is_available" | "extra_fee"
>;

const classLabel: Record<SeatClass, string> = {
  first: "First",
  business: "Business",
  economy: "Economy",
};

const classOrder: SeatClass[] = ["first", "business", "economy"];

export function SeatMap({
  initialSeats,
  flightId,
  currentSeatId,
}: {
  initialSeats: Seat[];
  flightId: string;
  currentSeatId?: string;
}) {
  const [seats, setSeats] = useState(initialSeats);
  const [isPending, startTransition] = useTransition();
  const selectedSeatId = useFlightStore((state) => state.selectedSeatId);
  const selectSeat = useFlightStore((state) => state.selectSeatOptimistic);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`seats:${flightId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "seats", filter: `flight_id=eq.${flightId}` },
        (payload) => {
          const updated = payload.new as Seat;
          setSeats((current) => current.map((seat) => (seat.id === updated.id ? updated : seat)));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [flightId]);

  const seatsByClass = useMemo(
    () =>
      classOrder.map((seatClass) => ({
        seatClass,
        rows: seats
          .filter((seat) => seat.class === seatClass)
          .reduce<Record<string, Seat[]>>((acc, seat) => {
            const row = seat.seat_number.replace(/[A-F]$/, "");
            acc[row] = [...(acc[row] ?? []), seat].sort((a, b) =>
              a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true }),
            );
            return acc;
          }, {}),
      })),
    [seats],
  );

  const selected = seats.find((seat) => seat.id === selectedSeatId);

  return (
    <div className="space-y-5">
      <input name="seatId" type="hidden" value={selectedSeatId ?? ""} />
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-600">
          <Legend color="bg-white border-slate-300" label="Available" />
          <Legend color="bg-teal-700 border-teal-700" label="Selected" />
          <Legend color="bg-slate-300 border-slate-300" label="Occupied" />
          <Legend color="bg-amber-500 border-amber-500" label="Your seat" />
        </div>
        <div className="max-h-[520px] overflow-auto rounded-md bg-slate-50 p-3">
          <div className="mx-auto w-max min-w-[320px] space-y-6">
            {seatsByClass.map(({ seatClass, rows }) => (
              <section key={seatClass} className="space-y-2">
                <div className="sticky top-0 z-10 bg-slate-50 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {classLabel[seatClass]}
                </div>
                <div className="space-y-2">
                  {Object.entries(rows).map(([row, rowSeats]) => (
                    <div key={row} className="grid grid-cols-[24px_repeat(3,40px)_24px_repeat(3,40px)] items-center gap-2">
                      <span className="text-xs text-slate-500">{row}</span>
                      {rowSeats.map((seat, index) => (
                        <SeatButton
                          key={seat.id}
                          isCurrent={seat.id === currentSeatId}
                          isSelected={seat.id === selectedSeatId}
                          isTransitioning={isPending}
                          seat={seat}
                          onSelect={() => {
                            startTransition(() => selectSeat(seat.id));
                          }}
                          withAisle={index === 3}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
      {selected ? (
        <p className="text-sm text-slate-700">
          Selected {selected.seat_number} · {classLabel[selected.class]} · Extra fee{" "}
          {formatCurrency(selected.extra_fee)}
        </p>
      ) : (
        <p className="text-sm text-slate-500">Select one available seat to continue.</p>
      )}
    </div>
  );
}

function SeatButton({
  seat,
  isSelected,
  isCurrent,
  isTransitioning,
  withAisle,
  onSelect,
}: {
  seat: Seat;
  isSelected: boolean;
  isCurrent: boolean;
  isTransitioning: boolean;
  withAisle: boolean;
  onSelect: () => void;
}) {
  const disabled = !seat.is_available && !isCurrent;

  return (
    <>
      {withAisle ? <span aria-hidden className="w-6" /> : null}
      <button
        aria-label={`${seat.seat_number} ${seat.class} ${disabled ? "occupied" : "available"}`}
        className={cn(
          "h-10 w-10 rounded-md border text-xs font-semibold shadow-sm transition active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700",
          seat.is_available && "border-slate-300 bg-white text-slate-700 hover:border-teal-700",
          disabled && "cursor-not-allowed border-slate-300 bg-slate-300 text-slate-500",
          isSelected && "border-teal-700 bg-teal-700 text-white",
          isCurrent && "border-amber-500 bg-amber-500 text-white",
          isTransitioning && isSelected && "scale-95",
        )}
        disabled={disabled}
        onClick={onSelect}
        title={`${seat.class} · ${formatCurrency(seat.extra_fee)}`}
        type="button"
      >
        {seat.seat_number.replace(/^\d+/, "")}
      </button>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded border", color)} />
      {label}
    </span>
  );
}
