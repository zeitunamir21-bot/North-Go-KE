import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How do I book a seat from Isiolo to Nairobi?",
    a: "Pick an upcoming trip from the Trips page, choose your seat on the matatu map, enter your name and phone, and confirm. Your seat is reserved instantly — no upfront payment.",
  },
  {
    q: "How much is a ticket between Isiolo and Nairobi?",
    a: "Standard fare is KES 1,300 per seat, payable on board in cash or via M-Pesa to the driver. Pricing may vary per trip and is shown on each listing.",
  },
  {
    q: "Where is the pickup point in Isiolo?",
    a: "Most trips depart from Total Petrol Station, Isiolo, but each trip lists its own pickup point. Confirm with the driver on WhatsApp after booking.",
  },
  {
    q: "Can I cancel or change my booking?",
    a: "Yes. Create a free account and visit My Bookings to cancel a confirmed reservation. Cancelled seats are released back to other passengers immediately.",
  },
  {
    q: "Are NorthGo drivers verified?",
    a: "Every driver on NorthGo is approved by our admin team. You can view a driver's profile, vehicle, plate number, and passenger reviews before you book.",
  },
  {
    q: "Do you offer matatu booking for groups?",
    a: "Yes. Pick the number of seats you need on the booking page. For full-vehicle bookings or chartered trips, call the driver directly from the trip listing.",
  },
];

export function FAQ() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <div className="mb-10 text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight">
          Frequently asked questions
        </h2>
        <p className="mt-2 text-muted-foreground">
          Everything you need to know about Isiolo ⇄ Nairobi travel with NorthGo.
        </p>
      </div>
      <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-2 shadow-[var(--shadow-card)]">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="px-4">
            <AccordionTrigger className="text-left font-semibold">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
