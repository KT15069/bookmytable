import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { DEFAULT_BUSINESS_HOURS } from "../constants";

const SETTINGS_KEY = "restaurant.settings.v1";

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
          <CardTitle>Database notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This UI expects a <code>reservations</code> table with columns:
            <code> id, table_id, guest_count, start_at, end_at, name, email, phone, status, created_at</code>.
          </p>
          <p className="text-xs">
            Minimal SQL (run in your database) — adjust policies later when you add staff login:
          </p>
          <pre className="overflow-x-auto rounded-2xl border border-border bg-muted/60 p-4 text-xs text-foreground">
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
        </CardContent>
      </Card>
    </div>
  );
}
