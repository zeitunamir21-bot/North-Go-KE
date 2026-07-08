import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatKES, formatDay } from "@/lib/format";
import { History as HistoryIcon, MapPin, Users } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Trip History — NorthGo" },
      { name: "description", content: "Browse past Isiolo ⇄ Nairobi trips." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["trips", "history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select(
          "id,route,departure_time,pickup_point,total_seats,available_seats,vehicle_name,driver_name,price,status,owner_id,created_at,updated_at",
        )
        .lt("departure_time", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("departure_time", { ascending: false })
        .limit(200);
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
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
            <HistoryIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Trip history</h1>
            <p className="mt-1 text-muted-foreground">Past departures from the last 200 trips.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-12 text-center text-muted-foreground">Loading…</div>
        ) : grouped.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No past trips yet.
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {grouped.map(([day, dayTrips]) => (
              <div key={day}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {formatDay(dayTrips[0].departure_time)}
                </h2>
                <div className="space-y-3">
                  {dayTrips.map((t) => {
                    const booked = t.total_seats - t.available_seats;
                    return (
                      <div
                        key={t.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
                      >
                        <div>
                          <div className="font-display text-lg font-bold">{t.route}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>{formatDateTime(t.departure_time)}</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> {t.pickup_point}
                            </span>
                            <span>{t.driver_name}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" /> {booked}/{t.total_seats} booked
                          </Badge>
                          <Badge>{formatKES(t.price)}</Badge>
                          <Badge variant={t.status === "full" ? "default" : "secondary"}>
                            {t.status === "full" ? "Fully boarded" : "Completed"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
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
