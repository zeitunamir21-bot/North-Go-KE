import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

type Search = { email?: string };

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — NorthGo" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const { email: initialEmail } = Route.useSearch();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: vErr } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      if (vErr) throw new Error(vErr.message);
      const { error: uErr } = await supabase.auth.updateUser({ password });
      if (uErr) throw new Error(uErr.message);
      toast.success("Password updated. You're signed in.");

      // Route based on role
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", u.user.id)
          .eq("role", "admin")
          .maybeSingle();
        navigate({ to: role ? "/admin" : "/driver" });
      } else {
        navigate({ to: "/driver/login" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the 6-digit code we emailed you and choose a new password.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label>Email</Label>
              <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <Label>6-digit code</Label>
              <Input
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="mt-1.5 h-11 tracking-[0.5em] text-center font-mono text-lg"
                placeholder="••••••"
              />
            </div>
            <div>
              <Label>New password</Label>
              <Input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
            <Button type="submit" disabled={loading} size="lg" className="w-full rounded-xl">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="hover:text-foreground">Resend code</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
