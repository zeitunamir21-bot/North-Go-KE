import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/useAuth";
import { BottomNav } from "@/components/BottomNav";
import { formatDateTime, formatKES } from "@/lib/format";
import { Ticket, MapPin, Clock, X, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

type MyBooking = {
  id: string;
  customer_name: string;
  phone: string;
  seats: number;
  seat_numbers: number[] | null;
  pickup_location: string;
  destination: string;
  status: string;
  booking_status: string;
  created_at: string;
  trip: {
    id: string;
    route: string;
    departure_time: string;
    pickup_point: string;
    price: number;
    driver_name: string;
    driver_phone: string;
    vehicle_name: string;
  };
};

export const Route = createFileRoute("/my-bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — NorthGo" },
      { name: "description", content: "Manage your NorthGo bookings: view trips, download receipts, cancel reservations." },
    ],
  }),
  component: MyBookingsPage,
});

function MyBookingsPage() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && !session) navigate({ to: "/auth" });
  }, [authLoading, session, navigate]);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["my-bookings"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_bookings");
      if (error) throw error;
      return (data ?? []) as MyBooking[];
    },
  });

  async function cancel(id: string) {
    if (!confirm("Cancel this booking? Your seats will be released.")) return;
    const { error } = await supabase.rpc("cancel_booking", { p_booking_id: id });
    if (error) return toast.error(error.message);
    toast.success("Booking cancelled");
    qc.invalidateQueries({ queryKey: ["my-bookings"] });
  }

  function downloadReceipt(b: MyBooking) {
    const total = Number(b.trip.price) * b.seats;
    const text = [
      "NORTHGO BOOKING RECEIPT",
      "========================",
      "",
      `Booking ID: ${b.id}`,
      `Status:     ${b.status.toUpperCase()}`,
      `Passenger:  ${b.customer_name}`,
      `Phone:      ${b.phone}`,
      "",
      `Route:      ${b.trip.route}`,
      `Departure:  ${formatDateTime(b.trip.departure_time)}`,
      `Pickup:     ${b.pickup_location}`,
      `Destination:${b.destination}`,
      `Vehicle:    ${b.trip.vehicle_name}`,
      `Driver:     ${b.trip.driver_name} (${b.trip.driver_phone})`,
      "",
      `Seats:      ${b.seats}${b.seat_numbers?.length ? ` (#${b.seat_numbers.join(", #")})` : ""}`,
      `Per seat:   ${formatKES(b.trip.price)}`,
      `TOTAL:      ${formatKES(total)} — pay on board`,
      "",
      "Thank you for travelling with NorthGo.",
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `northgo-receipt-${b.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">My bookings</h1>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
          >
            Sign out
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-12 text-center text-muted-foreground">Loading bookings…</div>
        ) : bookings.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">You haven't booked any trips yet.</p>
            <Button asChild className="mt-4 rounded-xl">
              <Link to="/trips">Browse trips</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {bookings.map((b) => {
              const cancelled = b.status === "cancelled";
              const past = new Date(b.trip.departure_time) < new Date();
              return (
                <div
                  key={b.id}
                  className={`rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] ${cancelled ? "opacity-60" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-lg font-bold">{b.trip.route}</div>
                      <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatDateTime(b.trip.departure_time)}</div>
                        <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {b.pickup_location}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={cancelled ? "destructive" : past ? "secondary" : "default"}>
                        {cancelled ? "Cancelled" : past ? "Completed" : "Confirmed"}
                      </Badge>
                      <Badge variant="outline">
                        {b.seats} seat{b.seats > 1 ? "s" : ""}
                        {b.seat_numbers?.length ? ` · #${b.seat_numbers.join(", #")}` : ""}
                      </Badge>
                      <Badge variant="outline">{formatKES(Number(b.trip.price) * b.seats)}</Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/booking/$bookingId" params={{ bookingId: b.id }}>View details</Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadReceipt(b)}>
                      <Download className="mr-1 h-3.5 w-3.5" /> Receipt
                    </Button>
                    {!cancelled && !past && b.booking_status !== "boarded" && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancel(b.id)}>
                        <X className="mr-1 h-3.5 w-3.5" /> Cancel
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    Booking ID: {b.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}
