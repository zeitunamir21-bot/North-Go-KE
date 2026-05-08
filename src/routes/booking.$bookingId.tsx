import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Phone, MessageCircle, MapPin, Clock, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatKES } from "@/lib/format";

export const Route = createFileRoute("/booking/$bookingId")({
  head: () => ({ meta: [{ title: "Booking confirmed — NorthGo" }] }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { bookingId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data: booking, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();
      if (error) throw error;
      const { data: trip, error: e2 } = await supabase
        .from("trips")
        .select("*")
        .eq("id", booking.trip_id)
        .single();
      if (e2) throw e2;
      return { booking, trip };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }
  const { booking, trip } = data;
  const phoneRaw = trip.driver_phone.replace(/[^\d+]/g, "");
  const wa = phoneRaw.replace(/^\+/, "");
  const total = Number(trip.price) * booking.seats;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Booking confirmed</h1>
          <p className="mt-2 text-muted-foreground">
            Hi {booking.customer_name.split(" ")[0]}, your seat is reserved. The driver will contact
            you shortly.
          </p>
        </div>

        <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-xl font-bold">{trip.route}</h2>
          <div className="grid gap-3 text-sm">
            <Row icon={Clock} label="Departure" value={formatDateTime(trip.departure_time)} />
            <Row icon={MapPin} label="Pickup" value={booking.pickup_location} />
            <Row icon={MapPin} label="Destination" value={booking.destination} />
            <Row icon={Car} label="Vehicle" value={trip.vehicle_name} />
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Seats</div>
              <div className="font-semibold">{booking.seats}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total (pay on board)</div>
              <div className="font-display text-lg font-bold">{formatKES(total)}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-secondary p-6 text-secondary-foreground shadow-[var(--shadow-card)]">
          <h3 className="font-display text-lg font-bold">Contact your driver</h3>
          <p className="mt-1 text-sm text-secondary-foreground/75">
            {trip.driver_name} · {trip.driver_phone}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button asChild size="lg" className="rounded-xl">
              <a href={`tel:${phoneRaw}`}>
                <Phone className="mr-2 h-4 w-4" /> Call driver
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <a
                href={`https://wa.me/${wa}?text=${encodeURIComponent(
                  `Hi, I just booked ${booking.seats} seat(s) for ${trip.route} on ${formatDateTime(
                    trip.departure_time,
                  )}.`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="ghost">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}
