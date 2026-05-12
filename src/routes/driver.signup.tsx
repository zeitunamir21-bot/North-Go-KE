import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/driver/signup")({
  head: () => ({ meta: [{ title: "Apply to drive — NorthGo" }] }),
  component: DriverSignup,
});

function DriverSignup() {
  const navigate = useNavigate();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    vehicle_name: "Toyota Noah",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  // Detect existing session so logged-in users only fill the application part
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setHasSession(!!data.session);
      if (data.session) {
        // Pre-fill email from auth user
        setForm((f) => ({ ...f, email: data.session!.user.email ?? "" }));
        // If they already have a driver row, send them to dashboard
        const { data: existing } = await supabase
          .from("drivers")
          .select("id")
          .eq("user_id", data.session.user.id)
          .maybeSingle();
        if (existing) navigate({ to: "/driver" });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function insertDriverRow(userId: string) {
    const { error: insErr } = await supabase.from("drivers").insert({
      user_id: userId,
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      vehicle_name: form.vehicle_name.trim(),
    });
    if (insErr) throw new Error(insErr.message);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Already signed in? Just attach driver application to current user.
      if (hasSession) {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) throw new Error("Session expired, please sign in again.");
        await insertDriverRow(u.user.id);
        toast.success("Application submitted! Awaiting admin approval.");
        navigate({ to: "/driver" });
        return;
      }

      // New user signup
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { emailRedirectTo: `${window.location.origin}/driver` },
      });

      if (error) {
        // Handle "already registered" by directing them to sign in
        if (/registered|exists/i.test(error.message)) {
          toast.error("An account with this email already exists. Sign in first, then complete your application.");
          navigate({ to: "/driver/login" });
          return;
        }
        throw new Error(error.message);
      }
      if (!data.user) throw new Error("Sign up failed");

      // With auto-confirm enabled, signUp returns a session immediately.
      let session = data.session;
      if (!session) {
        const { data: s, error: signInErr } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (signInErr) throw new Error(signInErr.message);
        session = s.session;
      }

      if (!session) {
        toast.success("Account created. Please check your email to confirm, then sign in to finish your application.");
        navigate({ to: "/driver/login" });
        return;
      }

      await insertDriverRow(session.user.id);
      toast.success("Application submitted! Awaiting admin approval.");
      navigate({ to: "/driver" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <h1 className="font-display text-3xl font-bold">Apply to drive</h1>
          {!hasSession && (
            <p className="mt-1 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/driver/login" className="text-primary underline">
                Sign in
              </Link>
            </p>
          )}
          {hasSession && (
            <p className="mt-1 text-sm text-muted-foreground">
              Signed in. Complete your driver details below.
            </p>
          )}
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label>Full name</Label>
              <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254..." className="mt-1.5 h-11" />
            </div>
            <div>
              <Label>Vehicle</Label>
              <Input required value={form.vehicle_name} onChange={(e) => setForm({ ...form, vehicle_name: e.target.value })} className="mt-1.5 h-11" />
            </div>
            {!hasSession && (
              <>
                <div>
                  <Label>Email</Label>
                  <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1.5 h-11" />
                </div>
              </>
            )}
            <Button type="submit" disabled={loading} size="lg" className="w-full rounded-xl">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit application
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
