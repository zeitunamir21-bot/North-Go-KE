import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            North<span className="text-primary">Go</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground bg-accent" }}
            className="rounded-lg px-3 py-2 text-muted-foreground transition hover:text-foreground"
          >
            Home
          </Link>
          <Link
            to="/trips"
            activeProps={{ className: "text-foreground bg-accent" }}
            className="rounded-lg px-3 py-2 text-muted-foreground transition hover:text-foreground"
          >
            Trips
          </Link>
          <Link
            to="/admin"
            activeProps={{ className: "text-foreground bg-accent" }}
            className="rounded-lg px-3 py-2 text-muted-foreground transition hover:text-foreground"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
