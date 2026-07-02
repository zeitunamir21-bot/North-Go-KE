// Guarded service worker registration. Only registers in production on the
// real deployed origin — never in Lovable preview, iframe, dev, or when the
// user visits with ?sw=off.
const SW_URL = "/sw.js";

function shouldSkip(): boolean {
  if (typeof window === "undefined") return true;
  if (!("serviceWorker" in navigator)) return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  ) {
    return true;
  }
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterMatching() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      const url = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL;
      if (url && new URL(url).pathname === SW_URL) {
        await reg.unregister();
      }
    }
  } catch {
    /* ignore */
  }
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (shouldSkip()) {
    void unregisterMatching();
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch((err) => {
      console.warn("SW registration failed", err);
    });
  });
}
