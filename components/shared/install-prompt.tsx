"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function onBeforeInstallPrompt(promptEvent: Event) {
      promptEvent.preventDefault();
      setEvent(promptEvent as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (!event || dismissed) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 rounded-lg border border-slate-200 bg-white p-3 shadow-lg sm:left-auto sm:w-96">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Install AeroDesk</p>
          <p className="text-xs text-slate-600">Keep bookings available from your home screen.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
            Later
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              await event.prompt();
              setDismissed(true);
            }}
          >
            <Download className="h-4 w-4" />
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
