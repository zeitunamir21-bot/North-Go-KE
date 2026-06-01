import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Car, Clock, MapPin, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/StarRating";
import { formatDateTime, formatKES } from "@/lib/format";

export const Route = createFileRoute("/driver/$driverId")({
  head: () => ({
    meta: [
      { title: "Driver profile — NorthGo" },
      { name: "description", content: "View driver details, vehicle, reviews and upcoming trips." },
    ],
  }),
  component: DriverProfilePage,
});

type ProfilePayload = {
  driver: {
    id: string;
    full_name: string;
    vehicle_name: string;
    plate_number: string | null;
    photos: string[];
  };
  rating: { avg: number; count: number };
  reviews: Array<{
    id: string;
    customer_name: string;
    stars: number;
    comment: string | null;
    created_at: string;
  }>;
  upcoming_trips: Array<{
    id: string;
    route: string;
    departure_time: string;
    pickup_point: string;
    available_seats: number;
    total_seats: number;
    price: number;
    vehicle_name: string;
  }>;
};

function DriverProfilePage() {
  const { driverId } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["driver-public", driverId],
    queryFn: async () => {
      const { data: payload, error: rpcError } = await supabase.rpc("get_driver_public", {
        p_driver_id: driverId,
      });
      if (rpcError) throw rpcError;
      if (!payload) throw new Error("Driver not found");
      return payload as ProfilePayload;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted-foreground">
          Loading driver…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Driver not found</h1>
          <Button asChild className="mt-6 rounded-xl">
            <Link to="/trips">Browse trips</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { driver, rating, reviews, upcoming_trips } = data;
  const photo = driver.photos?.[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link
          to="/trips"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to trips
        </Link>

        {/* PROFILE HEADER */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
          <div className="flex flex-col items-start gap-6 md:flex-row">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
              {photo ? (
                <img src={photo} alt={driver.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground">
                  {driver.full_name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                {driver.full_name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {rating.count > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <StarRating value={rating.avg} readOnly size={18} />
                    <span className="text-sm font-semibold">{rating.avg.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({rating.count} review{rating.count > 1 ? "s" : ""})
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No reviews yet</span>
                )}
                <Badge variant="outline" className="gap-1">
                  <Car className="h-3.5 w-3.5" /> {driver.vehicle_name}
                </Badge>
                {driver.plate_number && (
                  <Badge variant="outline" className="gap-1 font-mono">
                    <Hash className="h-3.5 w-3.5" /> {driver.plate_number}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Photo gallery */}
          {driver.photos.length > 1 && (
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {driver.photos.slice(0, 6).map((url) => (
                <img
                  key={url}
                  src={url}
                  alt={`${driver.full_name}'s vehicle`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {/* UPCOMING TRIPS */}
        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold">Upcoming trips</h2>
          {upcoming_trips.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
              No upcoming trips scheduled.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {upcoming_trips.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
                >
                  <div>
                    <div className="font-display text-lg font-bold">{t.route}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {formatDateTime(t.departure_time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {t.pickup_point}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {t.available_seats}/{t.total_seats} left
                      </div>
                      <div className="font-display text-lg font-bold">{formatKES(t.price)}</div>
                    </div>
                    <Button asChild disabled={t.available_seats <= 0} className="rounded-xl">
                      <Link to="/book/$tripId" params={{ tripId: t.id }}>
                        Reserve <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* REVIEWS */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">
            Reviews {rating.count > 0 && <span className="text-muted-foreground">({rating.count})</span>}
          </h2>
          {reviews.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
              No reviews yet. Be the first after your trip.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{r.customer_name}</span>
                    <StarRating value={r.stars} readOnly size={14} />
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-foreground/85">"{r.comment}"</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}
