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
  selectedSeatId: string | null;
  step: BookingStep;
  passenger: PassengerDraft;
  setSearchQuery: (query: Partial<FlightSearchInput>) => void;
  selectFlight: (flightId: string) => void;
  selectSeatOptimistic: (seatId: string) => void;
  setPassenger: (passenger: PassengerDraft) => void;
  setStep: (step: BookingStep) => void;
  resetBooking: () => void;
};

const initialState = {
  searchQuery: {},
  selectedFlightId: null,
  selectedSeatId: null,
  step: "search" as const,
  passenger: { fullName: "", nationality: "", dob: "" },
};

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      ...initialState,
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      selectFlight: (selectedFlightId) => set({ selectedFlightId, step: "seat" }),
      selectSeatOptimistic: (selectedSeatId) => set({ selectedSeatId }),
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
        selectedSeatId: state.selectedSeatId,
        step: state.step,
        passenger: state.passenger,
      }),
    },
  ),
);

export const selectBookingProgress = (state: FlightStore) => ({
  selectedFlightId: state.selectedFlightId,
  selectedSeatId: state.selectedSeatId,
  step: state.step,
});
