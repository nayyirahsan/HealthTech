"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  PROFILE_SELECT,
  type UserProfileRow,
  type UserProfileUpdate,
  buildProfileSeed,
} from "@/lib/user-profile";

// ── Theme context ─────────────────────────────────────────────────────────────

type Theme = "dark" | "light";

interface ThemeCtx {
  theme:  Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

export function useTheme() { return useContext(ThemeContext); }

interface AuthCtx {
  user: User | null;
  profile: UserProfileRow | null;
  profileError: string | null;
  loading: boolean;
  refreshProfile: () => Promise<UserProfileRow | null>;
  updateProfile: (updates: UserProfileUpdate) => Promise<UserProfileRow | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  profile: null,
  profileError: null,
  loading: true,
  refreshProfile: async () => null,
  updateProfile: async () => null,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ── Providers ─────────────────────────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [theme, setTheme] = useState<Theme>("light");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  // Hydrate from localStorage after mount
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  // Apply class to <html> and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function finishAuthBootstrap() {
    setLoading(false);
  }

  const ensureProfile = useCallback(async (currentUser: User): Promise<UserProfileRow | null> => {
    if (!supabase) {
      return null;
    }

    const { data, error, status } = await supabase
      .from("users")
      .select(PROFILE_SELECT)
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error && status !== 406) {
      console.error("[providers] ensureProfile select error", error);
      throw error;
    }

    if (data) {
      setProfile(data);
      return data;
    }

    // Seed row in one upsert+returning roundtrip. Skipping `ignoreDuplicates`
    // so PostgREST returns the row regardless of whether a concurrent insert
    // landed first.
    const { data: created, error: upsertError } = await supabase
      .from("users")
      .upsert(
        { id: currentUser.id, ...buildProfileSeed(currentUser) },
        { onConflict: "id" }
      )
      .select(PROFILE_SELECT)
      .single();

    if (upsertError) {
      console.error("[providers] ensureProfile seed upsert error", upsertError);
      throw upsertError;
    }

    setProfile(created);
    return created;
  }, [supabase]);

  async function refreshProfile() {
    if (!supabase) {
      return null;
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    setUser(currentUser ?? null);

    if (!currentUser) {
      setProfile(null);
      return null;
    }

    return ensureProfile(currentUser);
  }

  async function updateProfile(updates: UserProfileUpdate) {
    if (!supabase) {
      throw new Error("Supabase client not ready. Please refresh the page.");
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      throw new Error("You must be logged in to update your profile.");
    }

    // Step 1: Save data (upsert without select to avoid chaining issues)
    const { error: upsertError } = await supabase
      .from("users")
      .upsert(
        { id: currentUser.id, email: currentUser.email ?? "", ...updates },
        { onConflict: "id" }
      );

    if (upsertError) {
      throw upsertError;
    }

    // Step 2: Read back the saved profile
    const { data, error: selectError } = await supabase
      .from("users")
      .select(PROFILE_SELECT)
      .eq("id", currentUser.id)
      .single();

    if (selectError) {
      throw selectError;
    }

    setProfileError(null);
    setProfile(data);
    return data;
  }

  async function signOut() {
    setUser(null);
    setProfile(null);
    finishAuthBootstrap();

    if (typeof window !== "undefined") {
      window.location.assign("/auth/signout");
    }
  }

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let mounted = true;

    async function loadAuth() {
      try {
        const result = await Promise.race([
          client.auth.getUser(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("auth.getUser timed out after 10s")), 10_000)
          ),
        ]);
        const currentUser = result.data.user;

        if (!mounted) return;

        setUser(currentUser ?? null);

        if (currentUser) {
          void ensureProfile(currentUser).catch((err) => {
            console.error("[providers] Failed to load user profile", err);
            if (mounted) {
              setProfileError(err instanceof Error ? err.message : "Failed to load profile");
            }
          });
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("[providers] Failed to initialize auth session", error);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) finishAuthBootstrap();
      }
    }

    loadAuth();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      finishAuthBootstrap();

      if (currentUser) {
        // Fire-and-forget so the listener returns immediately. Errors surface
        // through profileError instead of getting swallowed.
        void ensureProfile(currentUser).catch((err) => {
          console.error("[providers] auth-change ensureProfile failed", err);
          if (mounted) {
            setProfileError(err instanceof Error ? err.message : "Failed to load profile");
          }
        });
      } else {
        setProfile(null);
        setProfileError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile, supabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        profileError,
        loading,
        refreshProfile,
        updateProfile,
        signOut,
      }}
    >
      <ThemeContext.Provider value={{ theme, toggle }}>
        {children}
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}
