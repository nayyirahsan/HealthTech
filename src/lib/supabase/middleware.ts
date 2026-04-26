import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath } from "@/lib/app-routes";
import {
  PROFILE_SELECT,
  isOnboardingComplete,
} from "@/lib/user-profile";

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

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

  let user: User | null = null;
  try {
    const result = await withTimeout(supabase.auth.getUser(), 8_000, "middleware getUser");
    user = result.data.user;
  } catch (err) {
    console.error("[middleware] getUser failed:", err);
    // Treat as unauthenticated rather than blocking the request indefinitely.
  }

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

  let profile = null;
  try {
    const { data } = await withTimeout(
      supabase
        .from("users")
        .select(PROFILE_SELECT)
        .eq("id", user.id)
        .maybeSingle(),
      8_000,
      "middleware profile select"
    );
    profile = data;
  } catch (err) {
    // If the profile query fails (missing columns, network error, timeout),
    // treat as incomplete so the user reaches onboarding where ensureProfile can retry.
    console.error("[middleware] profile select failed:", err);
  }

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
