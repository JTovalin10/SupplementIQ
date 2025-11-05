// Preworkout top-products cache helper backed by Redis (falls back to native addon if not configured)

import { getRedis } from "../redis";

export type PreworkoutTopItem = {
  productId: string;
  details: Record<string, unknown>;
};

const KEY = "top:preworkout";

async function fetchTopFromApi(): Promise<PreworkoutTopItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const res = await fetch(`${baseUrl}/api/products/preworkout/top-product`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.items || []) as PreworkoutTopItem[];
}

export async function seedPreworkoutTop(): Promise<void> {
  const redis = getRedis();
  const items = (await fetchTopFromApi()).slice(0, 75);
  if (redis) {
    await redis.set(KEY, JSON.stringify(items), 86400);
    return;
  }
}

export async function getPreworkoutTop(): Promise<PreworkoutTopItem[]> {
  const redis = getRedis();
  if (redis) {
    const cached = await redis.get(KEY);
    if (cached) return JSON.parse(cached) as PreworkoutTopItem[];
    await seedPreworkoutTop();
    const afterSeed = await redis.get(KEY);
    return afterSeed ? (JSON.parse(afterSeed) as PreworkoutTopItem[]) : [];
  }
  // Fallback: fetch directly if Redis unavailable
  return await fetchTopFromApi();
}
