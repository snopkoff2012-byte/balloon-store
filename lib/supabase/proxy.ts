import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getOptionalPublicEnvironment } from "@/lib/environment";

export async function updateSupabaseSession(request: NextRequest) {
  const environment = getOptionalPublicEnvironment();
  if (!environment) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const hasSupabaseSession = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
  if (!hasSupabaseSession) {
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

  await supabase.auth.getClaims();
  return response;
}
