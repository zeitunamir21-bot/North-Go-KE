import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_WHATSAPP = "254729588851"; // 0729588851 in international format, no '+'

const InputSchema = z.object({
  driverName: z.string().min(1).max(120),
  phone: z.string().min(1).max(40),
  vehicle: z.string().min(1).max(120),
});

export const notifyDriverApplication = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.CALLMEBOT_API_KEY;
    if (!apiKey) {
      console.warn("CALLMEBOT_API_KEY not configured; skipping WhatsApp notification");
      return { sent: false, reason: "no_api_key" };
    }
    const text = `🚐 New NorthGo driver application\nName: ${data.driverName}\nPhone: ${data.phone}\nVehicle: ${data.vehicle}\nReview: https://no-pay-routes.lovable.app/admin`;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_WHATSAPP}&text=${encodeURIComponent(text)}&apikey=${apiKey}`;
    try {
      const res = await fetch(url, { method: "GET" });
      const body = await res.text();
      if (!res.ok) {
        console.error(`CallMeBot error ${res.status}: ${body}`);
        return { sent: false, reason: `http_${res.status}` };
      }
      return { sent: true };
    } catch (err) {
      console.error("CallMeBot request failed", err);
      return { sent: false, reason: "network_error" };
    }
  });
