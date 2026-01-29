import { supabase } from "@/integrations/supabase/client";

export async function sendReservationEmail(args: {
  action: "confirmation" | "cancelled";
  reservationId: string;
}) {
  const { error } = await supabase.functions.invoke("reservation-email", {
    body: {
      action: args.action,
      reservation_id: args.reservationId,
    },
  });

  if (error) throw error;
}
