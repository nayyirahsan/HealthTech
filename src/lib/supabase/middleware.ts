import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath } from "@/lib/app-routes";
import {
  PROFILE_SELECT,
  isOnboardingComplete,
} from "@/lib/user-profile";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const loginUrl = new URL("/login", request.url);
  const dashboardUrl = new URL("/dashboard", request.url);
  const onboardingUrl = new URL("/onboarding", request.url);

  function redirectWithCookies(url: URL) {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, {
        domain: cookie.domain,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        path: cookie.path,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
      });
    });
    return response;
  }

  if (!user && !isPublicPath(pathname)) {
    loginUrl.searchParams.set("next", pathname);
    return redirectWithCookies(loginUrl);
  }

  if (!user) {
    return supabaseResponse;
  }

  if (pathname.startsWith("/auth")) {
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("users")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  const complete = isOnboardingComplete(profile);

  if (pathname === "/login") {
    return redirectWithCookies(complete ? dashboardUrl : onboardingUrl);
  }

  if (!complete && pathname !== "/onboarding") {
    return redirectWithCookies(onboardingUrl);
  }

  if (complete && pathname === "/onboarding") {
    return redirectWithCookies(dashboardUrl);
  }

  return supabaseResponse;
}
