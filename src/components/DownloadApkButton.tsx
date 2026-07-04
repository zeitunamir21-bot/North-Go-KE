import { Download, Share, Plus } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function DownloadApkButton({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "hero" | "compact";
  className?: string;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState<null | "ios" | "desktop">(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // Detect if already installed / running standalone
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const base =
    "inline-flex items-center gap-2 rounded-xl font-semibold transition active:scale-[0.98]";
  const styles =
    variant === "hero"
      ? "h-14 px-6 text-base bg-white text-primary hover:bg-white/90"
      : variant === "compact"
        ? "h-9 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
        : "h-11 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90";

  async function handleClick() {
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice;
      } catch {
        /* ignore */
      }
      setDeferred(null);
      return;
    }
    // No native prompt available → show manual instructions
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    setShowHelp(isIOS ? "ios" : "desktop");
  }

  if (installed) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${base} ${styles} ${className}`}
        aria-label="Install the NorthGo app"
      >
        <Download className="h-4 w-4" />
        <span>Install App</span>
      </button>

      {showHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setShowHelp(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card p-5 text-card-foreground shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold">Install NorthGo</h3>
            {showHelp === "ios" ? (
              <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">1.</span>
                  <span>
                    Tap the <Share className="inline h-4 w-4 align-text-bottom" /> Share button in
                    Safari's bottom bar.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">2.</span>
                  <span>
                    Choose <b>Add to Home Screen</b>{" "}
                    <Plus className="inline h-4 w-4 align-text-bottom" />.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">3.</span>
                  <span>Tap <b>Add</b> — NorthGo will appear as an app icon.</span>
                </li>
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Open this site in Chrome on Android (or on desktop Chrome/Edge) and use the browser
                menu → <b>Install app</b> / <b>Add to Home screen</b>.
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowHelp(null)}
              className="mt-4 h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
