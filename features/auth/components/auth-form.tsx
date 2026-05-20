"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { initialAuthState, signIn, signUp } from "@/features/auth/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

function SubmitButton({ mode }: { mode: "signin" | "signup" }) {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
    </Button>
  );
}

export function AuthForm({ next }: { next: string }) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [toast, setToast] = useState<string | null>(null);
  const [signInState, signInAction] = useFormState(signIn, initialAuthState);
  const [signUpState, signUpAction] = useFormState(signUp, initialAuthState);

  useEffect(() => {
    if (signInState.status === "error") setToast(signInState.message);
  }, [signInState]);

  useEffect(() => {
    if (signUpState.status === "success") {
      setToast(signUpState.message);
      setActiveTab("signin");
    }
    if (signUpState.status === "error") setToast(signUpState.message);
  }, [signUpState]);

  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-2 rounded-md bg-slate-100 p-1">
        <TabButton active={activeTab === "signin"} onClick={() => setActiveTab("signin")}>
          Sign in
        </TabButton>
        <TabButton active={activeTab === "signup"} onClick={() => setActiveTab("signup")}>
          Sign up
        </TabButton>
      </div>

      {activeTab === "signin" ? (
        <form action={signInAction} className="mt-5 space-y-4">
          <input name="next" type="hidden" value={next} />
          <div>
            <h2 className="text-lg font-semibold">Welcome back</h2>
            <p className="text-sm text-slate-600">Sign in after verifying your email.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input id="signin-email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-password">Password</Label>
            <Input id="signin-password" minLength={6} name="password" type="password" required />
          </div>
          {signInState.status === "error" ? (
            <p className="text-sm text-red-600">{signInState.message}</p>
          ) : null}
          <SubmitButton mode="signin" />
        </form>
      ) : (
        <form action={signUpAction} className="mt-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Create account</h2>
            <p className="text-sm text-slate-600">We will send a verification link to your email.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input id="signup-email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input id="signup-password" minLength={6} name="password" type="password" required />
          </div>
          {signUpState.status === "error" ? (
            <p className="text-sm text-red-600">{signUpState.message}</p>
          ) : null}
          <SubmitButton mode="signup" />
        </form>
      )}

      {toast ? (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-lg">
          <div className="flex gap-3">
            <p>{toast}</p>
            <button
              className="font-medium text-teal-700"
              onClick={() => setToast(null)}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "h-9 rounded px-3 text-sm font-medium transition",
        active ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
