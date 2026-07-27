import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getOptionalPublicEnvironment } from "@/lib/environment";

export async function updateSupabaseSession(request: NextRequest) {
  const isAdminLogin = request.nextUrl.pathname === "/admin/login";
  const environment = getOptionalPublicEnvironment();
  if (!environment) {
    if (!isAdminLogin) {
      return NextResponse.redirect(
        new URL("/admin/login?error=configuration", request.url),
      );
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const hasSupabaseSession = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
  if (!hasSupabaseSession) {
    if (!isAdminLogin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, responseHeaders) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(responseHeaders).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  if ((error || !data?.claims?.sub) && !isAdminLogin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return response;
}
