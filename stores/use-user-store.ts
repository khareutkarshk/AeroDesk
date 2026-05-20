"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type CachedBooking = {
  id: string;
  pnrCode: string;
  status: "confirmed" | "rescheduled" | "cancelled";
  departsAt: string;
};

type UserStore = {
  sessionToken: string | null;
  cachedBookings: CachedBooking[];
  setSessionToken: (sessionToken: string | null) => void;
  setCachedBookings: (cachedBookings: CachedBooking[]) => void;
  resetUser: () => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      sessionToken: null,
      cachedBookings: [],
      setSessionToken: (sessionToken) => set({ sessionToken }),
      setCachedBookings: (cachedBookings) => set({ cachedBookings }),
      resetUser: () => set({ sessionToken: null, cachedBookings: [] }),
    }),
    {
      name: "aerodesk-user",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sessionToken: state.sessionToken }),
    },
  ),
);
