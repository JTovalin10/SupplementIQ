import { getRedis } from "../redis";

export type EAATopItem = {
  productId: string;
  details: Record<string, unknown>;
};

const KEY = "top:eaa";

async function fetchTopFromApi(): Promise<EAATopItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const res = await fetch(`${baseUrl}/api/products/eaa/top-product`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.items || []) as EAATopItem[];
}

export async function seedEAATop(): Promise<void> {
  const redis = getRedis();
  const items = (await fetchTopFromApi()).slice(0, 75);
  if (redis) {
    await redis.set(KEY, JSON.stringify(items), 86400);
    return;
  }
}

export async function getEAATop(): Promise<EAATopItem[]> {
  const redis = getRedis();
  if (redis) {
    const cached = await redis.get(KEY);
    if (cached) return JSON.parse(cached) as EAATopItem[];
    await seedEAATop();
    const afterSeed = await redis.get(KEY);
    return afterSeed ? (JSON.parse(afterSeed) as EAATopItem[]) : [];
  }
  return await fetchTopFromApi();
}
