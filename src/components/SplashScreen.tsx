import { useEffect, useState } from "react";

export function SplashScreen({ onFinished }: { onFinished?: () => void }) {
  const [phase, setPhase] = useState<"enter" | "settle" | "exit" | "done">("enter");

  useEffect(() => {
    const settleTimer = window.setTimeout(() => setPhase("settle"), 300);
    const exitTimer = window.setTimeout(() => setPhase("exit"), 1400);
    const doneTimer = window.setTimeout(() => {
      setPhase("done");
      onFinished?.();
    }, 2000);

    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onFinished]);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden={phase === "exit"}
      className={[
        "fixed inset-0 z-[100] flex flex-col items-center justify-center",
        "bg-[#DC2626] transition-opacity duration-700 ease-out",
        phase === "enter" ? "opacity-0" : "",
        phase === "settle" ? "opacity-100" : "",
        phase === "exit" ? "pointer-events-none opacity-0" : "",
      ].join(" ")}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white shadow-2xl">
          <span className="text-6xl font-bold text-[#DC2626]">N</span>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">NorthGo</h1>
          <p className="mt-1 text-sm font-medium text-white/90">Isiolo ⇄ Nairobi</p>
        </div>
      </div>
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <div className="h-1 w-24 overflow-hidden rounded-full bg-white/30">
          <div className="h-full w-full origin-left animate-[shrink_1.1s_linear_forwards] bg-white" />
        </div>
      </div>
    </div>
  );
}
