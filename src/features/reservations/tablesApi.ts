import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import type { RestaurantTable } from "./types";

export type RestaurantTableRow = {
  id: string;
  table_number: number;
  capacity: number;
};

const rowSchema = z.object({
  id: z.string().uuid(),
  table_number: z.number().int().positive(),
  capacity: z.number().int().min(1).max(50),
});

function toModel(row: RestaurantTableRow): RestaurantTable {
  // Keep compatibility with existing reservation logic (table_id is TEXT).
  // We map table_number -> string ID.
  return {
    id: String(row.table_number),
    label: String(row.table_number),
    minGuests: 1,
    maxGuests: row.capacity,
  };
}

export async function fetchRestaurantTables(): Promise<{ rows: RestaurantTableRow[]; tables: RestaurantTable[] }> {
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("id, table_number, capacity")
    .order("table_number", { ascending: true });

  if (error) throw error;

  const rows = (data ?? [])
    .map((r: any) => ({
      id: r.id,
      table_number: Number(r.table_number),
      capacity: Number(r.capacity),
    }))
    .filter((r) => rowSchema.safeParse(r).success);

  return { rows, tables: rows.map(toModel) };
}

const passcodeSchema = z.string().trim().min(1).max(200);

export async function adminCreateTable(args: { passcode: string; tableNumber: number; capacity: number }) {
  const passcode = passcodeSchema.parse(args.passcode);
  const tableNumber = z.number().int().min(1).max(9999).parse(args.tableNumber);
  const capacity = z.number().int().min(1).max(50).parse(args.capacity);

  const { data, error } = await supabase.functions.invoke("manage-restaurant-tables", {
    body: { action: "create", passcode, table_number: tableNumber, capacity },
  });

  if (error) throw error;
  return data as { data: RestaurantTableRow };
}

export async function adminUpdateCapacity(args: { passcode: string; id: string; capacity: number }) {
  const passcode = passcodeSchema.parse(args.passcode);
  const id = z.string().uuid().parse(args.id);
  const capacity = z.number().int().min(1).max(50).parse(args.capacity);

  const { data, error } = await supabase.functions.invoke("manage-restaurant-tables", {
    body: { action: "update_capacity", passcode, id, capacity },
  });

  if (error) throw error;
  return data as { data: RestaurantTableRow };
}

export async function adminDeleteTable(args: { passcode: string; id: string }) {
  const passcode = passcodeSchema.parse(args.passcode);
  const id = z.string().uuid().parse(args.id);

  const { data, error } = await supabase.functions.invoke("manage-restaurant-tables", {
    body: { action: "delete", passcode, id },
  });

  if (error) throw error;
  return data as { ok: boolean };
}
