import { useMemo } from "react";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ReservationRow } from "../types";

function hourKey(d: Date) {
  return format(d, "HH:00");
}

export function AnalyticsTab({ reservations }: { reservations: ReservationRow[] }) {
  const byHour = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reservations) {
      const key = hourKey(new Date(r.start_at));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hour, count]) => ({ hour, count }));
  }, [reservations]);

  const byTable = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reservations) map.set(r.table_id, (map.get(r.table_id) ?? 0) + 1);
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([table, count]) => ({ table, count }));
  }, [reservations]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reservations) {
      const key = format(new Date(r.start_at), "MMM d");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([day, count]) => ({ day, count }));
  }, [reservations]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2 shadow-card">
        <CardHeader>
          <CardTitle>Bookings by hour</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byHour} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="hour" tickMargin={6} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Most booked tables</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byTable} layout="vertical" margin={{ left: 18, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="table" width={40} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 shadow-card">
        <CardHeader>
          <CardTitle>Bookings over time</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byDay} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="day" tickMargin={6} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 shadow-card">
        <CardHeader>
          <CardTitle>Ideas</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <Tabs defaultValue="mins">
            <TabsList>
              <TabsTrigger value="mins">Min / Max hours</TabsTrigger>
              <TabsTrigger value="util">Utilization</TabsTrigger>
              <TabsTrigger value="cancel">Cancellations</TabsTrigger>
            </TabsList>
            <TabsContent value="mins" className="mt-4">
              Track your peak hours (max bookings) and quiet hours (min bookings) using the “Bookings by hour” chart above.
            </TabsContent>
            <TabsContent value="util" className="mt-4">
              Next iteration: compute table-occupancy minutes per day to see utilization %.
            </TabsContent>
            <TabsContent value="cancel" className="mt-4">
              Next iteration: include cancelled rows to chart cancellation rate.
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
