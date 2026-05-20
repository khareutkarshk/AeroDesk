import Link from "next/link";
import { Plane, TicketCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { AuthNav } from "@/components/shared/auth-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2 font-semibold" href="/">
            <Plane className="h-5 w-5 text-teal-700" />
            AeroDesk
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/search">Search</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/bookings">
                <TicketCheck className="h-4 w-4" />
                Bookings
              </Link>
            </Button>
            <AuthNav />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <InstallPrompt />
    </div>
  );
}
