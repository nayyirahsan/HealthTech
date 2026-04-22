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
  loading: boolean;
  refreshProfile: () => Promise<UserProfileRow | null>;
  updateProfile: (updates: UserProfileUpdate) => Promise<UserProfileRow | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  profile: null,
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
      throw error;
    }

    if (data) {
      setProfile(data);
      return data;
    }

    const { data: created, error: insertError } = await supabase
      .from("users")
      .insert({ id: currentUser.id, ...buildProfileSeed(currentUser) })
      .select(PROFILE_SELECT)
      .single();

    if (insertError) {
      throw insertError;
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
      return null;
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return null;
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", currentUser.id)
      .select(PROFILE_SELECT)
      .single();

    if (error) {
      throw error;
    }

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
        const {
          data: { user: currentUser },
        } = await client.auth.getUser();

        if (!mounted) return;

        setUser(currentUser ?? null);
        finishAuthBootstrap();

        if (currentUser) {
          void ensureProfile(currentUser).catch((error) => {
            console.error("Failed to load user profile", error);
          });
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Failed to initialize auth session", error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          finishAuthBootstrap();
        }
      } finally {
        if (mounted) finishAuthBootstrap();
      }
    }

    loadAuth();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        finishAuthBootstrap();

        if (currentUser) {
          await ensureProfile(currentUser);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Failed to process auth state change", error);
        if (mounted) {
          finishAuthBootstrap();
        }
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
