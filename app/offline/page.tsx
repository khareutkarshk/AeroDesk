export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center">
      <div className="max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold text-slate-950">You are offline</h1>
        <p className="text-sm leading-6 text-slate-600">
          Cached bookings remain available. Reconnect to search or change trips.
        </p>
      </div>
    </main>
  );
}
