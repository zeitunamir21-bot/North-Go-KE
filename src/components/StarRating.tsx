import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = 20,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onChange?.(n)}
            className={cn(
              "transition",
              !readOnly && "cursor-pointer hover:scale-110",
              readOnly && "cursor-default",
            )}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                filled ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
