import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, MapPin, Users, Flame, Star, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/Countdown";
import { formatDateTime, formatKES } from "@/lib/format";

type Trip = {
  id: string;
  route: string;
  departure_time: string;
  pickup_point: string;
  available_seats: number;
  total_seats: number;
  vehicle_name: string;
  price: number;
  status: string;
  driver_name: string;
  driver_phone: string;
  plate_number?: string | null;
  rating_avg?: number | null;
  rating_count?: number | null;
};

export function TripCard({ trip }: { trip: Trip }) {
  const isFull = trip.available_seats <= 0;
  const lowSeats = trip.available_seats > 0 && trip.available_seats <= 2;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold tracking-tight">{trip.route}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatDateTime(trip.departure_time)}
          </div>
          <div className="mt-2">
            <Countdown to={trip.departure_time} />
          </div>
        </div>
        {isFull ? (
          <Badge variant="destructive">FULL</Badge>
        ) : lowSeats ? (
          <Badge className="bg-orange-500 text-white hover:bg-orange-500">
            <Flame className="mr-1 h-3 w-3" />
            Only {trip.available_seats} left
          </Badge>
        ) : (
          <Badge className="bg-success text-success-foreground hover:bg-success">
            {trip.available_seats} seats
          </Badge>
        )}
      </div>

      <div className="mt-5 grid gap-2.5 text-sm">
        <div className="flex items-center gap-2 text-foreground/80">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{trip.pickup_point}</span>
        </div>
        <div className="flex items-center gap-2 text-foreground/80">
          <Users className="h-4 w-4 text-primary" />
          <span>
            {trip.available_seats}/{trip.total_seats} seats available
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">From</div>
          <div className="font-display text-lg font-bold text-foreground">
            {formatKES(trip.price)}
          </div>
        </div>
        <Button asChild disabled={isFull} size="lg" className="rounded-xl">
          <Link to="/book/$tripId" params={{ tripId: trip.id }}>
            {isFull ? "Sold out" : "Reserve"}
            {!isFull && <ArrowRight className="ml-1 h-4 w-4" />}
          </Link>
        </Button>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            Driver · <span className="font-medium text-foreground">{trip.driver_name}</span>
          </div>
          {(trip.rating_count ?? 0) > 0 ? (
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-foreground">{Number(trip.rating_avg ?? 0).toFixed(1)}</span>
              <span className="text-muted-foreground">({trip.rating_count})</span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No ratings yet</div>
          )}
        </div>
        {trip.plate_number && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <IdCard className="h-3.5 w-3.5" />
            <span className="font-mono font-semibold tracking-wider text-foreground">{trip.plate_number}</span>
            <span>·</span>
            <span>{trip.vehicle_name}</span>
          </div>
        )}
        <div className="mt-2 text-xs text-muted-foreground">
          Driver contact is shared after you reserve a seat.
        </div>
      </div>
    </article>
  );
}
