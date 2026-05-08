import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, MapPin, Users, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        </div>
        {isFull ? (
          <Badge variant="destructive">FULL</Badge>
        ) : lowSeats ? (
          <Badge className="bg-orange-500 text-white hover:bg-orange-500">
            {trip.available_seats} left
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
          <Car className="h-4 w-4 text-primary" />
          <span>{trip.vehicle_name}</span>
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
    </article>
  );
}
