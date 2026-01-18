import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReservationRow, RestaurantTable } from "../types";

function overlappingForWindow(reservations: ReservationRow[], tableId: string, startAt: Date, endAt: Date) {
  return reservations.filter((r) => {
    if (r.status !== "booked" || r.table_id !== tableId) return false;
    const a = new Date(r.start_at);
    const b = new Date(r.end_at);
    return startAt < b && endAt > a;
  });
}

export function TableGrid({
  tables,
  reservations,
  windowStart,
  windowEnd,
  onSelectTable,
}: {
  tables: RestaurantTable[];
  reservations: ReservationRow[];
  windowStart: Date;
  windowEnd: Date;
  onSelectTable: (tableId: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tables.map((t) => {
        const overlaps = overlappingForWindow(reservations, t.id, windowStart, windowEnd);
        const active = overlaps[0];
        const isBooked = overlaps.length > 0;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTable(t.id)}
            className={cn(
              "group text-left",
              "rounded-2xl border border-border bg-card p-4 shadow-card transition-[transform,box-shadow]",
              "hover:-translate-y-0.5 hover:shadow-soft",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-display text-xl">{t.label}</div>
                  <Badge variant={isBooked ? "secondary" : "default"}>
                    {isBooked ? "Booked" : "Available"}
                  </Badge>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t.minGuests === t.maxGuests
                    ? `${t.maxGuests} guests`
                    : `${t.minGuests}–${t.maxGuests} guests`}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {format(windowStart, "HH:mm")}–{format(windowEnd, "HH:mm")}
              </div>
            </div>

            {active ? (
              <div className="mt-4 rounded-xl bg-accent p-3">
                <div className="text-sm font-medium text-accent-foreground">{active.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{active.email}</div>
                <div className="text-xs text-muted-foreground">{active.phone}</div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-muted-foreground">
                Empty in this window.
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TableWindowControls({
  date,
  windowStart,
  windowEnd,
  onDateChange,
  onWindowChange,
}: {
  date: Date;
  windowStart: Date;
  windowEnd: Date;
  onDateChange: (d: Date) => void;
  onWindowChange: (startTime: string, endTime: string) => void;
}) {
  const startStr = useMemo(() => format(windowStart, "HH:mm"), [windowStart]);
  const endStr = useMemo(() => format(windowEnd, "HH:mm"), [windowEnd]);

  const [start, setStart] = useState(startStr);
  const [end, setEnd] = useState(endStr);

  useEffect(() => setStart(startStr), [startStr]);
  useEffect(() => setEnd(endStr), [endStr]);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Table view</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <div className="rounded-2xl border border-border bg-background p-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && onDateChange(d)}
            className="mx-auto"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Window start</Label>
            <Input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              onBlur={() => onWindowChange(start, end)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Window end</Label>
            <Input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              onBlur={() => onWindowChange(start, end)}
            />
          </div>
          <div className="sm:col-span-2 text-xs text-muted-foreground">
            This window controls which reservations are shown as “Booked” on each table card.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
