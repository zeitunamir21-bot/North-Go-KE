import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Loader2, LogOut, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { formatDateTime, formatKES } from "@/lib/format";

export const Route = createFileRoute("/driver/")({
  head: () => ({ meta: [{ title: "Driver dashboard — NorthGo" }] }),
  component: DriverPage,
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
  status: string;
  owner_id: string | null;
};

type Driver = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  vehicle_name: string;
  status: string;
};

function DriverPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        navigate({ to: "/driver/login" });
        return;
      }
      setUserId(data.session.user.id);
      setChecked(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) navigate({ to: "/driver/login" });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const { data: driver, refetch: refetchDriver } = useQuery({
    queryKey: ["driver", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Driver | null> => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const isApproved = driver?.status === "approved";

  const { data: trips = [], refetch: refetchTrips } = useQuery({
    queryKey: ["driver-trips", userId],
    enabled: !!userId && isApproved,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("owner_id", userId!)
        .order("departure_time", { ascending: false });
      if (error) throw error;
      return data as Trip[];
    },
  });

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Driver dashboard</h1>
            {driver && (
              <p className="mt-1 text-muted-foreground">
                {driver.full_name} · {driver.vehicle_name} · Status:{" "}
                <Badge
                  variant={
                    driver.status === "approved"
                      ? "default"
                      : driver.status === "rejected"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {driver.status}
                </Badge>
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/driver/login" });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>

        {!driver && (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">You haven't submitted a driver application yet.</p>
            <Button className="mt-4" onClick={() => navigate({ to: "/driver/signup" })}>
              Apply to drive
            </Button>
          </div>
        )}

        {driver && driver.status === "pending" && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">Pending review</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              An admin will approve your application shortly. You'll be able to post and confirm trip times once approved.
            </p>
          </div>
        )}

        {driver && driver.status === "rejected" && (
          <div className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/10 p-6">
            <h2 className="font-display text-xl font-bold text-destructive">Application rejected</h2>
            <p className="mt-1 text-sm text-muted-foreground">Contact NorthGo support for more info.</p>
          </div>
        )}

        {isApproved && userId && (
          <>
            <TripForm
              key={editing?.id ?? "new"}
              userId={userId}
              defaults={{
                driver_name: driver!.full_name,
                driver_phone: driver!.phone,
                vehicle_name: driver!.vehicle_name,
              }}
              editing={editing}
              onDone={() => {
                setEditing(null);
                refetchTrips();
                refetchDriver();
              }}
            />

            <section className="mt-10">
              <h2 className="font-display text-2xl font-bold">My trips</h2>
              <div className="mt-4 space-y-4">
                {trips.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                    No trips yet. Add one above.
                  </div>
                )}
                {trips.map((t) => (
                  <div key={t.id} className="rounded-2xl border border-border bg-card p-5">
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
                            setEditing(t);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={async () => {
                            if (!confirm("Delete this trip?")) return;
                            const { error } = await supabase.from("trips").delete().eq("id", t.id);
                            if (error) toast.error(error.message);
                            else {
                              toast.success("Deleted");
                              refetchTrips();
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
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

function TripForm({
  editing,
  userId,
  defaults,
  onDone,
}: {
  editing: Trip | null;
  userId: string;
  defaults: { driver_name: string; driver_phone: string; vehicle_name: string };
  onDone: () => void;
}) {
  const isEdit = !!editing;
  const [open, setOpen] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(() => ({
    route: editing?.route ?? "Isiolo → Nairobi",
    departure_time: editing ? toLocalInput(editing.departure_time) : "",
    pickup_point: editing?.pickup_point ?? "Total Petrol Station, Isiolo",
    total_seats: editing?.total_seats ?? 7,
    price: editing?.price ?? 1300,
  }));

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
          price: form.price,
        })
        .eq("id", editing.id);
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Trip updated");
    } else {
      const { error } = await supabase.from("trips").insert({
        ...form,
        owner_id: userId,
        vehicle_name: defaults.vehicle_name,
        driver_name: defaults.driver_name,
        driver_phone: defaults.driver_phone,
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
    <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <h3 className="font-display text-lg font-bold">{isEdit ? "Edit trip" : "New trip"}</h3>
      </div>
      <div>
        <Label className="mb-1.5 block">Route</Label>
        <Input required value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} />
      </div>
      <div>
        <Label className="mb-1.5 block">Departure date & time</Label>
        <Input required type="datetime-local" value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} />
      </div>
      <div>
        <Label className="mb-1.5 block">Pickup point</Label>
        <Input required value={form.pickup_point} onChange={(e) => setForm({ ...form, pickup_point: e.target.value })} />
      </div>
      <div>
        <Label className="mb-1.5 block">Total seats</Label>
        <Input required type="number" min={1} max={50} value={form.total_seats} onChange={(e) => setForm({ ...form, total_seats: Number(e.target.value) })} />
      </div>
      <div>
        <Label className="mb-1.5 block">Price (KES)</Label>
        <Input required type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create trip"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => { setOpen(false); onDone(); }}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
