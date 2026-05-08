import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TripCard } from "@/components/TripCard";
import { formatDay } from "@/lib/format";

export const Route = createFileRoute("/trips")({
  head: () => ({
    meta: [
      { title: "Available Trips — NorthGo" },
      { name: "description", content: "Browse upcoming Isiolo ⇄ Nairobi rides and reserve a seat." },
    ],
  }),
  component: TripsPage,
});

function TripsPage() {
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["trips", "all-upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .gte("departure_time", new Date().toISOString())
        .order("departure_time");
      if (error) throw error;
      return data;
    },
  });

  const grouped = useMemo(() => {
    const g: Record<string, typeof trips> = {};
    for (const t of trips) {
      const key = new Date(t.departure_time).toDateString();
      (g[key] ||= []).push(t);
    }
    return Object.entries(g);
  }, [trips]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-5xl font-bold tracking-tight">Available trips</h1>
        <p className="mt-2 text-muted-foreground">Reserve a seat — pay on board.</p>

        {isLoading ? (
          <div className="mt-12 text-center text-muted-foreground">Loading trips…</div>
        ) : grouped.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No trips scheduled. Please check back later.
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            {grouped.map(([day, dayTrips]) => (
              <div key={day}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {formatDay(dayTrips[0].departure_time)}
                </h2>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {dayTrips.map((t) => <TripCard key={t.id} trip={t} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
