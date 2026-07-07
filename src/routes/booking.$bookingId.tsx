import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Phone, MessageCircle, MapPin, Clock, Loader2, Share2, Gift, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DriverPhoto } from "@/components/DriverPhoto";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/StarRating";
import { formatDateTime, formatKES } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/booking/$bookingId")({
  head: () => ({ meta: [{ title: "Booking confirmed — NorthGo" }] }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { bookingId } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data: payload, error: rpcError } = await supabase.rpc("get_booking_details", {
        p_booking_id: bookingId,
      });
      if (rpcError) throw rpcError;
      if (!payload) throw new Error("Booking not found");
      return payload as {
        booking: {
          id: string;
          customer_name: string;
          pickup_location: string;
          destination: string;
          seats: number;
          seat_numbers: number[] | null;
          trip_id: string;
        };
        trip: {
          id: string;
          route: string;
          departure_time: string;
          price: number;
          driver_name: string;
          driver_phone: string;
          owner_id: string | null;
        };
        driver: { id: string; full_name: string; photos: string[]; vehicle_name: string | null; plate_number: string | null } | null;
      };
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
          Loading your booking…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-2xl font-bold">We couldn't load your booking</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Please try again."}
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }
  const { booking, trip, driver } = data;
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
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-border pt-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Seats</div>
              <div className="font-semibold">{booking.seats}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Seat number{(booking.seat_numbers?.length ?? 0) > 1 ? "s" : ""}</div>
              <div className="flex flex-wrap gap-1">
                {(booking.seat_numbers ?? []).map((n) => (
                  <span
                    key={n}
                    className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-primary px-2 text-xs font-bold text-primary-foreground"
                  >
                    #{n}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total (pay on board)</div>
              <div className="font-display text-lg font-bold">{formatKES(total)}</div>
            </div>
          </div>
        </div>

        {driver && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold">Your driver</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {driver.full_name}
                  {driver.vehicle_name && <> · {driver.vehicle_name}</>}
                  {driver.plate_number && (
                    <> · <span className="font-mono font-semibold text-foreground">{driver.plate_number}</span></>
                  )}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-lg">
                <Link to="/driver/$driverId" params={{ driverId: driver.id }}>
                  View profile
                </Link>
              </Button>
            </div>
            {driver.photos && driver.photos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {driver.photos.slice(0, 6).map((url) => (
                  <DriverPhoto
                    key={url}
                    src={url}
                    alt={`${driver.full_name}'s vehicle`}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        )}

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

        <ShareCard
          tripRoute={trip.route}
          tripId={trip.id}
          departure={trip.departure_time}
          bookingId={booking.id}
        />

        {driver && (
          <RateDriverCard
            driverId={driver.id}
            driverName={driver.full_name}
            tripId={trip.id}
            bookingId={booking.id}
            customerName={booking.customer_name}
          />
        )}

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

function RateDriverCard({
  driverId,
  driverName,
  tripId,
  bookingId,
  customerName,
}: {
  driverId: string;
  driverName: string;
  tripId: string;
  bookingId: string;
  customerName: string;
}) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: ratings = [], refetch } = useQuery({
    queryKey: ["ratings", driverId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_driver_ratings_public", {
        p_driver_id: driverId,
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        stars: number;
        comment: string | null;
        created_at: string;
        customer_name: string;
      }>;
    },
  });

  const avg = ratings.length
    ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length
    : 0;

  async function submit() {
    if (stars < 1) return toast.error("Please select 1 to 5 stars");
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_rating", {
      p_booking_id: bookingId,
      p_driver_id: driverId,
      p_trip_id: tripId,
      p_stars: stars,
      p_comment: comment.trim(),
      p_customer_name: customerName,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks for your feedback!");
    setStars(0);
    setComment("");
    refetch();
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">Rate {driverName}</h3>
          <p className="text-xs text-muted-foreground">Help other passengers travel with confidence.</p>
        </div>
        {ratings.length > 0 && (
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <StarRating value={avg} readOnly size={16} />
              <span className="text-sm font-semibold">{avg.toFixed(1)}</span>
            </div>
            <div className="text-xs text-muted-foreground">{ratings.length} review{ratings.length > 1 ? "s" : ""}</div>
          </div>
        )}
      </div>
      <div className="mt-4 space-y-3">
        <StarRating value={stars} onChange={setStars} size={28} />
        <Textarea
          placeholder="Optional: tell us how the trip went…"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          maxLength={500}
          rows={3}
        />
        <Button onClick={submit} disabled={submitting || stars < 1} className="rounded-xl">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit rating
        </Button>
      </div>
      {ratings.length > 0 && (
        <div className="mt-6 space-y-3 border-t border-border pt-4">
          {ratings.slice(0, 5).map((r) => (
            <div key={r.id} className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{r.customer_name}</div>
                <StarRating value={r.stars} readOnly size={14} />
              </div>
              {r.comment && <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
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

function ShareCard({
  tripRoute,
  tripId,
  departure,
  bookingId,
}: {
  tripRoute: string;
  tripId: string;
  departure: string;
  bookingId: string;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://no-pay-routes.lovable.app";
  const tripLink = `${origin}/book/${tripId}?promo=FRIEND50&ref=${bookingId.slice(0, 8)}`;
  const shareText = `I just booked ${tripRoute} on NorthGo for ${formatDateTime(departure)}. Use code FRIEND50 for KES 50 off your first ride: ${tripLink}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(tripLink);
      toast.success("Link copied — share it on WhatsApp");
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: "NorthGo booking",
          text: shareText,
          url: tripLink,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copy();
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <Gift className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold">Refer a friend — KES 50 off each</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Share NorthGo with friends and family. They get KES 50 off their first booking with code{" "}
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-bold text-foreground">FRIEND50</span>.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" /> Share on WhatsApp
        </a>
        <Button variant="outline" onClick={nativeShare} className="rounded-lg">
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
        <Button variant="ghost" onClick={copy} className="rounded-lg">
          <Copy className="mr-2 h-4 w-4" /> Copy link
        </Button>
      </div>
    </div>
  );
}
