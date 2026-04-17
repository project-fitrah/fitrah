import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseProxyContext } from "@/lib/supabase/proxy";

export const updateSession = async (request: NextRequest) => {
  const context = createSupabaseProxyContext(request);
  if (!context) {
    return NextResponse.next({ request });
  }

  const {
    response,
    supabase: { auth },
  } = context;

  await auth.getUser();
  return response;
};
