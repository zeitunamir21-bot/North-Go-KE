import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { StatsRow } from "@/components/StatsRow";
import { TrustBadges } from "@/components/TrustBadges";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Heart, Users, Compass } from "lucide-react";

const URL = "https://no-pay-routes.lovable.app/about";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About NorthGo — Trusted Isiolo ⇄ Nairobi Transport" },
      { name: "description", content: "NorthGo connects travelers with verified Kenyan drivers on the Isiolo ⇄ Nairobi route. Learn our story, mission, and safety standards." },
      { property: "og:title", content: "About NorthGo — Trusted Isiolo ⇄ Nairobi Transport" },
      { property: "og:description", content: "Verified drivers, fair fares, and reliable daily departures between Isiolo and Nairobi." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <Header />
      <section className="mx-auto max-w-4xl px-4 py-16">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">Our story</span>
        <h1 className="mt-3 font-display text-5xl font-bold tracking-tight">Built for the Isiolo ⇄ Nairobi corridor.</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          NorthGo started with one simple idea: travelers between Isiolo and Nairobi deserve a transparent,
          trustworthy way to book a seat — without calling around, queuing at the stage, or risking a
          no-show. We connect everyday Kenyans with vetted van drivers, real seat availability,
          and honest fares.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            { icon: Heart, title: "Our mission", body: "Make intercity travel safe, fair, and effortless for every Kenyan family." },
            { icon: Compass, title: "Our route", body: "We focus on the 285 km A2 highway between Isiolo and Nairobi — and we do it well." },
            { icon: ShieldCheck, title: "Our standard", body: "Every driver is approved, every vehicle is named, every passenger leaves a review." },
            { icon: Users, title: "Our community", body: "Thousands of travelers, drivers, and families that depend on us each month." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold">{title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <StatsRow />
      <TrustBadges />

      <section className="mx-auto max-w-4xl px-4 pb-20 text-center">
        <h2 className="font-display text-3xl font-bold">Ready to ride?</h2>
        <p className="mt-2 text-muted-foreground">Browse upcoming trips and reserve your seat in under a minute.</p>
        <Button asChild size="lg" className="mt-6 h-12 rounded-xl px-8">
          <Link to="/trips">See upcoming trips</Link>
        </Button>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
