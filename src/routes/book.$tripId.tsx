import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { ArrowLeft, Clock, MapPin, Car, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatDateTime, formatKES } from "@/lib/format";

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
  seats: z.number().int().min(1).max(10),
});

function BookPage() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    pickup_location: "",
    destination: "",
    seats: 1,
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = bookingSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (trip && parsed.data.seats > trip.available_seats) {
      toast.error(`Only ${trip.available_seats} seat(s) left`);
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("reserve_seats", {
      p_trip_id: tripId,
      p_customer_name: parsed.data.customer_name,
      p_phone: parsed.data.phone,
      p_seats: parsed.data.seats,
      p_pickup_location: parsed.data.pickup_location,
      p_destination: parsed.data.destination,
    });
    setSubmitting(false);
    if (error || !data) {
      toast.error(error?.message ?? "Could not reserve seat");
      return;
    }
    navigate({ to: "/booking/$bookingId", params: { bookingId: data.id } });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/trips"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to trips
        </Link>

        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">Reserve your seat</h1>
        <p className="mt-1 text-muted-foreground">No payment required. Pay on board.</p>

        {isLoading || !trip ? (
          <div className="mt-10 text-muted-foreground">Loading trip…</div>
        ) : (
          <div className="mt-8 grid gap-8 md:grid-cols-[1fr,1.2fr]">
            {/* Trip summary */}
            <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <h2 className="font-display text-xl font-bold">{trip.route}</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {formatDateTime(trip.departure_time)}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {trip.pickup_point}
                </div>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" />
                  {trip.vehicle_name}
                </div>
              </div>
              <div className="mt-5 border-t border-border pt-4">
                <div className="text-xs text-muted-foreground">Price per seat</div>
                <div className="font-display text-2xl font-bold">{formatKES(trip.price)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {trip.available_seats} of {trip.total_seats} seats left
                </div>
              </div>
            </aside>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
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
                  max={Math.max(1, trip.available_seats)}
                  value={form.seats}
                  onChange={(e) => setForm({ ...form, seats: Number(e.target.value) || 1 })}
                  className="mt-1.5 h-11"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="text-sm text-muted-foreground">
                  Total ·{" "}
                  <span className="font-semibold text-foreground">
                    {formatKES(Number(trip.price) * form.seats)}
                  </span>
                </div>
                <Button type="submit" size="lg" disabled={submitting} className="rounded-xl">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reserve seat
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You'll receive a confirmation. The driver will contact you before departure.
              </p>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
