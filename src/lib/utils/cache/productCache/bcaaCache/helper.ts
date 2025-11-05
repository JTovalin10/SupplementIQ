import { getRedis } from "../redis";

export type BCAATopItem = {
  productId: string;
  details: Record<string, unknown>;
};

const KEY = "top:bcaa";

async function fetchTopFromApi(): Promise<BCAATopItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const res = await fetch(`${baseUrl}/api/products/bcaa/top-product`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.items || []) as BCAATopItem[];
}

export async function seedBCAATop(): Promise<void> {
  const redis = getRedis();
  const items = (await fetchTopFromApi()).slice(0, 75);
  if (redis) {
    await redis.set(KEY, JSON.stringify(items), 86400);
    return;
  }
}

export async function getBCAATop(): Promise<BCAATopItem[]> {
  const redis = getRedis();
  if (redis) {
    const cached = await redis.get(KEY);
    if (cached) return JSON.parse(cached) as BCAATopItem[];
    await seedBCAATop();
    const afterSeed = await redis.get(KEY);
    return afterSeed ? (JSON.parse(afterSeed) as BCAATopItem[]) : [];
  }
  return await fetchTopFromApi();
}
