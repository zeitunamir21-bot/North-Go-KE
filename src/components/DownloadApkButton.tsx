import { Download } from "lucide-react";
import { useState } from "react";

// Set VITE_APK_URL in .env to a real signed APK URL when the Android build is ready.
const APK_URL = (import.meta.env.VITE_APK_URL as string | undefined)?.trim() || "";

export function DownloadApkButton({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "hero" | "compact";
  className?: string;
}) {
  const [showSoon, setShowSoon] = useState(false);

  const base =
    "inline-flex items-center gap-2 rounded-xl font-semibold transition active:scale-[0.98]";
  const styles =
    variant === "hero"
      ? "h-14 px-6 text-base bg-white text-primary hover:bg-white/90"
      : variant === "compact"
        ? "h-9 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
        : "h-11 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90";

  if (APK_URL) {
    return (
      <a
        href={APK_URL}
        download
        className={`${base} ${styles} ${className}`}
        aria-label="Download the NorthGo Android app"
      >
        <Download className="h-4 w-4" />
        <span>Download App</span>
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowSoon(true)}
        className={`${base} ${styles} ${className}`}
        aria-label="Download the NorthGo Android app"
      >
        <Download className="h-4 w-4" />
        <span>Download App</span>
      </button>

      {showSoon && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setShowSoon(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card p-5 text-card-foreground shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold">Android app coming soon</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We're finishing the Android build. In the meantime, you can add NorthGo to your home
              screen from your browser's menu for a full-screen app experience.
            </p>
            <button
              type="button"
              onClick={() => setShowSoon(false)}
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
