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
    const p: Profile = {
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
    };
    setProfile(p);
    return p;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

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

        const p = await fetchProfile(userData.user.id);
        if (!p) {
          await supabase.auth.signOut();
          if (!cancelled) clearAuthState();
          return;
        }
      } catch (err) {
        console.warn("Auth init failed:", err);
        if (!cancelled) clearAuthState();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        fetchProfile(session.user.id).then((p) => {
          if (!p) {
            supabase.auth.signOut().finally(() => clearAuthState());
          }
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchProfile, clearAuthState]);

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
