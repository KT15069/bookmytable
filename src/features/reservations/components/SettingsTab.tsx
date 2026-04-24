import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { DEFAULT_BUSINESS_HOURS } from "../constants";
import {
  adminCreateTable,
  adminDeleteTable,
  adminUpdateTable,
  fetchRestaurantTables,
} from "../tablesApi";

const SETTINGS_KEY = "restaurant.settings.v1";
const TABLE_ADMIN_KEY = "restaurant.tables.adminPasscode.v1";

export type DailyBusinessHours = { start: string; end: string };

export type SettingsState = {
  businessHours: DailyBusinessHours;
  weeklyBusinessHours: DailyBusinessHours[];
};

export function getBusinessHoursForDate(settings: SettingsState, date: Date): DailyBusinessHours {
  const idx = date.getDay();
  const fromWeek = settings.weeklyBusinessHours?.[idx];
  return {
    start: fromWeek?.start ?? settings.businessHours.start ?? DEFAULT_BUSINESS_HOURS.start,
    end: fromWeek?.end ?? settings.businessHours.end ?? DEFAULT_BUSINESS_HOURS.end,
  };
}

function ensureWeeklyHours(hours: DailyBusinessHours | undefined, weekly: any): DailyBusinessHours[] {
  const fallback: DailyBusinessHours = {
    start: hours?.start ?? DEFAULT_BUSINESS_HOURS.start,
    end: hours?.end ?? DEFAULT_BUSINESS_HOURS.end,
  };
  if (Array.isArray(weekly) && weekly.length === 7) {
    return weekly.map((d) => ({
      start: typeof d?.start === "string" ? d.start : fallback.start,
      end: typeof d?.end === "string" ? d.end : fallback.end,
    }));
  }
  return Array.from({ length: 7 }, () => ({ ...fallback }));
}

function summarizeWeekly(week: DailyBusinessHours[]) {
  if (!Array.isArray(week) || week.length !== 7) return "Not set";
  const first = week[0];
  const allSame = week.every((d) => d.start === first.start && d.end === first.end);
  return allSame ? `Every day: ${first.start}–${first.end}` : "Custom by day";
}

function clampGuests(n: number) {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(50, Math.trunc(n)));
}

export function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {
        businessHours: DEFAULT_BUSINESS_HOURS,
        weeklyBusinessHours: ensureWeeklyHours(DEFAULT_BUSINESS_HOURS, null),
      };
    }
    const parsed = JSON.parse(raw) as SettingsState;
    const businessHours = {
      start: (parsed as any)?.businessHours?.start ?? DEFAULT_BUSINESS_HOURS.start,
      end: (parsed as any)?.businessHours?.end ?? DEFAULT_BUSINESS_HOURS.end,
    };
    return {
      businessHours,
      weeklyBusinessHours: ensureWeeklyHours(businessHours, (parsed as any)?.weeklyBusinessHours),
    };
  } catch {
    return {
      businessHours: DEFAULT_BUSINESS_HOURS,
      weeklyBusinessHours: ensureWeeklyHours(DEFAULT_BUSINESS_HOURS, null),
    };
  }
}

export function saveSettings(next: SettingsState) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}

