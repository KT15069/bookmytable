import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import type { ReservationRow, RestaurantTable } from "../types";

export function DayBookingsList({
  tables,
  reservations,
  onCancel,
}: {
  tables: RestaurantTable[];
  reservations: ReservationRow[];
  onCancel: (id: string) => void;
}) {
  const tableById = useMemo(() => {
    return new Map(tables.map((t) => [t.id, t] as const));
  }, [tables]);

  const rows = reservations
    .filter((r) => r.status === "booked")
    .sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at));

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Today's bookings</CardTitle>
        <Badge variant="secondary">{rows.length}</Badge>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">
            No bookings for today.
          </div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {(() => {
                        const t = tableById.get(r.table_id);
                        if (!t) return "Table";
                        return typeof t.tableNumber === "number" ? `Table ${t.tableNumber}` : t.label;
                      })()}
                    </span>
                    <span className="px-2">·</span>
                    {format(new Date(r.start_at), "HH:mm")}–{format(new Date(r.end_at), "HH:mm")}
                  </div>
                  <div className="mt-1 font-medium text-foreground">{r.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {r.guest_count} guests · {r.phone}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="rounded-full" onClick={() => onCancel(r.id)}>
                  Cancel
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

