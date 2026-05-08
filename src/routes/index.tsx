import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Clock, ShieldCheck, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TripCard } from "@/components/TripCard";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NorthGo — Travel Between Isiolo and Nairobi Easily" },
      {
        name: "description",
        content: "Reserve a seat in minutes. Daily trips. Pay on boarding via cash or M-Pesa. Trusted, comfortable rides.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: trips = [] } = useQuery({
    queryKey: ["trips", "upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .gte("departure_time", new Date().toISOString())
        .order("departure_time")
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="View from a comfortable van traveling toward Mount Kenya at sunrise"
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
              Travel between <span className="text-primary">Isiolo</span> and{" "}
              <span className="text-primary">Nairobi</span> easily.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              Reserve your seat in minutes. Safe, reliable, comfortable. Pay on board — no upfront
              payment.
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
                <a href="tel:+254712345678">Call driver</a>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
              {[
                "Daily Trips",
                "Reserve Without Paying First",
                "Trusted Driver",
                "Comfortable Travel",
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

      {/* WHY US */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-4xl font-bold tracking-tight">Why ride with NorthGo</h2>
          <p className="mt-3 text-muted-foreground">
            Built for the Isiolo-Nairobi corridor. Simple, honest, and made for everyday travelers.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Wallet,
              title: "Pay on board",
              desc: "Cash or M-Pesa after boarding. No deposits, no risk.",
            },
            {
              icon: Clock,
              title: "Always on time",
              desc: "Daily departures. We leave when we say we will.",
            },
            {
              icon: ShieldCheck,
              title: "Trusted drivers",
              desc: "Experienced, vetted, and friendly drivers you can call directly.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRIPS PREVIEW */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
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
            No app, no login. Just your name and phone — we'll confirm your seat instantly.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="mt-8 h-14 rounded-xl px-8 text-base font-semibold"
          >
            <Link to="/trips">Book your seat</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
