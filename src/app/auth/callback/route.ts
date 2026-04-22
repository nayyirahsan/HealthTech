import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  PROFILE_SELECT,
  buildProfileSeed,
  isOnboardingComplete,
} from "@/lib/user-profile";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const redirectBase = url.origin;
  const redirectTo = new URL("/dashboard", redirectBase);

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Missing+auth+code", redirectBase));
  }

  const supabase = createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, redirectBase));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=Unable+to+load+user", redirectBase));
  }

  const { data: existingProfile } = await supabase
    .from("users")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  let profile = existingProfile;

  if (!profile) {
    const { data: createdProfile, error: createProfileError } = await supabase
      .from("users")
      .insert({ id: user.id, ...buildProfileSeed(user) })
      .select(PROFILE_SELECT)
      .single();

    if (createProfileError) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(createProfileError.message)}`, redirectBase),
      );
    }

    profile = createdProfile;
  }

  if (!isOnboardingComplete(profile)) {
    return NextResponse.redirect(new URL("/onboarding", redirectBase));
  }

  if (next && next.startsWith("/")) {
    redirectTo.pathname = next;
    redirectTo.search = "";
  }

  return NextResponse.redirect(redirectTo);
}
