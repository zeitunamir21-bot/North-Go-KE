import { useQuery } from "@tanstack/react-query";
import { Users, Route as RouteIcon, ShieldCheck, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Stats = {
  passengers_served: number;
  completed_trips: number;
  approved_drivers: number;
  avg_rating: number;
};

export function StatsRow() {
  const { data } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_platform_stats");
      if (error) throw error;
      return data as Stats;
    },
  });

  const items = [
    { icon: Users, label: "Passengers served", value: data?.passengers_served ?? "—" },
    { icon: RouteIcon, label: "Trips completed", value: data?.completed_trips ?? "—" },
    { icon: ShieldCheck, label: "Verified drivers", value: data?.approved_drivers ?? "—" },
    { icon: Star, label: "Average rating", value: data?.avg_rating ? `${data.avg_rating}★` : "—" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {items.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-5 text-center shadow-[var(--shadow-card)]"
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="mt-3 font-display text-2xl font-bold md:text-3xl">{value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
