import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "@/components/StarRating";

type Review = {
  id: string;
  customer_name: string;
  stars: number;
  comment: string | null;
  created_at: string;
  driver_id: string;
  driver_name: string;
};

export function ReviewsSection() {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["top-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_top_reviews", { p_limit: 6 });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  if (isLoading || reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="mb-10 max-w-2xl">
        <h2 className="font-display text-4xl font-bold tracking-tight">
          What passengers say
        </h2>
        <p className="mt-3 text-muted-foreground">
          Real reviews from real trips on the Isiolo ⇄ Nairobi corridor.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <article
            key={r.id}
            className="relative rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
          >
            <Quote className="absolute right-5 top-5 h-8 w-8 text-primary/15" />
            <StarRating value={r.stars} readOnly size={16} />
            <p className="mt-3 text-foreground/90">"{r.comment}"</p>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{r.customer_name}</span>
              <Link
                to="/driver/$driverId"
                params={{ driverId: r.driver_id }}
                className="text-primary hover:underline"
              >
                {r.driver_name} →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
