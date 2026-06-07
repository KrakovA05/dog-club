"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function cancelBooking(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизован");

  // RLS разрешает отмену своих броней из pending/confirmed (только в cancelled)
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("user_id", user.id)
    .in("status", ["pending", "confirmed"]);

  if (error) throw new Error(error.message);

  revalidatePath("/cabinet/bookings");
}
