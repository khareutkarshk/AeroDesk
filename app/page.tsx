import Link from "next/link";
import { Plane, TicketCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Plane className="h-5 w-5 text-teal-700" />
            AeroDesk
          </div>
          <Link className="text-sm font-medium text-teal-800" href="/bookings">
            My bookings
          </Link>
        </nav>

        <section className="grid flex-1 place-items-center py-12">
          <div className="max-w-2xl space-y-6 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">
              Flight Management PWA
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Search, select seats, and manage trips with confidence.
            </h1>
            <p className="mx-auto max-w-xl text-base leading-7 text-slate-600">
              Production-style Next.js, Supabase, Zustand, and PWA foundation for
              the internship assignment.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800"
                href="/search"
              >
                <Plane className="h-4 w-4" />
                Search flights
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                href="/bookings"
              >
                <TicketCheck className="h-4 w-4" />
                View bookings
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
