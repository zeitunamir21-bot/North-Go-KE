import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, MapPin, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { TripCard } from "@/components/TripCard";
import { TrustBadges } from "@/components/TrustBadges";
import { Button } from "@/components/ui/button";

const URL = "https://no-pay-routes.lovable.app/isiolo-to-nairobi";

export const Route = createFileRoute("/isiolo-to-nairobi")({
  head: () => ({
    meta: [
      { title: "Isiolo to Nairobi Booking — Book a 7-Seater Sienta Seat Online | NorthGo" },
      { name: "description", content: "Book your Isiolo to Nairobi 7-seater Sienta seat online. Daily trips on the A2 highway. Verified drivers. KES 1,300. Pay on board." },
      { name: "keywords", content: "Isiolo to Nairobi, Isiolo Nairobi booking, Sienta Isiolo Nairobi, transport Isiolo Nairobi, Isiolo Nairobi fare" },
      { property: "og:title", content: "Isiolo to Nairobi — Book a Seat Online" },
      { property: "og:description", content: "Daily Isiolo to Nairobi 7-seater Sienta trips. Verified drivers, real seat availability, pay on board." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Intercity 7-seater Sienta transport",
          areaServed: ["Isiolo", "Nairobi", "Kenya"],
          provider: { "@type": "Organization", name: "NorthGo" },
          offers: { "@type": "Offer", price: "1300", priceCurrency: "KES" },
        }),
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: trips = [] } = useQuery({
    queryKey: ["route-trips", "isiolo-nairobi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("status", "scheduled")
        .gte("departure_time", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .ilike("route", "%Isiolo%Nairobi%")
        .order("departure_time")
        .limit(9);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <Header />
      <section className="mx-auto max-w-6xl px-4 py-14">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">Route</span>
        <h1 className="mt-3 font-display text-5xl font-bold tracking-tight md:text-6xl">Isiolo → Nairobi</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Book a verified 7-seater Sienta seat for the 285 km journey along the A2 highway. Daily morning
          and evening departures. Pay on board.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Spec icon={Clock} title="≈ 4h 30m" sub="Direct travel time" />
          <Spec icon={Wallet} title="KES 1,300" sub="Per seat, pay on board" />
          <Spec icon={MapPin} title="Total Petrol, Isiolo" sub="Standard pickup point" />
        </div>

        <div className="mt-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-3xl font-bold">Upcoming Isiolo → Nairobi trips</h2>
            <Button asChild variant="ghost">
              <Link to="/trips">All trips <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          {trips.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No upcoming trips for this direction. Check back soon or contact us on WhatsApp.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((t) => <TripCard key={t.id} trip={t} />)}
            </div>
          )}
        </div>
      </section>
      <TrustBadges />
      <Footer />
      <BottomNav />
    </div>
  );
}

function Spec({ icon: Icon, title, sub }: { icon: React.ComponentType<{ className?: string }>; title: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 font-display text-xl font-bold">{title}</div>
      <div className="text-sm text-muted-foreground">{sub}</div>
    </div>
  );
}
