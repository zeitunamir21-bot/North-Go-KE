import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StickyBookCTA() {
  return (
    <div className="fixed inset-x-0 bottom-14 z-30 px-4 pb-2 md:hidden">
      <Button
        asChild
        size="lg"
        className="h-12 w-full rounded-xl text-base font-semibold shadow-[var(--shadow-elevated)]"
      >
        <Link to="/trips">
          Book your seat <ArrowRight className="ml-1 h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
}
