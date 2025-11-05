import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cache, cacheKeys, invalidatePattern, withCache } from "../../../cache";

// Simple in-memory dummy database for testing
const dummyDb: Record<string, { id: string; name: string }> = {
  "1": { id: "1", name: "Alpha" },
  "2": { id: "2", name: "Bravo" },
  "3": { id: "3", name: "Charlie" },
};

// Temporary fetch function that simulates a cold-start DB fetch
async function fetchFromDummyDb(id: string) {
  // Simulate minimal latency
  return dummyDb[id];
}

beforeEach(() => {
  cache.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SupplementIQ security cache", () => {
  it("warms on cold start and returns cached on subsequent calls", async () => {
    const key = cacheKeys.product("1");
    const spy = vi.fn(() => fetchFromDummyDb("1"));

    const first = await withCache(key, spy, 60);
    const second = await withCache(key, spy, 60);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ id: "1", name: "Alpha" });
    expect(second).toEqual(first);
  });

  it("respects TTL and refreshes after expiry", async () => {
    vi.useFakeTimers();
    const t0 = new Date("2025-01-01T00:00:00.000Z").getTime();
    vi.setSystemTime(t0);

    const key = cacheKeys.product("2");
    const spy = vi.fn(() => fetchFromDummyDb("2"));

    // Prime cache with TTL = 1 second
    const first = await withCache(key, spy, 1);
    expect(first).toEqual({ id: "2", name: "Bravo" });
    expect(spy).toHaveBeenCalledTimes(1);

    // Advance time beyond TTL
    vi.setSystemTime(t0 + 2000);

    const second = await withCache(key, spy, 1);
    expect(second).toEqual({ id: "2", name: "Bravo" });
    // Should have fetched again due to expiry
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("cleanup removes expired entries and leaves fresh ones", async () => {
    vi.useFakeTimers();
    const t0 = new Date("2025-01-01T00:00:00.000Z").getTime();
    vi.setSystemTime(t0);

    // Set two short-lived entries and one longer-lived
    cache.set("short:1", { v: 1 }, 1);
    cache.set("short:2", { v: 2 }, 1);
    cache.set("long:1", { v: 3 }, 10);

    // Advance past short TTL
    vi.setSystemTime(t0 + 2000);

    const removed = cache.cleanup();
    expect(removed).toBe(2);

    expect(cache.has("short:1")).toBe(false);
    expect(cache.has("short:2")).toBe(false);
    expect(cache.has("long:1")).toBe(true);
  });

  it("invalidatePattern removes matching keys only", async () => {
    cache.set(cacheKeys.product("10"), { id: "10" }, 60);
    cache.set(cacheKeys.product("20"), { id: "20" }, 60);
    cache.set(cacheKeys.user("42"), { id: "42" }, 60);

    const invalidated = invalidatePattern("product:");
    expect(invalidated).toBe(2);

    expect(cache.has(cacheKeys.product("10"))).toBe(false);
    expect(cache.has(cacheKeys.product("20"))).toBe(false);
    expect(cache.has(cacheKeys.user("42"))).toBe(true);
  });

  it("cacheKeys generators produce stable keys", () => {
    expect(cacheKeys.product("x")).toBe("product:x");
    expect(cacheKeys.user("y")).toBe("user:y");
    expect(cacheKeys.ingredients()).toBe("ingredients:all");
  });

  it("getStats reflects hit counts, average hits, and hit rate", () => {
    const k1 = cacheKeys.product("stats-1");
    const k2 = cacheKeys.product("stats-2");

    cache.set(k1, { v: 1 }, 60);
    cache.set(k2, { v: 2 }, 60);

    // 3 hits on k1, 0 hits on k2
    expect(cache.get(k1)).toEqual({ v: 1 });
    expect(cache.get(k1)).toEqual({ v: 1 });
    expect(cache.get(k1)).toEqual({ v: 1 });

    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.totalHits).toBe(3);
    expect(stats.avgHits).toBe(1.5);
    expect(stats.hitRate).toBe(0.6); // 3 / (3 + 2)
  });

  it("has/delete/clear behave correctly, including expired entries", () => {
    vi.useFakeTimers();
    const t0 = new Date("2025-01-01T00:00:00.000Z").getTime();
    vi.setSystemTime(t0);

    const k = cacheKeys.user("has-test");
    cache.set(k, { id: "has-test" }, 1);
    expect(cache.has(k)).toBe(true);

    // Expire it
    vi.setSystemTime(t0 + 2000);
    expect(cache.has(k)).toBe(false);

    // Re-add and delete
    cache.set(k, { id: "has-test" }, 60);
    expect(cache.delete(k)).toBe(true);
    expect(cache.has(k)).toBe(false);
    // Deleting non-existing returns false
    expect(cache.delete(k)).toBe(false);

    // Clear removes everything
    const k2 = cacheKeys.user("another");
    cache.set(k, { id: "has-test" }, 60);
    cache.set(k2, { id: "another" }, 60);
    cache.clear();
    const statsAfterClear = cache.getStats();
    expect(statsAfterClear.size).toBe(0);
    expect(cache.keys()).toEqual([]);
  });

  it("direct TTL on set expires as expected", () => {
    vi.useFakeTimers();
    const start = new Date("2025-02-01T00:00:00.000Z").getTime();
    vi.setSystemTime(start);

    const k = cacheKeys.product("ttl-direct");
    cache.set(k, { ok: true }, 1);
    expect(cache.get(k)).toEqual({ ok: true });

    // After >1s it is gone
    vi.setSystemTime(start + 1500);
    expect(cache.get(k)).toBeNull();
  });

  it("withCache propagates errors and does not cache failures", async () => {
    const k = cacheKeys.product("error");
    const failing = vi.fn(async () => {
      throw new Error("boom");
    });

    await expect(withCache(k, failing, 60)).rejects.toThrow("boom");

    // Next call with a working function should execute (no stale cache)
    const ok = vi.fn(async () => ({ id: "ok" }));
    const result = await withCache(k, ok, 60);
    expect(result).toEqual({ id: "ok" });
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it("withCache concurrent calls with same key execute underlying fn per call", async () => {
    // Current implementation has no in-flight dedupe; document behavior
    const k = cacheKeys.product("concurrent");
    const slow = vi.fn(
      () =>
        new Promise<{ id: string }>((resolve) =>
          setTimeout(() => resolve({ id: "c" }), 10),
        ),
    );

    const [a, b] = await Promise.all([
      withCache(k, slow, 60),
      withCache(k, slow, 60),
    ]);

    expect(a).toEqual({ id: "c" });
    expect(b).toEqual({ id: "c" });
    expect(slow).toHaveBeenCalledTimes(2);
  });
});
