import { MessageCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const WA = "254790179834";

export function ContactSupport() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)] md:p-12">
        <div className="grid items-center gap-6 md:grid-cols-[1.3fr,1fr]">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Need help with a booking?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Our team is on WhatsApp 7 days a week. Reach out for trip changes, refunds, or
              questions about the route.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild size="lg" className="h-12 rounded-xl">
              <a href={`https://wa.me/${WA}?text=${encodeURIComponent("Hi NorthGo, I need help with a booking.")}`} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp support
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-xl">
              <a href={`tel:+${WA}`}>
                <Phone className="mr-2 h-4 w-4" /> Call +254 790 179834
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="mailto:hello@northgo.co.ke">
                <Mail className="mr-2 h-4 w-4" /> hello@northgo.co.ke
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
