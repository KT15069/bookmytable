export type RestaurantTable = {
  id: string;
  label: string;
  minGuests: number;
  maxGuests: number;
};

export type ReservationStatus = "booked" | "cancelled";

export type ReservationRow = {
  id: string;
  table_id: string;
  guest_count: number;
  start_at: string;
  end_at: string;
  name: string;
  email: string;
  phone: string;
  status: ReservationStatus;
  created_at?: string;
};

export type CreateReservationInput = {
  guestCount: number;
  startAt: Date;
  endAt: Date;
  name: string;
  email: string;
  phone: string;
};
