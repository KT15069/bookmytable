import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReservationRow } from "../types";

export function ReservationsRangeList({
  reservations,
  onCancel,
}: {
  reservations: ReservationRow[];
  onCancel: (id: string) => void;
}) {
  const rows = reservations
    .filter((r) => r.status === "booked")
    .sort((a, b) => +new Date(b.start_at) - +new Date(a.start_at));

  return (
    <Card className="shadow-card">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="text-center">Reservations in range</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">
            No reservations in this range.
          </div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{r.table_id}</span>
                    <span className="px-2">·</span>
                    {format(new Date(r.start_at), "dd LLL")}
                    <span className="px-2">·</span>
                    {format(new Date(r.start_at), "HH:mm")}–{format(new Date(r.end_at), "HH:mm")}
                  </div>
                  <div className="mt-1 font-medium">{r.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {r.guest_count} guests · {r.phone}
                  </div>
                  <div className="text-sm text-muted-foreground">{r.email}</div>
                </div>

                <Button variant="outline" className="rounded-full" onClick={() => onCancel(r.id)}>
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
