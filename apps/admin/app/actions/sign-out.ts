"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type SignOutActionState = {
  success: boolean;
  message: string;
  error: string;
};

const initialState: SignOutActionState = {
  success: false,
  message: "",
  error: "",
};

export const signOutInitialState = initialState;

export async function signOutAction(): Promise<SignOutActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      message: "",
      error: "Uitloggen mislukt. Probeer het opnieuw.",
    };
  }

  revalidatePath("/");
  revalidatePath("/login");

  return {
    success: true,
    message: "Uitgelogd.",
    error: "",
  };
}
