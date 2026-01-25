import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReservationRow } from "../types";

export function ReservationsList({
  tableId,
  reservations,
  onCancel,
}: {
  tableId: string;
  reservations: ReservationRow[];
  onCancel: (id: string) => void;
}) {
  const tableRes = reservations
    .filter((r) => r.status === "booked" && r.table_id === tableId)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        {/* Do not expose internal table UUIDs */}
        <CardTitle>Reservations</CardTitle>
        <Badge variant="secondary">{tableRes.length} today</Badge>
      </CardHeader>
      <CardContent className="grid gap-3">
        {tableRes.length === 0 ? (
          <div className="rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">
            No reservations for this table today.
          </div>
        ) : (
          tableRes.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-border bg-background p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {r.email} · {r.phone}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Guests:</span> {r.guest_count}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    {format(new Date(r.start_at), "HH:mm")}–{format(new Date(r.end_at), "HH:mm")}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => onCancel(r.id)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
