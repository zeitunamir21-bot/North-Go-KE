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
import { Loader2, Plus, Trash2, Phone, LogOut, Pencil } from "lucide-react";
import { formatDateTime, formatKES } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — NorthGo" }] }),
  component: AdminPage,
});

type Trip = {
  id: string;
  route: string;
  departure_time: string;
  pickup_point: string;
  total_seats: number;
  available_seats: number;
  driver_name: string;
  driver_phone: string;
  price: number;
};

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [authChecked, setAuthChecked] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        navigate({ to: "/admin/login" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roles) {
        toast.error("This account is not an admin.");
        await supabase.auth.signOut();
        navigate({ to: "/admin/login" });
        return;
      }
      setAuthChecked(true);
    }
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/admin/login" });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  // Live notification when a new driver applies
  useEffect(() => {
    if (!authChecked) return;
    const channel = supabase
      .channel("admin-driver-apps")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "drivers" },
        (payload) => {
          const d = payload.new as { full_name?: string };
          toast.success(`New driver application: ${d.full_name ?? "Unknown"}`);
          qc.invalidateQueries({ queryKey: ["admin", "drivers"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [authChecked, qc]);

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

  const { data: drivers = [], refetch: refetchDrivers } = useQuery({
    queryKey: ["admin", "drivers"],
    enabled: authChecked,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
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

        <TripForm
          key={editing?.id ?? "new"}
          editing={editing}
          onDone={() => {
            setEditing(null);
            refresh();
          }}
        />

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">Driver applications</h2>
          <div className="mt-4 space-y-3">
            {drivers.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No driver applications yet.
              </div>
            )}
            {drivers.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                <div>
                  <div className="font-semibold">{d.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.phone} · {d.vehicle_name}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      d.status === "approved"
                        ? "default"
                        : d.status === "rejected"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {d.status}
                  </Badge>
                  {d.status !== "approved" && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        const { error } = await supabase
                          .from("drivers")
                          .update({ status: "approved" })
                          .eq("id", d.id);
                        if (error) toast.error(error.message);
                        else {
                          toast.success("Driver approved");
                          refetchDrivers();
                        }
                      }}
                    >
                      Approve
                    </Button>
                  )}
                  {d.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const { error } = await supabase
                          .from("drivers")
                          .update({ status: "rejected" })
                          .eq("id", d.id);
                        if (error) toast.error(error.message);
                        else {
                          toast.success("Rejected");
                          refetchDrivers();
                        }
                      }}
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

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
                        {formatDateTime(t.departure_time)} · {t.pickup_point}
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
                        onClick={() => {
                          setEditing(t as Trip);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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
                                {b.seats} seat(s){b.seat_numbers?.length ? ` · #${b.seat_numbers.join(", #")}` : ""} · pickup: {b.pickup_location}
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

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function TripForm({ editing, onDone }: { editing: Trip | null; onDone: () => void }) {
  const isEdit = !!editing;
  const [open, setOpen] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(() => ({
    route: editing?.route ?? "Isiolo → Nairobi",
    departure_time: editing ? toLocalInput(editing.departure_time) : "",
    pickup_point: editing?.pickup_point ?? "Total Petrol Station, Isiolo",
    total_seats: editing?.total_seats ?? 7,
    driver_name: editing?.driver_name ?? "NorthGo Driver",
    driver_phone: editing?.driver_phone ?? "+254790179834",
    price: editing?.price ?? 1300,
  }));

  useEffect(() => {
    if (isEdit) setOpen(true);
  }, [isEdit]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (isEdit && editing) {
      const seatDelta = form.total_seats - editing.total_seats;
      const { error } = await supabase
        .from("trips")
        .update({
          route: form.route,
          departure_time: new Date(form.departure_time).toISOString(),
          pickup_point: form.pickup_point,
          total_seats: form.total_seats,
          available_seats: Math.max(0, editing.available_seats + seatDelta),
          driver_name: form.driver_name,
          driver_phone: form.driver_phone,
          price: form.price,
        })
        .eq("id", editing.id);
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Trip updated");
    } else {
      const { error } = await supabase.from("trips").insert({
        ...form,
        vehicle_name: "Toyota Noah",
        departure_time: new Date(form.departure_time).toISOString(),
        available_seats: form.total_seats,
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Trip created");
    }
    setOpen(false);
    onDone();
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
        <h3 className="font-display text-lg font-bold">{isEdit ? "Edit trip" : "New trip"}</h3>
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
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create trip"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            onDone();
          }}
        >
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
