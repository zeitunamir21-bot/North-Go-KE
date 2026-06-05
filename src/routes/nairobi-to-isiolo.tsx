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

const URL = "https://no-pay-routes.lovable.app/nairobi-to-isiolo";

export const Route = createFileRoute("/nairobi-to-isiolo")({
  head: () => ({
    meta: [
      { title: "Nairobi to Isiolo Booking — Book a Van Seat Online | NorthGo" },
      { name: "description", content: "Book your Nairobi to Isiolo van seat online. Daily trips on the A2 highway. Verified drivers. KES 1,300. Pay on board." },
      { name: "keywords", content: "Nairobi to Isiolo, Nairobi Isiolo booking, van Nairobi Isiolo, transport Nairobi Isiolo, Nairobi Isiolo fare" },
      { property: "og:title", content: "Nairobi to Isiolo — Book a Seat Online" },
      { property: "og:description", content: "Daily Nairobi to Isiolo van trips. Verified drivers, real seat availability, pay on board." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Intercity van transport",
          areaServed: ["Nairobi", "Isiolo", "Kenya"],
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
    queryKey: ["route-trips", "nairobi-isiolo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("status", "scheduled")
        .gte("departure_time", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .ilike("route", "%Nairobi%Isiolo%")
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
        <h1 className="mt-3 font-display text-5xl font-bold tracking-tight md:text-6xl">Nairobi → Isiolo</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Book a verified van seat back to Isiolo from Nairobi. Daily departures from CBD,
          smooth A2 highway, scenic Mount Kenya views. Pay on board.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Spec icon={Clock} title="≈ 4h 30m" sub="Direct travel time" />
          <Spec icon={Wallet} title="KES 1,300" sub="Per seat, pay on board" />
          <Spec icon={MapPin} title="Tea Room / River Road" sub="Standard Nairobi pickup" />
        </div>

        <div className="mt-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-3xl font-bold">Upcoming Nairobi → Isiolo trips</h2>
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
