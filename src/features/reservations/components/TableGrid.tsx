import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ReservationRow, RestaurantTable } from "../types";

function statusForNow(
  reservations: ReservationRow[],
  tableId: string,
  now: Date,
  upcomingUntil: Date,
) {
  const booked = reservations.filter((r) => r.status === "booked" && r.table_id === tableId);

  const active = booked.find((r) => {
    const a = new Date(r.start_at);
    const b = new Date(r.end_at);
    return now >= a && now < b;
  });

  if (active) return { kind: "booked" as const, active };

  const next = booked
    .filter((r) => {
      const a = new Date(r.start_at);
      return a >= now && a <= upcomingUntil;
    })
    .sort((x, y) => +new Date(x.start_at) - +new Date(y.start_at))[0];

  if (next) return { kind: "upcoming" as const, next };

  return { kind: "free" as const };
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tables.map((t) => {
        const status = statusForNow(reservations, t.id, windowStart, windowEnd);

        const statusStyles =
          status.kind === "booked"
            ? "border-table-booked/40 bg-table-booked text-table-booked-foreground"
            : status.kind === "upcoming"
              ? "border-table-upcoming/45 bg-table-upcoming text-table-upcoming-foreground"
              : "border-table-free/35 bg-table-free text-table-free-foreground";

        const pillStyles =
          status.kind === "booked"
            ? "bg-table-booked/60 text-table-booked-foreground"
            : status.kind === "upcoming"
              ? "bg-table-upcoming/70 text-table-upcoming-foreground"
              : "bg-table-free/65 text-table-free-foreground";

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelectTable(t.id)}
            className={cn(
              "group text-left",
              "rounded-2xl border p-4 shadow-card transition-[transform,box-shadow]",
              "hover:-translate-y-0.5 hover:shadow-soft",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              statusStyles,
            )}
          >
            <div className="flex h-full flex-col">
              <div className="font-display text-xl leading-none text-foreground">{t.label}</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {t.minGuests === t.maxGuests ? `1–${t.maxGuests} guests` : `${t.minGuests}–${t.maxGuests} guests`}
              </div>

              <div className="mt-auto pt-4">
                <div className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", pillStyles)}>
                  {status.kind === "booked"
                    ? "Occupied"
                    : status.kind === "upcoming"
                      ? `Upcoming · ${format(new Date(status.next.start_at), "HH:mm")}`
                      : "Free"}
                </div>
              </div>

              {status.kind === "booked" ? (
                <div className="mt-3 rounded-xl bg-background/70 p-3">
                  <div className="text-sm font-medium text-foreground">{status.active.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{status.active.email}</div>
                  <div className="text-xs text-muted-foreground">{status.active.phone}</div>
                </div>
              ) : null}
            </div>
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
