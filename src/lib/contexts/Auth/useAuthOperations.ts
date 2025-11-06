import { supabase } from "@/lib/database/supabase/client";
import { useSupabaseWithColdStart } from "@/lib/hooks/useSupabaseWithColdStart";
import { calculatePermissions } from "./permissions";
import type { UserProfile } from "./types";

export function useAuthOperations() {
  const { executeSupabaseOperation } = useSupabaseWithColdStart();

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false,
    session: any,
  ): Promise<{ success: boolean; error?: string }> => {
    const startTime = Date.now();
    console.log("🔍 [LOGIN] Starting login attempt...");
    console.log("📧 [LOGIN] Email:", email);
    console.log("💾 [LOGIN] Remember me:", rememberMe);

    try {
      // If user is already logged in and trying to log in with different credentials,
      // sign them out first to ensure clean state
      if (session?.user && session.user.email !== email.toLowerCase().trim()) {
        console.log(
          "🔄 [LOGIN] Different user detected, signing out current session...",
        );
        const signOutStartTime = Date.now();
        await executeSupabaseOperation(
          () => supabase.auth.signOut({ scope: "local" }),
          "Sign Out Current User",
        );
        console.log(
          `⏱️ [LOGIN] Sign out took ${Date.now() - signOutStartTime}ms`,
        );
      }

      console.log("⏱️ [LOGIN] Starting sign in with password...");
      const signInStartTime = Date.now();

      // Call Supabase directly to get better error handling
      const signInResult = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      const { data, error } = signInResult;

      console.log(`⏱️ [LOGIN] Sign in took ${Date.now() - signInStartTime}ms`);

      if (error) {
        console.error("❌ [LOGIN] Login error:", error);
        console.error("❌ [LOGIN] Error message:", error.message);
        console.error("❌ [LOGIN] Error status:", error.status);
        console.error("❌ [LOGIN] Full error:", JSON.stringify(error, null, 2));

        // Handle specific authentication errors with user-friendly messages
        const errorMessage = error.message || "";
        const lowerError = errorMessage.toLowerCase();

        if (
          lowerError.includes("invalid login credentials") ||
          lowerError.includes("invalid email or password") ||
          lowerError.includes("email not confirmed") ||
          lowerError.includes("user not found") ||
          lowerError.includes("wrong password")
        ) {
          console.log(`⏱️ [LOGIN] Login failed in ${Date.now() - startTime}ms`);
          return {
            success: false,
            error:
              "Invalid email or password. Please check your credentials or sign up if you don't have an account.",
          };
        }

        // Check for email confirmation issues
        if (
          lowerError.includes("email not confirmed") ||
          lowerError.includes("confirm your email")
        ) {
          return {
            success: false,
            error:
              "Please check your email and click the confirmation link before signing in.",
          };
        }

        console.log(`⏱️ [LOGIN] Login failed in ${Date.now() - startTime}ms`);
        return {
          success: false,
          error: error.message || "Login failed. Please try again.",
        };
      }

      // If authentication successful, let the auth state change handler deal with profile loading
      console.log(
        `✅ [LOGIN] Login completed successfully in ${Date.now() - startTime}ms`,
      );
      return { success: true };
    } catch (error) {
      console.error("❌ [LOGIN] Unexpected error:", error);
      console.log(`⏱️ [LOGIN] Login failed in ${Date.now() - startTime}ms`);
      return { success: false, error: "Network error occurred" };
    }
  };

  const signup = async (
    email: string,
    password: string,
    username: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Sign up with Supabase Auth using cold start handler
      const { data, error } = await executeSupabaseOperation(
        () =>
          supabase.auth.signUp({
            email: email.toLowerCase().trim(),
            password,
            options: {
              data: {
                username,
              },
            },
          }),
        "User Signup",
      );

      if (error) {
        return { success: false, error: error.message };
      }

      // If user was created, also create profile in users table
      if (data.user) {
        const { error: profileError } = await executeSupabaseOperation(
          async () => {
            const result = await supabase.from("users").insert({
              id: data.user.id,
              email: data.user.email,
              username,
              role: "newcomer",
              reputation_points: 0,
            });
            return result;
          },
          "Create User Profile",
        );

        if (profileError) {
          console.error("Error creating user profile:", profileError);
          return {
            success: false,
            error: "Account created but profile setup failed",
          };
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error: "Network error occurred" };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log("🔍 Starting logout process...");

      // Sign out from Supabase first - this will clear Supabase's session storage
      // This ensures the user is logged out regardless of "Remember Me" setting
      const { error } = await executeSupabaseOperation(
        () => supabase.auth.signOut({ scope: "local" }),
        "User Logout",
      );

      // Clear app-specific caches after sign out (don't clear Supabase's storage)
      if (typeof window !== "undefined") {
        // Clear app-specific localStorage items (but preserve Supabase's session storage)
        try {
          const keysToRemove: string[] = [];
          // Get all keys and filter out Supabase's internal storage
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              // Only clear app-specific keys, not Supabase's auth storage
              // Supabase uses keys like 'sb-<project>-auth-token' which we should preserve
              // until signOut completes, then Supabase will clear them itself
              // Don't touch keys that start with 'sb-' (Supabase) or other system keys
              if (
                key.startsWith("supplementiq_") ||
                key === "supplementiq_user_edits" ||
                key.includes("user_preferences") ||
                key.includes("product_cache") ||
                key.includes("edit_cache") ||
                key.includes("products:v1") ||
                key.startsWith("user_preferences_")
              ) {
                keysToRemove.push(key);
              }
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key));
          console.log(
            `🗑️ Cleared ${keysToRemove.length} app-specific localStorage items`,
          );
        } catch (e) {
          console.warn("Failed to clear app localStorage:", e);
        }

        // Clear sessionStorage (this is safe, Supabase uses localStorage)
        try {
          sessionStorage.clear();
          console.log("🗑️ Cleared sessionStorage");
        } catch (e) {
          console.warn("Failed to clear sessionStorage:", e);
        }

        // Clear any service worker caches if they exist
        try {
          if ("indexedDB" in window && "caches" in window) {
            const cacheKeys = await caches.keys();
            await Promise.all(cacheKeys.map((key) => caches.delete(key)));
            console.log("🗑️ Cleared service worker caches");
          }
        } catch (e) {
          console.warn("Failed to clear caches:", e);
        }
      }

      if (error) {
        console.error("Logout error:", error);
        throw error;
      }

      console.log("✅ Logout completed successfully");

      // Redirect to login page so user can log in with a different account
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    } catch (error) {
      console.error("Logout error:", error);

      // Still redirect to login even if there was an error
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }
  };

  const updateUserProfile = async (
    user: UserProfile,
    updates: Partial<UserProfile>,
    setUser: (user: UserProfile | null) => void,
    setPermissions: (permissions: any) => void,
    session: any,
    fetchUserProfile: any,
  ): Promise<void> => {
    if (!user) return;

    try {
      // Optimistically update the user state
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);

      // Recalculate permissions if role changed
      if (updates.role) {
        setPermissions(calculatePermissions(updates.role));
      }

      // Update user profile in database using cold start handler
      await executeSupabaseOperation(async () => {
        const result = await supabase
          .from("users")
          .update(updates)
          .eq("id", user.id);
        return result;
      }, "Update User Profile");
    } catch (error) {
      console.error("Error updating user profile:", error);
      // Revert optimistic update
      await fetchUserProfile(session?.user!);
    }
  };

  return { login, signup, logout, updateUserProfile };
}
