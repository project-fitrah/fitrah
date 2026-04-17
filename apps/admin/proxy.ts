import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseProxyContext } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const context = createSupabaseProxyContext(request);
  if (!context) {
    return NextResponse.next({ request });
  }

  const { response, supabase } = context;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");

  if (isApiRoute) {
    return response;
  }

  if (!user) {
    return redirectWithCookies(request, response, "/login");
  }

  return response;
}

function redirectWithCookies(request: NextRequest, sourceResponse: NextResponse, path: string) {
  const redirectResponse = NextResponse.redirect(new URL(path, request.url));

  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
