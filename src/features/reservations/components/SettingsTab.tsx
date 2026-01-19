import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  clearRuntimeSupabaseConfig,
  getSupabaseConfig,
  isSupabaseConfigured,
  saveRuntimeSupabaseConfig,
  supabaseConfigSource,
} from "@/integrations/supabase/client";
import { DEFAULT_BUSINESS_HOURS } from "../constants";
import {
  adminCreateTable,
  adminDeleteTable,
  adminUpdateCapacity,
  fetchRestaurantTables,
} from "../tablesApi";

const SETTINGS_KEY = "restaurant.settings.v1";
const TABLE_ADMIN_KEY = "restaurant.tables.adminPasscode.v1";

export type SettingsState = {
  businessHours: { start: string; end: string };
};

export function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { businessHours: DEFAULT_BUSINESS_HOURS };
    const parsed = JSON.parse(raw) as SettingsState;
    return {
      businessHours: {
        start: parsed.businessHours?.start ?? DEFAULT_BUSINESS_HOURS.start,
        end: parsed.businessHours?.end ?? DEFAULT_BUSINESS_HOURS.end,
      },
    };
  } catch {
    return { businessHours: DEFAULT_BUSINESS_HOURS };
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
  const [newCapacity, setNewCapacity] = useState("2");
  const [capacityEdits, setCapacityEdits] = useState<Record<string, string>>({});

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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Opens</Label>
              <Input
                type="time"
                value={settings.businessHours.start}
                onChange={(e) => onChange({ ...settings, businessHours: { ...settings.businessHours, start: e.target.value } })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Closes</Label>
              <Input
                type="time"
                value={settings.businessHours.end}
                onChange={(e) => onChange({ ...settings, businessHours: { ...settings.businessHours, end: e.target.value } })}
              />
            </div>
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
                placeholder="Required to add / edit / delete tables"
              />
              <div className="text-xs text-muted-foreground">
                Used to authorize table edits. Stored only in this browser.
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-border bg-background p-4">
            <div className="font-medium text-foreground">Add a table</div>
            <div className="grid gap-3 sm:grid-cols-2">
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
                <Label>Capacity</Label>
                <Input
                  inputMode="numeric"
                  type="number"
                  min={1}
                  max={50}
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  placeholder="e.g. 4"
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
                      capacity: Number(newCapacity),
                    });
                    toast({ title: "Table added" });
                    setNewTableNumber("");
                    qc.invalidateQueries({ queryKey: ["restaurant_tables"] });
                  } catch (e: any) {
                    toast({
                      title: "Could not add table",
                      description: typeof e?.message === "string" ? e.message : "Please check passcode + values.",
                      variant: "destructive",
                    });
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

            <div className="text-xs text-muted-foreground">
              Note: reservations store the table as the table number string. Avoid changing table numbers after bookings exist.
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
                  const value = capacityEdits[r.id] ?? String(r.capacity);
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-medium text-foreground">Table {r.table_number}</div>
                        <div className="text-xs text-muted-foreground">ID: {r.id}</div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Capacity</Label>
                          <Input
                            className="w-24"
                            inputMode="numeric"
                            type="number"
                            min={1}
                            max={50}
                            value={value}
                            onChange={(e) =>
                              setCapacityEdits((prev) => ({
                                ...prev,
                                [r.id]: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={async () => {
                            try {
                              await adminUpdateCapacity({
                                passcode: adminPasscode,
                                id: r.id,
                                capacity: Number(value),
                              });
                              toast({ title: "Capacity updated" });
                              qc.invalidateQueries({ queryKey: ["restaurant_tables"] });
                            } catch (e: any) {
                              toast({
                                title: "Could not update",
                                description: typeof e?.message === "string" ? e.message : "Please check passcode + value.",
                                variant: "destructive",
                              });
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
                              toast({
                                title: "Could not delete",
                                description: typeof e?.message === "string" ? e.message : "Please check passcode.",
                                variant: "destructive",
                              });
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

      <Card className="shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle>Database connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            If the preview build isn’t picking up env vars, you can set your Supabase URL + anon key here (stored in this
            browser only) then reload.
          </p>

          <RuntimeSupabaseForm />

          <div className="pt-2">
            <div className="font-medium text-foreground">Table schema notes</div>
            <p className="mt-2">
              This UI expects a <code>reservations</code> table with columns:
              <code> id, table_id, guest_count, start_at, end_at, name, email, phone, status, created_at</code>.
            </p>
            <p className="mt-2 text-xs">Minimal SQL (run in your database) — adjust policies later when you add staff login:</p>
            <pre className="mt-2 overflow-x-auto rounded-2xl border border-border bg-muted/60 p-4 text-xs text-foreground">
{`create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  table_id text not null,
  guest_count int not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  name text not null,
  email text not null,
  phone text not null,
  status text not null default 'booked',
  created_at timestamptz not null default now()
);

create index if not exists reservations_time_idx
  on public.reservations (start_at, end_at);

-- Optional: enable RLS and open it temporarily
-- alter table public.reservations enable row level security;
-- create policy "public read" on public.reservations for select using (true);
-- create policy "public insert" on public.reservations for insert with check (true);
-- create policy "public update" on public.reservations for update using (true);`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RuntimeSupabaseForm() {
  const defaults = useMemo(() => {
    const cfg = getSupabaseConfig();
    return { url: cfg.url ?? "", anonKey: cfg.anonKey ?? "" };
  }, []);

  const [url, setUrl] = useState(defaults.url);
  const [anonKey, setAnonKey] = useState(defaults.anonKey);

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-background p-4">
      <div className="grid gap-2">
        <Label>Supabase URL</Label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" />
      </div>
      <div className="grid gap-2">
        <Label>Supabase anon key</Label>
        <Input value={anonKey} onChange={(e) => setAnonKey(e.target.value)} placeholder="eyJhbGciOi..." />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          className="rounded-full"
          onClick={() => {
            saveRuntimeSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });
            window.location.reload();
          }}
        >
          Save & reload
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => {
            clearRuntimeSupabaseConfig();
            window.location.reload();
          }}
        >
          Clear override
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        Active connection source: <b>{supabaseConfigSource}</b> · Build env detected: URL{" "}
        <b>{import.meta.env.VITE_SUPABASE_URL ? "yes" : "no"}</b>, ANON KEY <b>{import.meta.env.VITE_SUPABASE_ANON_KEY ? "yes" : "no"}</b>
      </div>
    </div>
  );
}
