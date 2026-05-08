import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Phone, LogOut } from "lucide-react";
import { formatDateTime, formatKES } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — NorthGo" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) navigate({ to: "/admin/login" });
      else setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/admin/login" });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const { data: trips = [], refetch: refetchTrips } = useQuery({
    queryKey: ["admin", "trips"],
    enabled: authChecked,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("departure_time", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: bookings = [], refetch: refetchBookings } = useQuery({
    queryKey: ["admin", "bookings"],
    enabled: authChecked,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Checking session…
      </div>
    );
  }

  const refresh = () => {
    refetchTrips();
    refetchBookings();
    qc.invalidateQueries({ queryKey: ["trips"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Manage trips and passengers.</p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/admin/login" });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>

        <NewTripForm onCreated={refresh} />

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">Trips</h2>
          <div className="mt-4 space-y-4">
            {trips.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No trips yet. Create one above.
              </div>
            )}
            {trips.map((t) => {
              const tripBookings = bookings.filter((b) => b.trip_id === t.id);
              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-lg font-bold">{t.route}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(t.departure_time)} · {t.pickup_point} · {t.vehicle_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {t.available_seats}/{t.total_seats} seats
                      </Badge>
                      <Badge>{formatKES(t.price)}</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={async () => {
                          if (!confirm("Delete this trip and all its bookings?")) return;
                          const { error } = await supabase.from("trips").delete().eq("id", t.id);
                          if (error) toast.error(error.message);
                          else {
                            toast.success("Trip deleted");
                            refresh();
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {tripBookings.length > 0 && (
                    <div className="mt-4 border-t border-border pt-3">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Passengers ({tripBookings.length})
                      </div>
                      <div className="space-y-2">
                        {tripBookings.map((b) => (
                          <div
                            key={b.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-accent/40 p-3 text-sm"
                          >
                            <div>
                              <div className="font-medium">{b.customer_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {b.seats} seat(s) · pickup: {b.pickup_location}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  b.booking_status === "boarded" ? "default" : "outline"
                                }
                              >
                                {b.booking_status}
                              </Badge>
                              <Button asChild size="sm" variant="outline">
                                <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`}>
                                  <Phone className="mr-1 h-3 w-3" />
                                  {b.phone}
                                </a>
                              </Button>
                              {b.booking_status !== "boarded" && (
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    const { error } = await supabase
                                      .from("bookings")
                                      .update({ booking_status: "boarded" })
                                      .eq("id", b.id);
                                    if (error) toast.error(error.message);
                                    else {
                                      toast.success("Marked boarded");
                                      refresh();
                                    }
                                  }}
                                >
                                  Mark boarded
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

function NewTripForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    route: "Isiolo → Nairobi",
    departure_time: "",
    pickup_point: "Total Petrol Station, Isiolo",
    total_seats: 7,
    vehicle_name: "Toyota Noah",
    driver_name: "NorthGo Driver",
    driver_phone: "+254712345678",
    price: 1500,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("trips").insert({
      ...form,
      departure_time: new Date(form.departure_time).toISOString(),
      available_seats: form.total_seats,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Trip created");
    setOpen(false);
    onCreated();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="mt-8 rounded-xl" size="lg">
        <Plus className="mr-1 h-4 w-4" /> Add new trip
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <h3 className="font-display text-lg font-bold">New trip</h3>
      </div>
      <Field label="Route">
        <Input
          required
          value={form.route}
          onChange={(e) => setForm({ ...form, route: e.target.value })}
        />
      </Field>
      <Field label="Departure date & time">
        <Input
          required
          type="datetime-local"
          value={form.departure_time}
          onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
        />
      </Field>
      <Field label="Pickup point">
        <Input
          required
          value={form.pickup_point}
          onChange={(e) => setForm({ ...form, pickup_point: e.target.value })}
        />
      </Field>
      <Field label="Vehicle name">
        <Input
          required
          value={form.vehicle_name}
          onChange={(e) => setForm({ ...form, vehicle_name: e.target.value })}
        />
      </Field>
      <Field label="Total seats">
        <Input
          required
          type="number"
          min={1}
          max={50}
          value={form.total_seats}
          onChange={(e) => setForm({ ...form, total_seats: Number(e.target.value) })}
        />
      </Field>
      <Field label="Price (KES)">
        <Input
          required
          type="number"
          min={0}
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        />
      </Field>
      <Field label="Driver name">
        <Input
          required
          value={form.driver_name}
          onChange={(e) => setForm({ ...form, driver_name: e.target.value })}
        />
      </Field>
      <Field label="Driver phone">
        <Input
          required
          value={form.driver_phone}
          onChange={(e) => setForm({ ...form, driver_phone: e.target.value })}
        />
      </Field>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create trip
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
