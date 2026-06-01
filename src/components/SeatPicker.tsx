import { cn } from "@/lib/utils";
import { CircleDot } from "lucide-react";

export function SeatPicker({
  totalSeats,
  taken,
  selected,
  onToggle,
  maxSelect,
}: {
  totalSeats: number;
  taken: number[];
  selected: number[];
  onToggle: (seat: number) => void;
  maxSelect: number;
}) {
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1);

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      {/* Driver row */}
      <div className="mb-4 flex items-center justify-between border-b border-dashed border-border pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <CircleDot className="h-4 w-4" />
          Driver
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Front of vehicle
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:gap-x-12">
        {seats.map((n) => {
          const isTaken = taken.includes(n);
          const isSelected = selected.includes(n);
          const atMax = selected.length >= maxSelect && !isSelected;
          const disabled = isTaken || atMax;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(n)}
              aria-pressed={isSelected}
              aria-label={`Seat ${n}${isTaken ? " (taken)" : ""}`}
              className={cn(
                "relative h-14 rounded-xl border-2 text-sm font-bold transition",
                "flex flex-col items-center justify-center gap-0.5",
                isTaken &&
                  "cursor-not-allowed border-border bg-muted text-muted-foreground line-through",
                !isTaken &&
                  isSelected &&
                  "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-elevated)] scale-[1.02]",
                !isTaken &&
                  !isSelected &&
                  !atMax &&
                  "border-border bg-card text-foreground hover:border-primary hover:bg-accent",
                !isTaken &&
                  !isSelected &&
                  atMax &&
                  "cursor-not-allowed border-border bg-card text-muted-foreground opacity-50",
              )}
            >
              <span className="text-base leading-none">#{n}</span>
              <span className="text-[9px] font-medium uppercase tracking-wider opacity-75">
                {isTaken ? "Taken" : isSelected ? "Yours" : "Free"}
              </span>
            </button>
          );
        })}
      </div>

      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dashed border-border pt-3 text-xs text-muted-foreground">
      <LegendItem className="border-border bg-card" label="Available" />
      <LegendItem className="border-primary bg-primary" label="Selected" />
      <LegendItem className="border-border bg-muted" label="Taken" />
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-3.5 w-3.5 rounded-sm border-2", className)} />
      {label}
    </div>
  );
}
