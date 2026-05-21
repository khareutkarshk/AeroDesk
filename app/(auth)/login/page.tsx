import { AuthForm } from "@/features/auth/components/auth-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; verified?: string; error?: string };
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">AeroDesk</p>
          <h1 className="text-3xl font-semibold tracking-tight">Manage your trip</h1>
        </div>
        <AuthForm
          next={searchParams.next ?? "/search"}
          verified={searchParams.verified === "1"}
          verificationError={searchParams.error === "verification"}
        />
      </div>
    </main>
  );
}
