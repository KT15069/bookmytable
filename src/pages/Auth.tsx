import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { RestaurantOnboardingDialog } from "@/features/onboarding/RestaurantOnboardingDialog";

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(8).max(72);

export default function Auth() {
  const { toast } = useToast();
  const nav = useNavigate();
  const loc = useLocation() as any;
  const { session } = useAuth();

  const from = useMemo(() => (typeof loc?.state?.from === "string" ? loc.state.from : "/"), [loc?.state?.from]);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (!session) return;

    // If the user has no restaurant yet, open onboarding.
    supabase
      .from("restaurant_members")
      .select("restaurant_id")
      .limit(1)
      .then(({ data, error }) => {
        if (error) return;
        if (!data || data.length === 0) setOnboardingOpen(true);
        else nav(from, { replace: true });
      });
  }, [session, nav, from]);

  async function submit() {
    setBusy(true);
    try {
      const e = emailSchema.parse(email);
      const p = passwordSchema.parse(password);

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
        if (error) throw error;
        toast({ title: "Signed in" });
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email: e,
        password: p,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;

      toast({
        title: "Account created",
        description: "If email confirmation is enabled, check your inbox to finish signup.",
      });
    } catch (err: any) {
      toast({
        title: "Authentication failed",
        description: typeof err?.message === "string" ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-hero">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-3xl tracking-tight">Welcome back</CardTitle>
              <p className="text-sm text-muted-foreground">Sign in to manage your restaurant dashboard.</p>
            </CardHeader>
            <CardContent className="grid gap-5">
              <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
                <TabsList className="h-12 w-full justify-start rounded-full bg-muted/60 p-1 shadow-card">
                  <TabsTrigger value="signin" className="rounded-full px-5 transition-transform data-[state=active]:scale-[1.02]">
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-full px-5 transition-transform data-[state=active]:scale-[1.02]">
                    Sign up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-5 grid gap-4">
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@restaurant.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Password</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="mt-5 grid gap-4">
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@restaurant.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Password</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
                    <div className="text-xs text-muted-foreground">We’ll ask for restaurant details right after you sign up.</div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                variant="hero"
                className="w-full rounded-full transition-transform active:scale-[0.99]"
                onClick={submit}
                disabled={busy}
              >
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>

              <div className="text-xs text-muted-foreground">
                Tip: for faster testing you can disable “Confirm email” in Supabase Auth settings.
              </div>
            </CardContent>
          </Card>

          <RestaurantOnboardingDialog
            open={onboardingOpen}
            onOpenChange={setOnboardingOpen}
            onDone={() => nav(from, { replace: true })}
          />
        </div>
      </div>
    </main>
  );
}
