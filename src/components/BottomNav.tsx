import { Link } from "@tanstack/react-router";
import { Home, Calendar, Ticket, User } from "lucide-react";

const items: { to: "/" | "/trips" | "/my-bookings" | "/auth"; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/trips", label: "Trips", icon: Calendar },
  { to: "/my-bookings", label: "Bookings", icon: Ticket },
  { to: "/auth", label: "Account", icon: User },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={exact ? { exact: true } : undefined}
              activeProps={{ className: "text-primary" }}
              className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-[11px] font-medium text-muted-foreground transition-colors"
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
