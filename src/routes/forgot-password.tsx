import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — NorthGo" }] }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Sends a 6-digit OTP code (free, via Supabase built-in email)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("We sent a 6-digit code to your email.");
    navigate({
      to: "/reset-password",
      search: { email: email.trim() },
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold">Forgot password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we'll send you a 6-digit verification code.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label>Email</Label>
              <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" />
            </div>
            <Button type="submit" disabled={loading} size="lg" className="w-full rounded-xl">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send code
            </Button>
          </form>
          <div className="mt-6 flex justify-between text-sm text-muted-foreground">
            <Link to="/driver/login" className="hover:text-foreground">Driver sign in</Link>
            <Link to="/admin/login" className="hover:text-foreground">Admin sign in</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
