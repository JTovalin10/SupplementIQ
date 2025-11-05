import { getRedis } from "../redis";

export type FatBurnerTopItem = {
  productId: string;
  details: Record<string, unknown>;
};

const KEY = "top:fat_burner";

async function fetchTopFromApi(): Promise<FatBurnerTopItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const res = await fetch(`${baseUrl}/api/products/fat-burner/top-product`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.items || []) as FatBurnerTopItem[];
}

export async function seedFatBurnerTop(): Promise<void> {
  const redis = getRedis();
  const items = (await fetchTopFromApi()).slice(0, 75);
  if (redis) {
    await redis.set(KEY, JSON.stringify(items), 86400);
    return;
  }
}

export async function getFatBurnerTop(): Promise<FatBurnerTopItem[]> {
  const redis = getRedis();
  if (redis) {
    const cached = await redis.get(KEY);
    if (cached) return JSON.parse(cached) as FatBurnerTopItem[];
    await seedFatBurnerTop();
    const afterSeed = await redis.get(KEY);
    return afterSeed ? (JSON.parse(afterSeed) as FatBurnerTopItem[]) : [];
  }
  return await fetchTopFromApi();
}
