import { MapPin, Clock, Wallet } from "lucide-react";

export function RouteInfo() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-display text-4xl font-bold tracking-tight">
          The Isiolo ⇄ Nairobi route
        </h2>
        <p className="mt-2 text-muted-foreground">
          A 285 km journey along the A2 highway — Mount Kenya views, smooth tarmac, and trusted
          intercity matatu service.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card icon={MapPin} title="Pickup in Isiolo" lines={["Total Petrol Station", "A2 Highway, Isiolo Town"]} />
        <Card icon={MapPin} title="Drop-off in Nairobi" lines={["Tea Room / River Road", "Eastleigh and town stops on request"]} />
        <Card icon={Clock} title="Travel time" lines={["≈ 4h 30m direct", "Daily departures, morning & evening"]} />
        <Card icon={Wallet} title="Fare" lines={["KES 1,300 per seat", "Pay cash or M-Pesa on board"]} />
        <Card icon={MapPin} title="Major stops" lines={["Nanyuki · Karatina · Sagana", "Thika · Nairobi CBD"]} />
        <Card icon={Clock} title="Best times" lines={["6:30 AM, 9:00 AM", "2:00 PM, 6:00 PM"]} />
      </div>
    </section>
  );
}

function Card({
  icon: Icon,
  title,
  lines,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-display text-lg font-bold">{title}</h3>
      <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
        {lines.map((l) => <div key={l}>{l}</div>)}
      </div>
    </div>
  );
}
