import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
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
            Routes
          </h4>
          <Link to="/isiolo-to-nairobi" className="mt-3 block text-sm hover:text-primary">
            Isiolo → Nairobi
          </Link>
          <Link to="/nairobi-to-isiolo" className="block text-sm hover:text-primary">
            Nairobi → Isiolo
          </Link>
          <Link to="/trips" className="block text-sm text-secondary-foreground/70 hover:text-primary">
            All trips
          </Link>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-secondary-foreground/60">
            Company
          </h4>
          <Link to="/about" className="mt-3 block text-sm hover:text-primary">About</Link>
          <Link to="/faq" className="block text-sm hover:text-primary">FAQ</Link>
          <Link to="/contact" className="block text-sm hover:text-primary">Contact</Link>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-secondary-foreground/60">
            Contact
          </h4>
          <a href="tel:+254790179834" className="mt-3 block text-sm hover:text-primary">
            +254 790 179 834
          </a>
          <a
            href="https://wa.me/254790179834"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-secondary-foreground/70 hover:text-primary"
          >
            WhatsApp support
          </a>
          <a href="mailto:hello@northgo.co.ke" className="block text-sm text-secondary-foreground/70 hover:text-primary">
            hello@northgo.co.ke
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-secondary-foreground/60">
        © {new Date().getFullYear()} NorthGo. All rights reserved.
      </div>
    </footer>
  );
}
