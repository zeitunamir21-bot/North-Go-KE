import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TripCard } from "@/components/TripCard";
import { formatDay } from "@/lib/format";
import { BottomNav } from "@/components/BottomNav";

const TRIPS_URL = "https://no-pay-routes.lovable.app/trips";

export const Route = createFileRoute("/trips")({
  head: () => ({
    meta: [
      { title: "Available Trips — Isiolo ⇄ Nairobi Seat Booking | NorthGo" },
      { name: "description", content: "Browse upcoming Isiolo ⇄ Nairobi 7-seater Sienta rides. Live seat availability, verified Kenyan drivers, reserve online and pay on board." },
      { property: "og:title", content: "Available Trips — Isiolo ⇄ Nairobi | NorthGo" },
      { property: "og:description", content: "Live seat availability for daily Isiolo ⇄ Nairobi rides. Reserve online, pay on board." },
      { property: "og:url", content: TRIPS_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Available Trips — Isiolo ⇄ Nairobi | NorthGo" },
      { name: "twitter:description", content: "Live seat availability for daily Isiolo ⇄ Nairobi rides." },
    ],
    links: [{ rel: "canonical", href: TRIPS_URL }],
  }),
  component: TripsPage,
});

function TripsPage() {
  const qc = useQueryClient();
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["trips", "all-upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_upcoming_trips_public");
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        route: string;
        departure_time: string;
        pickup_point: string;
        total_seats: number;
        available_seats: number;
        vehicle_name: string;
        driver_name: string;
        driver_phone: string;
        price: number;
        status: string;
        plate_number: string | null;
        rating_avg: number | null;
        rating_count: number | null;
      }>;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("trips-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => {
        qc.invalidateQueries({ queryKey: ["trips", "all-upcoming"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof trips> = {};
    for (const t of trips) {
      const key = new Date(t.departure_time).toDateString();
      (g[key] ||= []).push(t);
    }
    return Object.entries(g);
  }, [trips]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
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
      <BottomNav />
    </div>
  );
}
