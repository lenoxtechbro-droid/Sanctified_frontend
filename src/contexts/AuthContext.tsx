import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile, UserRole } from "../types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Profile is imported from types/index.ts

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  role: "listener",
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
  }, []);

  const buildProfile = (profileData: Profile): Profile => ({
    id: profileData.id,
    email: profileData.email ?? null,
    full_name: profileData.full_name ?? null,
    avatar_url: profileData.avatar_url ?? null,
    role: profileData.role ?? "listener",
    sermons_listened: profileData.sermons_listened ?? 0,
    hours_this_month: profileData.hours_this_month ?? 0,
    favorites_count: profileData.favorites_count ?? 0,
    created_at: profileData.created_at,
    updated_at: profileData.updated_at,
  });

  /**
   * Try to create a profile row for users whose DB trigger didn't fire
   * (e.g. signed up before trigger existed, or trigger hit a race condition).
   */
  const ensureProfile = useCallback(async (u: User): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: u.id,
          email: u.email ?? null,
          full_name: u.user_metadata?.full_name ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true }
      )
      .select("*")
      .single();

    if (error) {
      console.warn("Profile upsert error:", error);
      return null;
    }
    const profileData = data as Profile | null;
    if (!profileData) return null;
    const p = buildProfile(profileData);
    setProfile(p);
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.warn("Profile fetch error:", error);
      setProfile(null);
      return null;
    }
    // Cast data to Profile type since Supabase type inference may not work correctly
    const profileData = data as Profile | null;
    if (!profileData) {
      setProfile(null);
      return null;
    }
    const p = buildProfile(profileData);
    setProfile(p);
    return p;
  }, []);

  /**
   * Fetch the profile for a user, and if it doesn't exist, create it.
   * This prevents the forced sign-out that was happening before.
   */
  const fetchOrCreateProfile = useCallback(async (u: User): Promise<Profile | null> => {
    const existing = await fetchProfile(u.id);
    if (existing) return existing;

    // Profile row is missing — create it as a fallback
    console.info("Profile missing for authenticated user, creating one...");
    return ensureProfile(u);
  }, [fetchProfile, ensureProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchOrCreateProfile(user);
  }, [user, fetchOrCreateProfile]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const sessionUser = sessionData.session?.user ?? null;
        if (!sessionUser) {
          if (!cancelled) clearAuthState();
          return;
        }

        // IMPORTANT: validate the session with Supabase.
        // getSession() can return a cached session even if the user was deleted in Supabase.
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          await supabase.auth.signOut();
          if (!cancelled) clearAuthState();
          return;
        }

        if (cancelled) return;
        setUser(userData.user);

        // Fetch or create profile — don't sign out if missing
        await fetchOrCreateProfile(userData.user);
      } catch (err) {
        console.warn("Auth init failed:", err);
        if (!cancelled) clearAuthState();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        clearAuthState();
        return;
      }

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        // For email confirmation or sign-in, fetch or create profile
        fetchOrCreateProfile(sessionUser);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchOrCreateProfile, clearAuthState]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearAuthState();
  }, [clearAuthState]);

  const role: UserRole = profile?.role ?? "listener";
  const value: AuthState = {
    user,
    profile,
    role,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
