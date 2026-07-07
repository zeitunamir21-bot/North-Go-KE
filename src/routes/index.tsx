import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowRight, Check, Clock, ShieldCheck, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TripCard } from "@/components/TripCard";
import { ReviewsSection } from "@/components/ReviewsSection";
import { StatsRow } from "@/components/StatsRow";
import { TrustBadges } from "@/components/TrustBadges";
import { RouteInfo } from "@/components/RouteInfo";
import { FAQ } from "@/components/FAQ";
import { ContactSupport } from "@/components/ContactSupport";
import { BottomNav } from "@/components/BottomNav";
import { StickyBookCTA } from "@/components/StickyBookCTA";
import { PromoBanner } from "@/components/PromoBanner";
import { DownloadApkButton } from "@/components/DownloadApkButton";

import heroImg from "@/assets/hero-van.jpg";

const HOME_URL = "https://no-pay-routes.lovable.app/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NorthGo — Isiolo ⇄ Nairobi 7-Seater Sienta Booking in Kenya" },
      {
        name: "description",
        content:
          "Book your Isiolo ⇄ Nairobi seat online in minutes. Daily 7-seater Sienta trips, real-time seat availability, verified Kenyan drivers, pay on board — no upfront deposit.",
      },
      { name: "keywords", content: "Isiolo to Nairobi booking, Nairobi to Isiolo, Sienta booking Kenya, Isiolo Nairobi travel, book transport online Kenya, NorthGo" },
      { property: "og:title", content: "NorthGo — Book Your Isiolo ⇄ Nairobi Seat in Minutes" },
      { property: "og:description", content: "Safe, reliable, and affordable Kenyan intercity travel with real-time seat availability. Verified drivers. Pay on board." },
      { property: "og:url", content: HOME_URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "NorthGo — Isiolo ⇄ Nairobi Booking" },
      { name: "twitter:description", content: "Daily 7-seater Sienta rides. Live seat availability, verified drivers, pay on board." },
    ],
    links: [{ rel: "canonical", href: HOME_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "NorthGo — Isiolo ⇄ Nairobi 7-Seater Sienta Booking in Kenya",
          url: HOME_URL,
          description: "Book your Isiolo ⇄ Nairobi seat online. Daily 7-seater Sienta trips, verified Kenyan drivers, pay on board.",
          isPartOf: { "@id": "https://no-pay-routes.lovable.app/#website" },
          about: { "@id": "https://no-pay-routes.lovable.app/#organization" },
          primaryImageOfPage: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/23f4e545-2583-4432-990c-1431b6d34504",
        }),
      },
    ],
  }),
  component: Home,
});

function Home() {
  const qc = useQueryClient();
  const { data: trips = [] } = useQuery({
    queryKey: ["trips", "upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_upcoming_trips_public");
      if (error) throw error;
      return ((data ?? []) as any[]).slice(0, 3);
    },
  });

  // Live availability: refresh when any trip changes
  useEffect(() => {
    const channel = supabase
      .channel("home-trips")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => {
        qc.invalidateQueries({ queryKey: ["trips", "upcoming"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);


  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <PromoBanner />
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="View from a comfortable 7-seater Sienta traveling toward Mount Kenya at sunrise"
          width={1600}
          height={1024}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-36">
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Daily trips · Isiolo ⇄ Nairobi
            </span>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Book your <span className="text-primary">Isiolo ⇄ Nairobi</span> seat in minutes.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              Safe, reliable, and affordable travel with real-time seat availability. Verified
              Kenyan drivers, transparent fares, pay on board.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-14 rounded-xl px-8 text-base font-semibold">
                <Link to="/trips">
                  Book your seat <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 rounded-xl border-white/30 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur hover:bg-white/20 hover:text-white"
              >
                <a href="tel:+254790179834">Call driver</a>
              </Button>
              <DownloadApkButton variant="hero" />
            </div>
            <p className="mt-3 text-xs text-white/70">
              Get the Android app · APK 4 MB · Enable "Install unknown apps" on your phone if prompted.
            </p>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
              {[
                "Daily Trips",
                "Live Seat Availability",
                "Verified Drivers",
                "Pay on Board",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* STATS */}
      <StatsRow />

      {/* TRUST BADGES */}
      <TrustBadges />

      {/* WHY US */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-4xl font-bold tracking-tight">Why ride with NorthGo</h2>
          <p className="mt-3 text-muted-foreground">
            Built for the Isiolo-Nairobi corridor. Simple, honest, and made for everyday travelers.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Wallet, title: "Pay on board", desc: "Cash or M-Pesa after boarding. No deposits, no risk." },
            { icon: Clock, title: "Always on time", desc: "Daily departures. We leave when we say we will." },
            { icon: ShieldCheck, title: "Trusted drivers", desc: "Experienced, vetted, and friendly drivers you can call directly." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ROUTE INFO */}
      <RouteInfo />

      {/* TRIPS PREVIEW */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-4xl font-bold tracking-tight">Upcoming trips</h2>
            <p className="mt-2 text-muted-foreground">Pick a departure that works for you.</p>
          </div>
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link to="/trips">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {trips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No upcoming trips listed yet. Check back soon.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((t) => <TripCard key={t.id} trip={t} />)}
          </div>
        )}
      </section>

      <ReviewsSection />
      <FAQ />
      <ContactSupport />

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div
          className="overflow-hidden rounded-3xl p-10 text-white shadow-[var(--shadow-elevated)] md:p-16"
          style={{ background: "var(--gradient-primary)" }}
        >
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            Ready to ride? Reserve in 30 seconds.
          </h2>
          <p className="mt-3 max-w-xl text-white/90">
            No app, no login required. Just your name and phone — we'll confirm your seat instantly.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 h-14 rounded-xl px-8 text-base font-semibold">
            <Link to="/trips">Book your seat</Link>
          </Button>
        </div>
      </section>

      <Footer />
      <StickyBookCTA />
      <BottomNav />
    </div>
  );
}
