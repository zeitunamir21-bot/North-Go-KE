import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Clock, MapPin, Loader2, User, Car, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SeatPicker } from "@/components/SeatPicker";
import { StarRating } from "@/components/StarRating";
import { toast } from "sonner";
import { formatDateTime, formatKES } from "@/lib/format";

type TripDriverProfile = {
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
};

export const Route = createFileRoute("/book/$tripId")({
  head: () => ({ meta: [{ title: "Reserve your seat — NorthGo" }] }),
  component: BookPage,
});

const bookingSchema = z.object({
  customer_name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\s-]+$/, "Phone can only contain digits, +, spaces, and hyphens"),
  pickup_location: z.string().trim().min(2, "Required").max(120),
  destination: z.string().trim().min(2, "Required").max(120),
});

function BookPage() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [seatCount, setSeatCount] = useState(1);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    pickup_location: "",
    destination: "",
  });

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: taken = [], refetch: refetchTaken } = useQuery({
    queryKey: ["taken-seats", tripId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_taken_seats", { p_trip_id: tripId });
      if (error) throw error;
      return (data ?? []) as number[];
    },
    refetchInterval: 15000,
  });

  const { data: driverProfile } = useQuery({
    queryKey: ["trip-driver", tripId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trip_driver_public", { p_trip_id: tripId });
      if (error) throw error;
      return (data as TripDriverProfile | null) ?? null;
    },
  });

  // Realtime: invalidate when trip seat count changes or new bookings arrive
  useEffect(() => {
    const channel = supabase
      .channel(`book-${tripId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trips", filter: `id=eq.${tripId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["trip", tripId] });
          refetchTaken();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, qc, refetchTaken]);

  // Keep selected seats in sync if seat count changes
  useEffect(() => {
    setSelectedSeats((prev) => prev.slice(0, seatCount));
  }, [seatCount]);

  // Clear any selected-then-taken seat
  useEffect(() => {
    setSelectedSeats((prev) => prev.filter((s) => !taken.includes(s)));
  }, [taken]);

  function toggleSeat(seat: number) {
    setSelectedSeats((prev) => {
      if (prev.includes(seat)) return prev.filter((s) => s !== seat);
      if (prev.length >= seatCount) return prev;
      return [...prev, seat].sort((a, b) => a - b);
    });
  }

  const seatsLeft = trip?.available_seats ?? 0;
  const lowSeats = useMemo(() => seatsLeft > 0 && seatsLeft <= 2, [seatsLeft]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = bookingSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (selectedSeats.length !== seatCount) {
      toast.error(`Pick ${seatCount} seat${seatCount > 1 ? "s" : ""} from the map`);
      return;
    }
    if (trip && seatCount > trip.available_seats) {
      toast.error(`Only ${trip.available_seats} seat(s) left`);
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("reserve_seats", {
      p_trip_id: tripId,
      p_customer_name: parsed.data.customer_name,
      p_phone: parsed.data.phone,
      p_seats: seatCount,
      p_pickup_location: parsed.data.pickup_location,
      p_destination: parsed.data.destination,
      p_seat_numbers: selectedSeats,
    });
    setSubmitting(false);
    if (error || !data) {
      toast.error(error?.message ?? "Could not reserve seat");
      refetchTaken();
      return;
    }
    if (trip?.driver_phone) {
      const seatList = data.seat_numbers?.length
        ? ` (seat${data.seat_numbers.length > 1 ? "s" : ""} #${data.seat_numbers.join(", #")})`
        : "";
      const message =
        `New NorthGo booking%0A` +
        `Trip: ${encodeURIComponent(trip.route)}%0A` +
        `Departure: ${encodeURIComponent(formatDateTime(trip.departure_time))}%0A` +
        `Passenger: ${encodeURIComponent(parsed.data.customer_name)}%0A` +
        `Phone: ${encodeURIComponent(parsed.data.phone)}%0A` +
        `Seats: ${seatCount}${encodeURIComponent(seatList)}%0A` +
        `Pickup: ${encodeURIComponent(parsed.data.pickup_location)}%0A` +
        `Destination: ${encodeURIComponent(parsed.data.destination)}`;
      const driverNumber = trip.driver_phone.replace(/[^\d]/g, "");
      window.open(`https://wa.me/${driverNumber}?text=${message}`, "_blank");
    }
    navigate({ to: "/booking/$bookingId", params: { bookingId: data.id } });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link
          to="/trips"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to trips
        </Link>

        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">Reserve your seat</h1>
        <p className="mt-1 text-muted-foreground">Pick your seats, fill your details, pay on board.</p>

        {isLoading || !trip ? (
          <div className="mt-10 text-muted-foreground">Loading trip…</div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,1.3fr]">
            {/* LEFT: trip summary + live availability */}
            <aside className="h-fit space-y-5">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-xl font-bold">{trip.route}</h2>
                  <Badge
                    className={
                      seatsLeft === 0
                        ? "bg-destructive text-destructive-foreground"
                        : lowSeats
                          ? "bg-orange-500 text-white"
                          : "bg-success text-success-foreground"
                    }
                  >
                    {seatsLeft === 0 ? "FULL" : `${seatsLeft} seat${seatsLeft > 1 ? "s" : ""} left`}
                  </Badge>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {formatDateTime(trip.departure_time)}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {trip.pickup_point}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 text-primary" />
                    {trip.driver_name} · {trip.vehicle_name}
                  </div>
                </div>
                <div className="mt-5 border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground">Price per seat</div>
                  <div className="font-display text-2xl font-bold">{formatKES(trip.price)}</div>
                </div>
              </div>

              {/* DRIVER PROFILE */}
              {driverProfile && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-base font-bold">Your driver</h3>
                    <Link
                      to="/driver/$driverId"
                      params={{ driverId: driverProfile.driver.id }}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View profile →
                    </Link>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                      {driverProfile.driver.photos?.[0] ? (
                        <img
                          src={driverProfile.driver.photos[0]}
                          alt={driverProfile.driver.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">
                          {driverProfile.driver.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{driverProfile.driver.full_name}</div>
                      {driverProfile.rating.count > 0 ? (
                        <div className="mt-1 flex items-center gap-1.5">
                          <StarRating value={driverProfile.rating.avg} readOnly size={14} />
                          <span className="text-xs font-semibold">
                            {driverProfile.rating.avg.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({driverProfile.rating.count})
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-muted-foreground">No reviews yet</div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Car className="h-3 w-3" /> {driverProfile.driver.vehicle_name}
                        </Badge>
                        {driverProfile.driver.plate_number && (
                          <Badge variant="outline" className="gap-1 font-mono text-xs">
                            <Hash className="h-3 w-3" /> {driverProfile.driver.plate_number}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {driverProfile.reviews.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-border pt-4">
                      {driverProfile.reviews.slice(0, 2).map((r) => (
                        <div key={r.id} className="rounded-lg bg-muted/40 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{r.customer_name}</span>
                            <StarRating value={r.stars} readOnly size={12} />
                          </div>
                          {r.comment && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              "{r.comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}


              {/* SEAT PICKER */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Choose your seat{seatCount > 1 ? "s" : ""}
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    {selectedSeats.length}/{seatCount} picked
                  </div>
                </div>
                <SeatPicker
                  totalSeats={trip.total_seats}
                  taken={taken}
                  selected={selectedSeats}
                  onToggle={toggleSeat}
                  maxSelect={seatCount}
                />
              </div>
            </aside>

            {/* RIGHT: form */}
            <form
              onSubmit={onSubmit}
              className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
            >
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  maxLength={100}
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="Jane Doe"
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  required
                  type="tel"
                  maxLength={20}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+254 712 345 678"
                  className="mt-1.5 h-11"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="pickup">Pickup location</Label>
                  <Input
                    id="pickup"
                    required
                    maxLength={120}
                    value={form.pickup_location}
                    onChange={(e) => setForm({ ...form, pickup_location: e.target.value })}
                    placeholder={trip.pickup_point}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="dest">Destination</Label>
                  <Input
                    id="dest"
                    required
                    maxLength={120}
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    placeholder={trip.route.split("→")[1]?.trim() ?? "City center"}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="seats">Number of seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  max={Math.max(1, seatsLeft)}
                  value={seatCount}
                  onChange={(e) =>
                    setSeatCount(Math.max(1, Math.min(Number(e.target.value) || 1, seatsLeft || 1)))
                  }
                  className="mt-1.5 h-11"
                />
                {selectedSeats.length > 0 && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Selected:{" "}
                    {selectedSeats.map((s) => (
                      <span key={s} className="mr-1 inline-flex h-5 min-w-5 items-center justify-center rounded bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        #{s}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="text-sm text-muted-foreground">
                  Total ·{" "}
                  <span className="font-semibold text-foreground">
                    {formatKES(Number(trip.price) * seatCount)}
                  </span>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting || selectedSeats.length !== seatCount || seatsLeft === 0}
                  className="rounded-xl"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reserve {selectedSeats.length > 0 ? `seat${selectedSeats.length > 1 ? "s" : ""}` : ""}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Live availability — seat status updates in real time as others book.
              </p>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
