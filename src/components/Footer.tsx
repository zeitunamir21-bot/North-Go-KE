export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="font-display text-2xl font-bold">
            North<span className="text-primary">Go</span>
          </h3>
          <p className="mt-2 text-sm text-secondary-foreground/70">
            Comfortable, reliable rides between Isiolo and Nairobi. Reserve your seat in minutes.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-secondary-foreground/60">
            Contact
          </h4>
          <a
            href="tel:+254790179834"
            className="mt-3 block text-sm hover:text-primary"
          >
            +254 790 179 834
          </a>
          <a
            href="https://wa.me/254790179834"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-secondary-foreground/70 hover:text-primary"
          >
            WhatsApp
          </a>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-secondary-foreground/60">
            Routes
          </h4>
          <p className="mt-3 text-sm">Isiolo → Nairobi</p>
          <p className="text-sm">Nairobi → Isiolo</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-secondary-foreground/60">
        © {new Date().getFullYear()} NorthGo. All rights reserved.
      </div>
    </footer>
  );
}
