import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import type { ReservationRow, RestaurantTable } from "../types";
import { ReservationForm } from "./ReservationForm";

export function ReservationFormDialog({
  tables,
  dayReservations,
  selectedDate,
  businessHours,
  onBook,
}: {
  tables: RestaurantTable[];
  dayReservations: ReservationRow[];
  selectedDate: Date;
  businessHours: { start: string; end: string };
  onBook: (args: {
    tableId: string;
    guestCount: number;
    startAt: Date;
    endAt: Date;
    name: string;
    email: string;
    phone: string;
  }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero">Book reservation</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">New reservation</DialogTitle>
        </DialogHeader>

        <ReservationForm
          tables={tables}
          dayReservations={dayReservations}
          selectedDate={selectedDate}
          businessHours={businessHours}
          submitLabel="Check & book"
          onBook={onBook}
          onBooked={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
