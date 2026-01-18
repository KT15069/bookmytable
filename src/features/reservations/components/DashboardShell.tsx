import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  addDays,
  addMinutes,
  endOfDay,
  format,
  startOfDay,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";

import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

import { RESTAURANT_TABLES } from "../constants";
import type { ReservationRow } from "../types";
import { cancelReservation, createReservation, fetchReservations } from "../api";
import { ReservationFormDialog } from "./ReservationFormDialog";
import { TableGrid } from "./TableGrid";
import { ReservationsList } from "./ReservationsList";
import { AnalyticsTab } from "./AnalyticsTab";
import { loadSettings, saveSettings, SettingsTab, type SettingsState } from "./SettingsTab";
import { ReservationForm } from "./ReservationForm";
import { ReservationsRangeList } from "./ReservationsRangeList";
import { AIAssistantTab } from "./AIAssistantTab";

export function DashboardShell() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState<SettingsState>(() => ({ businessHours: { start: "08:00", end: "23:00" } }));

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const [date, setDate] = useState(() => new Date());
  const windowStart = now;
  const windowEnd = addMinutes(now, 25);

  const [selectedTable, setSelectedTable] = useState<string>(RESTAURANT_TABLES[0].id);

  const dayRange = useMemo(() => ({ start: startOfDay(date), end: endOfDay(date) }), [date]);

  const { data: dayReservations = [], isLoading: dayLoading } = useQuery({
    queryKey: ["reservations", "day", format(date, "yyyy-MM-dd")],
    queryFn: () => fetchReservations(dayRange.start, dayRange.end),
    enabled: isSupabaseConfigured,
  });

  const [analyticsRange, setAnalyticsRange] = useState<"today" | "week" | "30d" | "6mo">("week");
  const analyticsDates = useMemo(() => {
    const now = new Date();
    if (analyticsRange === "today") return { start: startOfDay(now), end: endOfDay(now) };
    if (analyticsRange === "week") return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfDay(addDays(now, 1)) };
    if (analyticsRange === "30d") return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    return { start: startOfDay(subMonths(now, 6)), end: endOfDay(now) };
  }, [analyticsRange]);

  const { data: analyticsReservations = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ["reservations", "analytics", analyticsRange],
    queryFn: () => fetchReservations(analyticsDates.start, analyticsDates.end),
    enabled: isSupabaseConfigured,
  });

  async function handleCancel(id: string) {
    await cancelReservation(id);
    toast({ title: "Reservation cancelled" });
    qc.invalidateQueries({ queryKey: ["reservations"] });
  }

  async function handleBook(args: {
    tableId: string;
    guestCount: number;
    startAt: Date;
    endAt: Date;
    name: string;
    email: string;
    phone: string;
  }) {
    await createReservation({
      table_id: args.tableId,
      guest_count: args.guestCount,
      start_at: args.startAt.toISOString(),
      end_at: args.endAt.toISOString(),
      name: args.name,
      email: args.email,
      phone: args.phone,
      status: "booked",
    });

    qc.invalidateQueries({ queryKey: ["reservations"] });
  }

  function onMouseMove(e: MouseEvent<HTMLElement>) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    (e.currentTarget as HTMLElement).style.setProperty("--mx", `${mx}%`);
    (e.currentTarget as HTMLElement).style.setProperty("--my", `${my}%`);
  }

  return (
    <div onMouseMove={onMouseMove} className="min-h-screen bg-hero">
      <header className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-4xl tracking-tight md:text-5xl">Restaurant Reservations Dashboard</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Live table status, quick bookings and smart analytics for your service team.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-card">
                <span className="text-sm text-muted-foreground">Light</span>
                <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
                <span className="text-sm text-muted-foreground">Dark</span>
              </div>

              <ReservationFormDialog
                dayReservations={dayReservations}
                selectedDate={date}
                businessHours={settings.businessHours}
                onBook={handleBook}
              />
              <Button
                variant="outline"
                onClick={() => {
                  qc.invalidateQueries({ queryKey: ["reservations"] });
                  toast({ title: "Refreshed" });
                }}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-6">
        {!isSupabaseConfigured ? (
          <Alert className="shadow-card">
            <AlertTitle>Connect your Supabase env vars</AlertTitle>
            <AlertDescription>
              Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your project environment.
              Once set, this dashboard will load and write reservations from your database.
            </AlertDescription>
          </Alert>
        ) : null}

        <Tabs defaultValue="tables" className="mt-6">
          <TabsList className="h-12 w-full justify-start rounded-full bg-muted/60 p-1 shadow-card">
            <TabsTrigger value="tables" className="rounded-full px-5">Tables</TabsTrigger>
            <TabsTrigger value="reservations" className="rounded-full px-5">Reservations</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-full px-5">Analytics</TabsTrigger>
            <TabsTrigger value="assistant" className="rounded-full px-5">AI Assistant</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-full px-5">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="tables" className="mt-4 grid gap-4 lg:grid-cols-[1fr,380px]">
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle>Table status today</CardTitle>
                <div className="text-sm text-muted-foreground">{format(now, "EEEE, dd LLL · HH:mm")}</div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <TableGrid
                  tables={RESTAURANT_TABLES}
                  reservations={dayReservations}
                  windowStart={windowStart}
                  windowEnd={windowEnd}
                  onSelectTable={setSelectedTable}
                />

                <div className="text-xs text-muted-foreground">
                  Colors: red = occupied now, yellow = booked within 25 min, green = free now.
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick stats</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Use this view during service to quickly see which tables are free, currently seated, or about to turn.
                </p>
                <p className="mt-4">
                  Combine this with the Reservations and Visualization tabs to coordinate walk-ins and manage peak hours.
                </p>
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <ReservationsList tableId={selectedTable} reservations={dayReservations} onCancel={handleCancel} />
            </div>
          </TabsContent>

          <TabsContent value="reservations" className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader className="border-b border-border/60">
                <CardTitle>New reservation</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ReservationForm
                  dayReservations={dayReservations}
                  selectedDate={date}
                  businessHours={settings.businessHours}
                  onBook={handleBook}
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="text-sm text-muted-foreground">Range:</div>
                <Select value={analyticsRange} onValueChange={(v) => setAnalyticsRange(v as any)}>
                  <SelectTrigger className="w-[180px] rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="6mo">Last 6 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {analyticsLoading ? (
                <Card className="shadow-card">
                  <CardContent className="p-8 text-sm text-muted-foreground">Loading…</CardContent>
                </Card>
              ) : (
                <ReservationsRangeList reservations={analyticsReservations} onCancel={handleCancel} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-display text-2xl">Analytics</div>
                <div className="text-sm text-muted-foreground">Trends: today, week, last 30 days, last 6 months.</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant={analyticsRange === "today" ? "default" : "outline"} size="sm" onClick={() => setAnalyticsRange("today")}>Today</Button>
                <Button variant={analyticsRange === "week" ? "default" : "outline"} size="sm" onClick={() => setAnalyticsRange("week")}>Week</Button>
                <Button variant={analyticsRange === "30d" ? "default" : "outline"} size="sm" onClick={() => setAnalyticsRange("30d")}>30 days</Button>
                <Button variant={analyticsRange === "6mo" ? "default" : "outline"} size="sm" onClick={() => setAnalyticsRange("6mo")}>6 months</Button>
              </div>
            </div>

            {analyticsLoading ? (
              <Card className="shadow-card">
                <CardContent className="p-8 text-sm text-muted-foreground">Loading analytics…</CardContent>
              </Card>
            ) : (
              <AnalyticsTab reservations={analyticsReservations} />
            )}
          </TabsContent>

          <TabsContent value="assistant" className="mt-4">
            <AIAssistantTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <SettingsTab
              settings={settings}
              onChange={(s) => setSettings(s)}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground">
          Tip: Enable staff login + strict database policies before using in production.
        </div>
      </footer>
    </div>
  );
}
