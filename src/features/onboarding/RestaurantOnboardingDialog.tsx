import { useEffect, useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type SeatSize = 2 | 4 | 6 | 8;
type MixState = Record<SeatSize, number>;

const seatTypeConfig: { size: SeatSize; min: number; max: number }[] = [
  { size: 2, min: 1, max: 2 },
  { size: 4, min: 2, max: 4 },
  { size: 6, min: 4, max: 6 },
  { size: 8, min: 6, max: 8 },
];

const presetMixes = {
  small: { 2: 2, 4: 4, 6: 1, 8: 0 } satisfies MixState,
  standard: { 2: 4, 4: 6, 6: 2, 8: 1 } satisfies MixState,
  large: { 2: 6, 4: 10, 6: 4, 8: 2 } satisfies MixState,
} as const;

type PresetKey = keyof typeof presetMixes;

type TablePayloadRow = {
  name: string;
  min_occupancy: number;
  max_occupancy: number;
};

async function extractEdgeFunctionErrorMessage(err: any): Promise<string | null> {
  const res: Response | undefined = err?.context;
  if (res && typeof (res as any).json === "function") {
    try {
      const body = await (res as any).json();
      const msg = body?.error ?? body?.message;
      if (typeof msg === "string" && msg.trim()) return msg;
      return JSON.stringify(body);
    } catch {
      // ignore
    }
  }
  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return null;
}

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
    table_admin_passcode: z.string().trim().min(6).max(200),
    tables: z.array(tableSchema).min(1).max(200),
  })
  .refine((v) => v.tables.every((t) => t.min_occupancy <= t.max_occupancy), {
    message: "Min occupancy cannot exceed max",
    path: ["tables"],
  });

function clampCount(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(60, Math.trunc(n)));
}

function clampOccupancy(n: number) {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(50, Math.trunc(n)));
}

function generateTablesFromMix(mix: MixState): TablePayloadRow[] {
  const rows: TablePayloadRow[] = [];
  for (const cfg of seatTypeConfig) {
    const count = clampCount(mix[cfg.size]);
    for (let i = 0; i < count; i += 1) {
      rows.push({
        name: `Table ${rows.length + 1}`,
        min_occupancy: cfg.min,
        max_occupancy: cfg.max,
      });
    }
  }
  return rows;
}

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

  const [preset, setPreset] = useState<PresetKey | "custom">("standard");
  const [seatMix, setSeatMix] = useState<MixState>(presetMixes.standard);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [advancedTables, setAdvancedTables] = useState<TablePayloadRow[]>(() => generateTablesFromMix(presetMixes.standard));

  const generatedTables = useMemo(() => generateTablesFromMix(seatMix), [seatMix]);

  useEffect(() => {
    setAdvancedTables(generatedTables);
  }, [generatedTables]);

  const tableRows = advancedMode ? advancedTables : generatedTables;
  const totalTables = tableRows.length;

  async function submit() {
    setBusy(true);
    try {
      const payload = schema.parse({
        restaurant_name: restaurantName,
        address,
        contact_number: contactNumber,
        table_admin_passcode: tableAdminPasscode,
        tables: tableRows,
      });

      const { data, error } = await supabase.functions.invoke("restaurant-onboarding", {
        body: {
          ...payload,
          number_of_tables: payload.tables.length,
        },
      });

      if (error) {
        const msg = await extractEdgeFunctionErrorMessage(error);
        toast({
          title: "Setup failed",
          description: msg ?? "Edge Function returned a non-2xx status code",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Restaurant created", description: "Your dashboard is ready." });
      qc.invalidateQueries();
      onOpenChange(false);
      onDone?.();
      return data;
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        const msg = e.issues?.[0]?.message ?? "Please review your inputs.";
        toast({ title: "Setup failed", description: msg, variant: "destructive" });
        return;
      }
      const msg = await extractEdgeFunctionErrorMessage(e);
      toast({ title: "Setup failed", description: msg ?? "Please review your inputs.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Set up your restaurant</DialogTitle>
          <DialogDescription>Quick setup: details + table mix + a passcode for future table edits.</DialogDescription>
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
                <Label>Layout preset</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(presetMixes) as PresetKey[]).map((key) => (
                    <Button
                      key={key}
                      type="button"
                      variant={preset === key ? "default" : "outline"}
                      className="rounded-full capitalize"
                      onClick={() => {
                        setPreset(key);
                        setSeatMix(presetMixes[key]);
                      }}
                    >
                      {key}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Table mix</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {seatTypeConfig.map((cfg) => (
                    <div key={cfg.size} className="grid gap-1 rounded-xl border border-border/70 bg-background px-3 py-2">
                      <Label className="text-xs">{cfg.size}-seater tables</Label>
                      <Input
                        inputMode="numeric"
                        type="number"
                        min={0}
                        max={60}
                        value={seatMix[cfg.size]}
                        onChange={(e) => {
                          setPreset("custom");
                          setSeatMix((prev) => ({ ...prev, [cfg.size]: clampCount(Number(e.target.value)) }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-muted-foreground">
                Total tables: {totalTables} · 2-seat: {seatMix[2]} · 4-seat: {seatMix[4]} · 6-seat: {seatMix[6]} · 8+-seat: {seatMix[8]}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-foreground">Advanced customize</div>
                  <div className="text-xs text-muted-foreground">Optional: edit table names and min/max occupancy now.</div>
                </div>
                <Switch checked={advancedMode} onCheckedChange={setAdvancedMode} />
              </div>

              {advancedMode ? (
                <div className="max-h-[220px] overflow-auto rounded-2xl border border-border/70 bg-background p-3">
                  <div className="grid gap-2">
                    {advancedTables.map((t, idx) => (
                      <div key={idx} className="grid gap-2 rounded-xl border border-border/70 bg-card p-3 sm:grid-cols-3">
                        <div className="grid gap-1">
                          <Label className="text-xs">Table name</Label>
                          <Input
                            value={t.name}
                            onChange={(e) =>
                              setAdvancedTables((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], name: e.target.value };
                                return next;
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">Min guests</Label>
                          <Input
                            inputMode="numeric"
                            type="number"
                            min={1}
                            max={50}
                            value={t.min_occupancy}
                            onChange={(e) =>
                              setAdvancedTables((prev) => {
                                if (e.target.value === "") return prev;
                                const next = [...prev];
                                const min = clampOccupancy(Number(e.target.value));
                                next[idx] = {
                                  ...next[idx],
                                  min_occupancy: min,
                                  max_occupancy: Math.max(next[idx].max_occupancy, min),
                                };
                                return next;
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">Max guests</Label>
                          <Input
                            inputMode="numeric"
                            type="number"
                            min={1}
                            max={50}
                            value={t.max_occupancy}
                            onChange={(e) =>
                              setAdvancedTables((prev) => {
                                if (e.target.value === "") return prev;
                                const next = [...prev];
                                const max = clampOccupancy(Number(e.target.value));
                                next[idx] = {
                                  ...next[idx],
                                  max_occupancy: max,
                                  min_occupancy: Math.min(next[idx].min_occupancy, max),
                                };
                                return next;
                              })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="text-xs text-muted-foreground">You can fine-tune tables later in Settings.</div>
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
