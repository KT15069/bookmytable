import { supabaseUntyped as supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import type { RestaurantTable } from "./types";

export type RestaurantTableRow = {
  id: string;
  restaurant_id: string;
  table_number: number;
  capacity: number;
  name: string;
  min_occupancy: number;
  max_occupancy: number;
};

const rowSchema = z.object({
  id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  table_number: z.number().int().positive(),
  capacity: z.number().int().min(1).max(50),
  name: z.string().min(1).max(200),
  min_occupancy: z.number().int().min(1).max(50),
  max_occupancy: z.number().int().min(1).max(50),
});

function toModel(row: RestaurantTableRow): RestaurantTable {
  return {
    id: row.id,
    label: row.name,
    tableNumber: row.table_number,
    minGuests: row.min_occupancy,
    maxGuests: row.max_occupancy,
  };
}

export async function fetchRestaurantTables(): Promise<{ rows: RestaurantTableRow[]; tables: RestaurantTable[] }> {
  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("id, restaurant_id, table_number, capacity, name, min_occupancy, max_occupancy")
    .order("table_number", { ascending: true });

  if (error) throw error;

  const rows = (data ?? [])
    .map((r: any) => ({
      id: r.id,
      restaurant_id: r.restaurant_id,
      table_number: Number(r.table_number),
      capacity: Number(r.capacity),
      name: String(r.name),
      min_occupancy: Number(r.min_occupancy),
      max_occupancy: Number(r.max_occupancy),
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
