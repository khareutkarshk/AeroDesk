"use client";

import { Button } from "@/components/ui/button";

export default function FlightsError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Could not load flights</h1>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
