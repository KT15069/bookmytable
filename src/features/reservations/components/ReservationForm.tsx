import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInMinutes, format, set } from "date-fns";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

import { DEFAULT_BUSINESS_HOURS, MAX_BOOKING_MINUTES, MIN_BOOKING_MINUTES } from "../constants";
import { findAvailableTable, isDurationValid, suggestNearestSlot } from "../availability";
import type { ReservationRow, RestaurantTable } from "../types";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(7).max(30),
  guests: z.coerce.number().int().min(1).max(10),
  date: z.string().min(1),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

type FormValues = z.infer<typeof schema>;

function combineDateAndTime(date: Date, time: string) {
  const [hh, mm] = time.split(":").map((n) => Number(n));
  return set(date, { hours: hh, minutes: mm, seconds: 0, milliseconds: 0 });
}

export function ReservationForm({
  tables,
  dayReservations,
  selectedDate,
  businessHours,
  submitLabel = "Check availability & book",
  onBook,
  onBooked,
}: {
  tables: RestaurantTable[];
  dayReservations: ReservationRow[];
  selectedDate: Date;
  businessHours: { start: string; end: string };
  submitLabel?: string;
  onBook: (args: {
    tableId: string;
    guestCount: number;
    startAt: Date;
    endAt: Date;
    name: string;
    email: string;
    phone: string;
  }) => Promise<void>;
  onBooked?: () => void;
}) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      guests: 2,
      date: format(selectedDate, "yyyy-MM-dd"),
      start: "19:00",
      end: "20:00",
    },
  });

  const hint = useMemo(() => `Min ${MIN_BOOKING_MINUTES} minutes · Max ${MAX_BOOKING_MINUTES / 60} hours`, []);

  async function handleSubmit(values: FormValues) {
    const date = new Date(values.date + "T00:00:00");
    const startAt = combineDateAndTime(date, values.start);
    const endAt = combineDateAndTime(date, values.end);

    if (!isDurationValid(startAt, endAt)) {
      toast({ title: "Invalid duration", description: hint });
      return;
    }

    const table = findAvailableTable(tables, dayReservations, values.guests, startAt, endAt);
    if (table) {
      try {
        await onBook({
          tableId: table.id,
          guestCount: values.guests,
          startAt,
          endAt,
          name: values.name,
          email: values.email,
          phone: values.phone,
        });

        toast({
          title: `Booked ${table.label}`,
          description: `${values.guests} guests · ${values.start}–${values.end}`,
        });
        onBooked?.();
        form.reset({ ...values });
      } catch (e: any) {
        const message = typeof e?.message === "string" ? e.message : "Could not save booking to the database.";
        toast({
          title: "Booking failed",
          description: message,
          variant: "destructive",
        });
      }
      return;
    }

    const businessStart = combineDateAndTime(date, businessHours.start ?? DEFAULT_BUSINESS_HOURS.start);
    const businessEnd = combineDateAndTime(date, businessHours.end ?? DEFAULT_BUSINESS_HOURS.end);

      const suggestion = suggestNearestSlot(
        tables,
        dayReservations,
        values.guests,
        startAt,
        endAt,
        businessStart,
        businessEnd,
      );

    if (suggestion) {
      const minutes = differenceInMinutes(suggestion.endAt, suggestion.startAt);
      toast({
        title: "Requested slot unavailable",
        description: `Nearest available: ${suggestion.table.label} · ${format(suggestion.startAt, "HH:mm")}–${format(
          suggestion.endAt,
          "HH:mm",
        )} (${minutes} mins)`,
      });
    } else {
      toast({ title: "No availability", description: "No table is available near that time window." });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Guest name</Label>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label>Guests</Label>
            <FormField
              control={form.control}
              name="guests"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input inputMode="numeric" type="number" min={1} max={10} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label>Email</Label>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="name@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label>Phone</Label>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="+91…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label>Date</Label>
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label>Start</Label>
            <FormField
              control={form.control}
              name="start"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label>End</Label>
            <FormField
              control={form.control}
              name="end"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-xs text-muted-foreground">{hint}</div>
          </div>
        </div>

        <Button type="submit" variant="hero" className="w-full rounded-full">
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
