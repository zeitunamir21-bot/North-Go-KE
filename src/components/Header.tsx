import { Link } from "@tanstack/react-router";
import { MapPin, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const { session } = useAuth();
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
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          <NavLink to="/" exact>Home</NavLink>
          <NavLink to="/trips">Trips</NavLink>
          <NavLink to="/my-bookings">My Bookings</NavLink>
          <NavLink to="/driver">Driver</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            to={session ? "/my-bookings" : "/auth"}
            className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold md:inline-flex"
          >
            <UserIcon className="h-3.5 w-3.5" />
            {session ? "Account" : "Sign in"}
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  to,
  exact,
  children,
}: {
  to: "/" | "/trips" | "/my-bookings" | "/driver" | "/admin";
  exact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      activeOptions={exact ? { exact: true } : undefined}
      activeProps={{ className: "text-foreground bg-accent" }}
      className="rounded-lg px-3 py-2 text-muted-foreground transition hover:text-foreground"
    >
      {children}
    </Link>
  );
}
