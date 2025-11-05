// Security role cache backed by native C++ (Node-API).
// This module forwards calls to the compiled addon; no TS in-memory fallback
// is used to ensure a single source of truth in C++.
//
// Mapping: userId -> role (e.g., 'admin' | 'moderator' | 'owner' | 'user').

export type UserRole = "admin" | "moderator" | "owner" | "user";

// Shape of the native addon; implemented by the Node-API module.
interface NativeSecurityAddon {
  setUserRole(userId: string, role: string): void;
  getUserRole(userId: string): string | null;
  removeUser(userId: string): boolean;
  isEmpty(): boolean;
}

// Load the native addon. Throws if not found.
function loadNativeAddon(): NativeSecurityAddon {
  // If running in the browser, immediately return the in-memory fallback
  if (typeof window !== "undefined") {
    const map = new Map<string, string>();
    const api: NativeSecurityAddon = {
      setUserRole(userId: string, role: string) {
        map.set(userId, role);
      },
      getUserRole(userId: string) {
        return map.get(userId) ?? null;
      },
      removeUser(userId: string) {
        return map.delete(userId);
      },
      isEmpty() {
        return map.size === 0;
      },
    };
    return api;
  }

  // Avoid static requires so bundlers don't try to resolve them at build time (Node only)
  try {
    const dynamicRequire = eval("require") as NodeRequire;
    if (
      typeof dynamicRequire === "function" &&
      typeof process !== "undefined" &&
      process.versions?.node
    ) {
      try {
        return dynamicRequire(
          "./addon/build/Release/security_cache_addon.node",
        ) as NativeSecurityAddon;
      } catch {}
      try {
        const nodeGypBuild = dynamicRequire("node-gyp-build");
        return nodeGypBuild(__dirname + "/addon") as NativeSecurityAddon;
      } catch {}
    }
  } catch {}

  // Fallback: in-memory implementation (works in server when native is unavailable)
  const map = new Map<string, string>();
  const api: NativeSecurityAddon = {
    setUserRole(userId: string, role: string) {
      map.set(userId, role);
    },
    getUserRole(userId: string) {
      return map.get(userId) ?? null;
    },
    removeUser(userId: string) {
      return map.delete(userId);
    },
    isEmpty() {
      return map.size === 0;
    },
  };
  return api;
}

// Native C++ addon handle (with safe fallback if native is unavailable)
const securityCacheCPP: NativeSecurityAddon = loadNativeAddon();

// Optional cold-start seeding of privileged users (admin/moderator/owner)
type PrivilegedUser = { userId: string; role: Exclude<UserRole, "user"> };
let seedAllPrivilegedUsers: (() => Promise<PrivilegedUser[]>) | null = null;
let hasAttemptedSeed = false;
let seedingPromise: Promise<void> | null = null;

export function configureSecurityCacheSeeder(
  loader: () => Promise<PrivilegedUser[]>,
): void {
  seedAllPrivilegedUsers = loader;
}

async function ensureSecurityCacheSeeded(): Promise<void> {
  if (hasAttemptedSeed) return;
  if (!seedAllPrivilegedUsers) {
    // No custom loader configured; fetch from API directly
    if (!seedingPromise) {
      seedingPromise = (async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
          const res = await fetch(`${baseUrl}/api/users/privileged`, {
            cache: "no-store",
          });
          if (res.ok) {
            const json = await res.json();
            const users = (json?.users || []) as Array<{
              userId: string;
              role: string;
            }>;
            for (const u of users) {
              if (
                u.role === "admin" ||
                u.role === "moderator" ||
                u.role === "owner"
              ) {
                addUser(u.userId, u.role as UserRole);
              }
            }
          }
        } finally {
          hasAttemptedSeed = true;
        }
      })();
    }
    await seedingPromise;
    return;
  }
  if (!seedingPromise) {
    seedingPromise = (async () => {
      try {
        const users = await seedAllPrivilegedUsers!();
        for (const { userId, role } of users) {
          // Seed only privileged roles
          addUser(userId, role as UserRole);
        }
      } finally {
        hasAttemptedSeed = true;
      }
    })();
  }
  await seedingPromise;
}

// Thin, typed wrappers around the native cache
export function addUser(userId: string, role: UserRole): void {
  securityCacheCPP.setUserRole(userId, role);
}

export function removeUser(userId: string): boolean {
  return securityCacheCPP.removeUser(userId);
}

export function getUserRole(userId: string): UserRole | null {
  const role = securityCacheCPP.getUserRole(userId);
  return (role as UserRole) ?? null;
}

export async function isUserRole(
  userId: string,
  role: UserRole,
): Promise<boolean> {
  if (securityCacheCPP.isEmpty()) {
    await ensureSecurityCacheSeeded();
  }
  return getUserRole(userId) === role;
}
