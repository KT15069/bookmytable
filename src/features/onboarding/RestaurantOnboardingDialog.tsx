import { useMemo, useState } from "react";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const tableSchema = z.object({
  name: z.string().trim().min(1).max(200),
  min_occupancy: z.coerce.number().int().min(1).max(50),
  max_occupancy: z.coerce.number().int().min(1).max(50),
});

const schema = z
  .object({
    restaurant_name: z.string().trim().min(1).max(120),
    address: z.string().trim().min(1).max(300),
    contact_number: z.string().trim().min(7).max(40),
    number_of_tables: z.coerce.number().int().min(1).max(200),
    table_admin_passcode: z.string().trim().min(6).max(200),
    tables: z.array(tableSchema),
  })
  .refine((v) => v.tables.length === v.number_of_tables, {
    message: "Please configure all tables",
    path: ["tables"],
  })
  .refine((v) => v.tables.every((t) => t.min_occupancy <= t.max_occupancy), {
    message: "Min occupancy cannot exceed max",
    path: ["tables"],
  });

export function RestaurantOnboardingDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone?: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const [restaurantName, setRestaurantName] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [tableAdminPasscode, setTableAdminPasscode] = useState("");
  const [numTables, setNumTables] = useState(6);
  const [tables, setTables] = useState(() =>
    Array.from({ length: 6 }).map((_, i) => ({ name: `Table ${i + 1}`, min_occupancy: 1, max_occupancy: 4 })),
  );

  const tableRows = useMemo(() => {
    const n = Math.max(1, Math.min(200, Number(numTables) || 1));
    if (tables.length === n) return tables;
    if (tables.length < n) {
      return [...tables, ...Array.from({ length: n - tables.length }).map((_, i) => ({
        name: `Table ${tables.length + i + 1}`,
        min_occupancy: 1,
        max_occupancy: 4,
      }))];
    }
    return tables.slice(0, n);
  }, [tables, numTables]);

  async function submit() {
    setBusy(true);
    try {
      const payload = schema.parse({
        restaurant_name: restaurantName,
        address,
        contact_number: contactNumber,
        number_of_tables: numTables,
        table_admin_passcode: tableAdminPasscode,
        tables: tableRows,
      });

      const { data, error } = await supabase.functions.invoke("restaurant-onboarding", { body: payload });
      if (error) throw error;

      toast({ title: "Restaurant created", description: "Your dashboard is ready." });
      qc.invalidateQueries();
      onOpenChange(false);
      onDone?.();
      return data;
    } catch (e: any) {
      // Zod errors are arrays of issues; show a friendly single-line message.
      if (e instanceof z.ZodError) {
        const msg = e.issues?.[0]?.message ?? "Please review your inputs.";
        toast({ title: "Setup failed", description: msg, variant: "destructive" });
        return;
      }
      toast({
        title: "Setup failed",
        description: typeof e?.message === "string" ? e.message : "Please review your inputs.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  function clampOccupancy(n: number) {
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(50, Math.trunc(n)));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Set up your restaurant</DialogTitle>
          <DialogDescription>One-time setup: details + tables + a separate passcode for table customization.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Restaurant name</Label>
                <Input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="e.g. Shubh Daavat" />
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, country" />
              </div>
              <div className="grid gap-2">
                <Label>Contact number</Label>
                <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="Phone number" />
              </div>
              <div className="grid gap-2">
                <Label>Table customization passcode</Label>
                <Input
                  type="password"
                  value={tableAdminPasscode}
                  onChange={(e) => setTableAdminPasscode(e.target.value)}
                  placeholder="Separate from login password"
                />
                <div className="text-xs text-muted-foreground">This is required to add/edit/delete tables later.</div>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Number of tables</Label>
                <Input inputMode="numeric" type="number" min={1} max={200} value={numTables} onChange={(e) => setNumTables(Number(e.target.value))} />
              </div>

              <div className="max-h-[360px] overflow-auto rounded-2xl border border-border/70 bg-background p-3">
                <div className="grid gap-2">
                  {tableRows.map((t, idx) => (
                    <div key={idx} className="grid gap-2 rounded-xl border border-border/70 bg-card p-3">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="sm:col-span-1">
                          <Label className="text-xs">Table name</Label>
                          <Input
                            value={t.name}
                            onChange={(e) =>
                              setTables((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], name: e.target.value };
                                return next;
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Min</Label>
                          <Input
                            inputMode="numeric"
                            type="number"
                            min={1}
                            max={50}
                            value={t.min_occupancy}
                            onChange={(e) =>
                              setTables((prev) => {
                                // Prevent empty string -> 0 and keep Min/Max consistent.
                                if (e.target.value === "") return prev;
                                const next = [...prev];
                                const min = clampOccupancy(Number(e.target.value));
                                const currentMax = clampOccupancy(Number(next[idx]?.max_occupancy ?? 4));
                                next[idx] = {
                                  ...next[idx],
                                  min_occupancy: min,
                                  max_occupancy: Math.max(currentMax, min),
                                };
                                return next;
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max</Label>
                          <Input
                            inputMode="numeric"
                            type="number"
                            min={1}
                            max={50}
                            value={t.max_occupancy}
                            onChange={(e) =>
                              setTables((prev) => {
                                // Prevent empty string -> 0 and keep Min/Max consistent.
                                if (e.target.value === "") return prev;
                                const next = [...prev];
                                const max = clampOccupancy(Number(e.target.value));
                                const currentMin = clampOccupancy(Number(next[idx]?.min_occupancy ?? 1));
                                next[idx] = {
                                  ...next[idx],
                                  max_occupancy: max,
                                  min_occupancy: Math.min(currentMin, max),
                                };
                                return next;
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)} disabled={busy}>
            Not now
          </Button>
          <Button variant="hero" className="rounded-full" onClick={submit} disabled={busy}>
            {busy ? "Creating…" : "Create dashboard"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
