import { ShieldCheck, BadgeCheck, Lock, Phone } from "lucide-react";

const badges = [
  { icon: ShieldCheck, title: "Vetted drivers", desc: "Every driver verified by NorthGo admins." },
  { icon: BadgeCheck, title: "Real reviews", desc: "Ratings from actual passengers only." },
  { icon: Lock, title: "No upfront pay", desc: "Pay the driver on board. Zero booking risk." },
  { icon: Phone, title: "Direct line", desc: "Call or WhatsApp the driver from the app." },
];

export function TrustBadges() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] md:grid-cols-4">
        {badges.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <div className="text-sm font-semibold leading-tight">{title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
