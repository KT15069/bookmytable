import { addMinutes, differenceInMinutes, isBefore } from "date-fns";
import { MIN_BOOKING_MINUTES, MAX_BOOKING_MINUTES } from "./constants";
import type { ReservationRow, RestaurantTable } from "./types";

export function isDurationValid(startAt: Date, endAt: Date) {
  const minutes = differenceInMinutes(endAt, startAt);
  return minutes >= MIN_BOOKING_MINUTES && minutes <= MAX_BOOKING_MINUTES;
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export function findAvailableTable(
  tables: RestaurantTable[],
  reservations: ReservationRow[],
  guestCount: number,
  startAt: Date,
  endAt: Date,
) {
  const candidates = tables
    .filter((t) => guestCount >= t.minGuests && guestCount <= t.maxGuests)
    .sort((a, b) => a.maxGuests - b.maxGuests);

  for (const table of candidates) {
    const tableRes = reservations.filter((r) => r.status === "booked" && r.table_id === table.id);
    const conflict = tableRes.some((r) =>
      overlaps(startAt, endAt, new Date(r.start_at), new Date(r.end_at)),
    );
    if (!conflict) return table;
  }

  return null;
}

export function suggestNearestSlot(
  tables: RestaurantTable[],
  reservations: ReservationRow[],
  guestCount: number,
  requestedStart: Date,
  requestedEnd: Date,
  businessStart: Date,
  businessEnd: Date,
) {
  const durationMinutes = differenceInMinutes(requestedEnd, requestedStart);
  if (durationMinutes < MIN_BOOKING_MINUTES || durationMinutes > MAX_BOOKING_MINUTES) return null;

  const step = 20;
  const maxDelta = 120; // ±2h

  const clamps = (d: Date) => {
    if (isBefore(d, businessStart)) return businessStart;
    if (isBefore(businessEnd, d)) return businessEnd;
    return d;
  };

  // Search outward from requested time: 0, +20, -20, +40, -40, ...
  for (let delta = 0; delta <= maxDelta; delta += step) {
    const offsets = delta === 0 ? [0] : [delta, -delta];
    for (const off of offsets) {
      const start = clamps(addMinutes(requestedStart, off));
      const end = addMinutes(start, durationMinutes);
      if (end > businessEnd) continue;

      const table = findAvailableTable(tables, reservations, guestCount, start, end);
      if (table) return { table, startAt: start, endAt: end };
    }
  }

  return null;
}
