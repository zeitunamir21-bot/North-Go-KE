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

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin login — NorthGo" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      setLoading(false);
      return toast.error(error?.message ?? "Sign in failed");
    }
    // Verify admin role before allowing entry
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    setLoading(false);
    if (!roleRow) {
      await supabase.auth.signOut();
      return toast.error("This account is not authorized for admin access.");
    }
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <h1 className="font-display text-3xl font-bold">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Restricted to NorthGo administrators.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
            <Button type="submit" disabled={loading} size="lg" className="w-full rounded-xl">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            <Link to="/">← Back to NorthGo</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
