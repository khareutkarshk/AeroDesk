import { AppShell } from "@/components/shared/app-shell";
import { SearchForm } from "@/features/flights/components/search-form";

export default function SearchPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">Search</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Find your next flight</h1>
        </div>
        <SearchForm />
      </div>
    </AppShell>
  );
}
