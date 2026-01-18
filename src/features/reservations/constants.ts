import type { RestaurantTable } from "./types";

export const RESTAURANT_TABLES: RestaurantTable[] = [
  { id: "A1", label: "A1", minGuests: 1, maxGuests: 2 },
  { id: "A2", label: "A2", minGuests: 1, maxGuests: 2 },
  { id: "A3", label: "A3", minGuests: 1, maxGuests: 2 },
  { id: "B1", label: "B1", minGuests: 3, maxGuests: 6 },
  { id: "B2", label: "B2", minGuests: 3, maxGuests: 6 },
  { id: "B3", label: "B3", minGuests: 3, maxGuests: 6 },
  { id: "C1", label: "C1", minGuests: 7, maxGuests: 10 },
  { id: "C2", label: "C2", minGuests: 7, maxGuests: 10 },
  { id: "C3", label: "C3", minGuests: 7, maxGuests: 10 },
];

export const MIN_BOOKING_MINUTES = 20;
export const MAX_BOOKING_MINUTES = 5 * 60;

export const DEFAULT_BUSINESS_HOURS = {
  start: "08:00",
  end: "23:00",
};
