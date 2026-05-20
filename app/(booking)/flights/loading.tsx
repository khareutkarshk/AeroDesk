import { AppShell } from "@/components/shared/app-shell";

export default function LoadingFlights() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div className="h-9 w-56 animate-pulse rounded bg-slate-200" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
    </AppShell>
  );
}
