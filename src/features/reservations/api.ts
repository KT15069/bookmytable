import { supabase } from "@/integrations/supabase/client";
import type { ReservationRow } from "./types";

const TABLE = "reservations";

export async function fetchReservations(rangeStart: Date, rangeEnd: Date) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, table_id, guest_count, start_at, end_at, name, email, phone, status, created_at")
    .eq("status", "booked")
    .lt("start_at", rangeEnd.toISOString())
    .gt("end_at", rangeStart.toISOString())
    .order("start_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ReservationRow[];
}

export async function createReservation(row: Omit<ReservationRow, "id">) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
}

export async function cancelReservation(id: string) {
  const { error } = await supabase.from(TABLE).update({ status: "cancelled" }).eq("id", id);
  if (error) throw error;
}
