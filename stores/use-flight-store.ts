"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FlightSearchInput } from "@/lib/validators/search";

type PassengerDraft = {
  fullName: string;
  nationality: string;
  dob: string;
};

type BookingStep = "search" | "flight" | "seat" | "passenger" | "confirm";

type FlightStore = {
  searchQuery: Partial<FlightSearchInput>;
  selectedFlightId: string | null;
  selectedSeatIds: string[];
  step: BookingStep;
  passenger: PassengerDraft;
  setSearchQuery: (query: Partial<FlightSearchInput>) => void;
  selectFlight: (flightId: string) => void;
  toggleSeat: (seatId: string, maxSeats: number) => void;
  clearSeats: () => void;
  setPassenger: (passenger: PassengerDraft) => void;
  setStep: (step: BookingStep) => void;
  resetBooking: () => void;
};

const initialState = {
  searchQuery: {},
  selectedFlightId: null,
  selectedSeatIds: [] as string[],
  step: "search" as const,
  passenger: { fullName: "", nationality: "", dob: "" },
};

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      ...initialState,
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      selectFlight: (selectedFlightId) =>
        set({ selectedFlightId, selectedSeatIds: [], step: "seat" }),
      toggleSeat: (seatId, maxSeats) =>
        set((state) => {
          const selected = state.selectedSeatIds ?? [];
          if (selected.includes(seatId)) {
            return { selectedSeatIds: selected.filter((id) => id !== seatId) };
          }
          if (selected.length >= maxSeats) return state;
          return { selectedSeatIds: [...selected, seatId] };
        }),
      clearSeats: () => set({ selectedSeatIds: [] }),
      setPassenger: (passenger) => set({ passenger }),
      setStep: (step) => set({ step }),
      resetBooking: () => set(initialState),
    }),
    {
      name: "aerodesk-flight",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlightId: state.selectedFlightId,
        selectedSeatIds: state.selectedSeatIds,
        step: state.step,
        passenger: state.passenger,
      }),
    },
  ),
);

export const selectBookingProgress = (state: FlightStore) => ({
  selectedFlightId: state.selectedFlightId,
  selectedSeatIds: state.selectedSeatIds,
  step: state.step,
});
