import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
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
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    vehicle_name: "Toyota Noah",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/driver` },
    });
    if (error || !data.user) {
      setLoading(false);
      return toast.error(error?.message ?? "Sign up failed");
    }

    // Wait briefly for session, then insert driver row
    let session = data.session;
    if (!session) {
      const { data: s } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      session = s.session;
    }

    if (!session) {
      setLoading(false);
      toast.success("Check your email to confirm your account, then sign in.");
      navigate({ to: "/driver/login" });
      return;
    }

    const { error: insErr } = await supabase.from("drivers").insert({
      user_id: session.user.id,
      full_name: form.full_name,
      phone: form.phone,
      vehicle_name: form.vehicle_name,
    });
    setLoading(false);
    if (insErr) return toast.error(insErr.message);
    toast.success("Application submitted! Awaiting admin approval.");
    navigate({ to: "/driver" });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <h1 className="font-display text-3xl font-bold">Apply to drive</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/driver/login" className="text-primary underline">
              Sign in
            </Link>
          </p>
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
            <div>
              <Label>Email</Label>
              <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label>Password</Label>
              <Input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1.5 h-11" />
            </div>
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
