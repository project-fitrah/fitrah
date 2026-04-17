"use server";

import { createClient } from "@/utils/supabase/server";

export type LoginActionState = {
  success: boolean;
  message: string;
  error: string;
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      success: false,
      message: "",
      error: "E-mail en wachtwoord zijn verplicht.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      message: "",
      error: "Inloggen mislukt. Controleer je gegevens.",
    };
  }

  return {
    success: true,
    message: "Ingelogd. Je sessie is actief.",
    error: "",
  };
}