export function SettingsTab({
  settings,
  onChange,
}: {
  settings: SettingsState;
  onChange: (s: SettingsState) => void;
}) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [adminPasscode, setAdminPasscode] = useState(() => {
    try {
      return localStorage.getItem(TABLE_ADMIN_KEY) ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      const v = adminPasscode.trim();
      if (v) localStorage.setItem(TABLE_ADMIN_KEY, v);
      else localStorage.removeItem(TABLE_ADMIN_KEY);
    } catch {
      // ignore
    }
  }, [adminPasscode]);

  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ["restaurant_tables"],
    queryFn: fetchRestaurantTables,
    enabled: isSupabaseConfigured,
  });

  const tableRows = tablesData?.rows ?? [];
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableName, setNewTableName] = useState("");
  const [newMinGuests, setNewMinGuests] = useState("1");
  const [newMaxGuests, setNewMaxGuests] = useState("4");

  const [nameEdits, setNameEdits] = useState<Record<string, string>>({});
  const [minEdits, setMinEdits] = useState<Record<string, string>>({});
  const [maxEdits, setMaxEdits] = useState<Record<string, string>>({});
  const [weeklyHoursOpen, setWeeklyHoursOpen] = useState(false);

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

  async function showActionError(title: string, err: any, fallback: string) {
    const message = await extractEdgeFunctionErrorMessage(err);
    toast({ title, description: message ?? fallback, variant: "destructive" });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4">
            <div>
              <div className="font-medium">Dark theme</div>
              <div className="text-sm text-muted-foreground">Toggle a sober dark mode for late shifts.</div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Business hours</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4">
            <div>
              <div className="font-medium text-foreground">Weekly hours</div>
              <div className="text-sm text-muted-foreground">{summarizeWeekly(settings.weeklyBusinessHours)}</div>
            </div>

            <Dialog open={weeklyHoursOpen} onOpenChange={setWeeklyHoursOpen}>
              <Button variant="outline" className="rounded-full" onClick={() => setWeeklyHoursOpen(true)}>
                Edit weekly hours
              </Button>
              <DialogContent className="w-[min(1100px,calc(100vw-2rem))] max-w-none">
                <DialogHeader>
                  <DialogTitle className="font-display">Business hours (weekly)</DialogTitle>
                  <DialogDescription>Set opening and closing times for each day. Bookings are blocked outside these hours.</DialogDescription>
                </DialogHeader>

                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  {([
                    "Sunday",
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ] as const).map((label, idx) => {
                    const day = settings.weeklyBusinessHours?.[idx] ?? DEFAULT_BUSINESS_HOURS;
                    return (
                      <div key={label} className="grid gap-2 rounded-2xl border border-border bg-background p-4 sm:grid-cols-[120px,1fr,1fr] sm:items-center">
                        <div className="font-medium text-foreground">{label}</div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Opens</Label>
                          <Input
                            type="time"
                            value={day.start}
                            onChange={(e) => {
                              const next = [...settings.weeklyBusinessHours];
                              next[idx] = { ...day, start: e.target.value };
                              onChange({ ...settings, weeklyBusinessHours: next });
                            }}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Closes</Label>
                          <Input
                            type="time"
                            value={day.end}
                            onChange={(e) => {
                              const next = [...settings.weeklyBusinessHours];
                              next[idx] = { ...day, end: e.target.value };
                              onChange({ ...settings, weeklyBusinessHours: next });
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 text-sm text-muted-foreground">
                  Tip: If you want the same hours every day, set one day then copy/paste the times.
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="text-sm text-muted-foreground">
            Used to suggest nearest alternate slots (±2 hours) when a requested slot is unavailable.
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle>Tables</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="grid gap-2">
              <Label>Admin passcode</Label>
              <Input
                type="password"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="Use the passcode set during onboarding"
              />
              <div className="text-xs text-muted-foreground">Used to authorize table edits. Stored only in this browser.</div>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-border bg-background p-4">
            <div className="font-medium text-foreground">Add a table</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="grid gap-2">
                <Label>Table number</Label>
                <Input
                  inputMode="numeric"
                  type="number"
                  min={1}
                  max={9999}
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="e.g. 12"
                />
              </div>
              <div className="grid gap-2">
                <Label>Table name</Label>
                <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} placeholder="e.g. Patio 1" />
              </div>
              <div className="grid gap-2">
                <Label>Min guests</Label>
                <Input
                  inputMode="numeric"
                  type="number"
                  min={1}
                  max={50}
                  value={newMinGuests}
                  onChange={(e) => setNewMinGuests(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Max guests</Label>
                <Input
                  inputMode="numeric"
                  type="number"
                  min={1}
                  max={50}
                  value={newMaxGuests}
                  onChange={(e) => setNewMaxGuests(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-full"
                disabled={!isSupabaseConfigured}
                onClick={async () => {
                  try {
                    await adminCreateTable({
                      passcode: adminPasscode,
                      tableNumber: Number(newTableNumber),
                      name: newTableName.trim() || `Table ${newTableNumber}`,
                      minOccupancy: clampGuests(Number(newMinGuests)),
                      maxOccupancy: clampGuests(Number(newMaxGuests)),
                    });
                    toast({ title: "Table added" });
                    setNewTableNumber("");
                    setNewTableName("");
                    setNewMinGuests("1");
                    setNewMaxGuests("4");
                    qc.invalidateQueries({ queryKey: ["restaurant_tables"] });
                  } catch (e: any) {
                    await showActionError("Could not add table", e, "Please check passcode and table values.");
                  }
                }}
              >
                Add table
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => qc.invalidateQueries({ queryKey: ["restaurant_tables"] })}
              >
                Refresh list
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="font-medium text-foreground">Existing tables</div>

            {!isSupabaseConfigured ? (
              <div className="mt-2 text-sm text-muted-foreground">Connect the database first to manage tables.</div>
            ) : tablesLoading ? (
              <div className="mt-2 text-sm text-muted-foreground">Loading…</div>
            ) : tableRows.length ? (
              <div className="mt-3 grid gap-2">
                {tableRows.map((r) => {
                  const nameValue = nameEdits[r.id] ?? String(r.name);
                  const minValue = minEdits[r.id] ?? String(r.min_occupancy);
                  const maxValue = maxEdits[r.id] ?? String(r.max_occupancy);
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-3 sm:flex-row sm:items-end sm:justify-between"
                    >
                      <div className="grid flex-1 gap-2 sm:grid-cols-3">
                        <div className="grid gap-1">
                          <Label className="text-xs">Table</Label>
                          <Input
                            value={nameValue}
                            onChange={(e) => setNameEdits((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">Min guests</Label>
                          <Input
                            inputMode="numeric"
                            type="number"
                            min={1}
                            max={50}
                            value={minValue}
                            onChange={(e) => setMinEdits((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">Max guests</Label>
                          <Input
                            inputMode="numeric"
                            type="number"
                            min={1}
                            max={50}
                            value={maxValue}
                            onChange={(e) => setMaxEdits((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xs text-muted-foreground">Table #{r.table_number}</div>
                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={async () => {
                            try {
                              await adminUpdateTable({
                                passcode: adminPasscode,
                                id: r.id,
                                name: nameValue,
                                minOccupancy: clampGuests(Number(minValue)),
                                maxOccupancy: clampGuests(Number(maxValue)),
                              });
                              toast({ title: "Table updated" });
                              qc.invalidateQueries({ queryKey: ["restaurant_tables"] });
                            } catch (e: any) {
                              await showActionError("Could not update", e, "Please check passcode and table values.");
                            }
                          }}
                        >
                          Save
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={async () => {
                            try {
                              await adminDeleteTable({ passcode: adminPasscode, id: r.id });
                              toast({ title: "Table deleted" });
                              qc.invalidateQueries({ queryKey: ["restaurant_tables"] });
                            } catch (e: any) {
                              await showActionError("Could not delete", e, "Please check passcode.");
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">No tables yet. Add one above.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
