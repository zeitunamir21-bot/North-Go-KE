import { Download } from "lucide-react";

export function DownloadApkButton({
  variant = "default",
  className = "",
}: {
  variant?: "default" | "hero" | "compact";
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-xl font-semibold transition active:scale-[0.98]";
  const styles =
    variant === "hero"
      ? "h-14 px-6 text-base bg-white text-primary hover:bg-white/90"
      : variant === "compact"
        ? "h-9 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
        : "h-11 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90";

  return (
    <a
      href="/northgo.apk"
      download="NorthGo.apk"
      className={`${base} ${styles} ${className}`}
      aria-label="Download the NorthGo Android app (APK, 4 MB)"
    >
      <Download className="h-4 w-4" />
      <span>Download App</span>
      <span className="hidden text-[10px] font-medium opacity-70 sm:inline">APK · 3.4 MB</span>
    </a>
  );
}
