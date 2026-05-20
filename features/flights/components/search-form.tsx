"use client";

import { useRouter } from "next/navigation";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlaneTakeoff, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { flightSearchSchema, type FlightSearchInput } from "@/lib/validators/search";
import { useFlightStore } from "@/stores/use-flight-store";

export function SearchForm({ defaults }: { defaults?: Partial<FlightSearchInput> }) {
  const router = useRouter();
  const setSearchQuery = useFlightStore((state) => state.setSearchQuery);
  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FlightSearchInput>({
    resolver: zodResolver(flightSearchSchema) as unknown as Resolver<FlightSearchInput>,
    defaultValues: {
      origin: defaults?.origin ?? "Delhi",
      destination: defaults?.destination ?? "Mumbai",
      date: defaults?.date ?? today,
      passengers: defaults?.passengers ?? 1,
    },
  });

  function onSubmit(values: FlightSearchInput) {
    setSearchQuery(values);
    const params = new URLSearchParams({
      origin: values.origin,
      destination: values.destination,
      date: values.date,
      passengers: String(values.passengers),
    });
    router.push(`/flights?${params.toString()}`);
  }

  return (
    <form
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_160px_120px_auto]"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-2">
        <Label htmlFor="origin">Origin</Label>
        <Input id="origin" autoComplete="address-level2" {...register("origin")} />
        {errors.origin ? <p className="text-xs text-red-600">{errors.origin.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="destination">Destination</Label>
        <Input id="destination" autoComplete="address-level2" {...register("destination")} />
        {errors.destination ? (
          <p className="text-xs text-red-600">{errors.destination.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" min={today} type="date" {...register("date")} />
        {errors.date ? <p className="text-xs text-red-600">{errors.date.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="passengers">Passengers</Label>
        <Input id="passengers" min={1} max={6} type="number" {...register("passengers")} />
      </div>
      <div className="flex items-end">
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? <PlaneTakeoff className="h-4 w-4 animate-pulse" /> : <Search className="h-4 w-4" />}
          Search
        </Button>
      </div>
    </form>
  );
}
